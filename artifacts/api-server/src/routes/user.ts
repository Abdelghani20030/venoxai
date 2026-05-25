import { Router, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/user/profile
router.get("/user/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const { passwordHash: _, salt: __, ...userProfile } = users[0];
    res.json(userProfile);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch profile");
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// PUT /api/user/profile
router.put("/user/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { username, email, dob, gender, languages, dailyGoalMins, level, plan } = req.body;

  try {
    const updateData: Partial<typeof usersTable.$inferInsert> = {};

    if (username !== undefined) updateData.username = username;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (languages !== undefined) updateData.languages = languages;
    if (dailyGoalMins !== undefined) updateData.dailyGoalMins = Number(dailyGoalMins);
    if (level !== undefined) updateData.level = level;
    if (plan !== undefined) updateData.plan = plan;

    if (email !== undefined) {
      const cleanEmail = email.toLowerCase().trim();
      // Check if email is taken by another user
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, cleanEmail)).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        res.status(400).json({ error: "Email is already taken by another account." });
        return;
      }
      updateData.email = cleanEmail;
    }

    const [updatedUser] = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning();

    const { passwordHash: _, salt: __, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// POST /api/user/sync
router.post("/user/sync", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { xp, streak, level, completedCells, usageTime, calendarDays, achievements, avatar } = req.body;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const user = users[0];

    // Merging logic
    const mergedXp = Math.max(user.xp, xp || 0);
    const mergedStreak = Math.max(user.streak, streak || 0);
    const mergedLevel = level || user.level; // prioritize incoming if set

    // Merge completed cells (combining keys)
    const mergedCells = { ...user.completedCells, ...(completedCells || {}) };

    // Merge usage time (taking max value for each day to avoid double counting)
    const mergedUsage = { ...user.usageTime };
    if (usageTime) {
      for (const [day, mins] of Object.entries(usageTime)) {
        mergedUsage[day] = Math.max(mergedUsage[day] || 0, mins as number);
      }
    }

    // Merge calendar days (unique values)
    const mergedCalendar = Array.from(new Set([
      ...(user.calendarDays || []),
      ...(calendarDays || [])
    ]));

    // Merge achievements/badges
    const mergedAchievements = Array.from(new Set([
      ...(user.achievements || []),
      ...(achievements || [])
    ]));

    const updateFields: any = {
      xp: mergedXp,
      streak: mergedStreak,
      level: mergedLevel,
      completedCells: mergedCells,
      usageTime: mergedUsage,
      calendarDays: mergedCalendar,
      achievements: mergedAchievements,
    };

    if (avatar !== undefined) {
      updateFields.avatar = avatar;
    }

    const [updatedUser] = await db.update(usersTable)
      .set(updateFields)
      .where(eq(usersTable.id, userId))
      .returning();

    const { passwordHash: _, salt: __, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (err) {
    req.log.error({ err }, "Sync failed");
    res.status(500).json({ error: "Failed to sync user progress." });
  }
});

// DELETE /api/user/profile
router.delete("/user/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    req.log.error({ err }, "Failed to delete account");
    res.status(500).json({ error: "Failed to delete account." });
  }
});

export default router;
