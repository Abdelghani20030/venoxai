import { Router, type Request, type Response } from "express";
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

// Helper to merge lists of items based on a unique identifier
function mergeArraysById(localList: any[] | undefined, dbList: any[] | undefined, key = "id") {
  const mergedMap = new Map<string, any>();
  if (Array.isArray(dbList)) {
    for (const item of dbList) {
      if (item) {
        const val = item[key];
        if (val !== undefined && val !== null) {
          mergedMap.set(String(val).toLowerCase(), item);
        }
      }
    }
  }
  if (Array.isArray(localList)) {
    for (const item of localList) {
      if (item) {
        const val = item[key];
        if (val !== undefined && val !== null) {
          mergedMap.set(String(val).toLowerCase(), item);
        }
      }
    }
  }
  return Array.from(mergedMap.values());
}

// Helper to merge Spaced Repetition (SRS) objects mapping words to scheduling states
function mergeSrsObjects(localSrs: Record<string, any> | undefined, dbSrs: Record<string, any> | undefined) {
  const merged = { ...(dbSrs || {}) };
  if (localSrs) {
    for (const [word, localVal] of Object.entries(localSrs)) {
      const dbVal = merged[word];
      if (!dbVal) {
        merged[word] = localVal;
      } else {
        const localNext = localVal && typeof localVal === "object" ? Number(localVal.nextReview || 0) : 0;
        const dbNext = dbVal && typeof dbVal === "object" ? Number(dbVal.nextReview || 0) : 0;
        if (localNext > dbNext) {
          merged[word] = localVal;
        }
      }
    }
  }
  return merged;
}

// POST /api/user/sync
router.post("/user/sync", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { 
    xp, streak, level, completedCells, usageTime, calendarDays, achievements, avatar,
    globalVocab, phrasalVocab, idiomsVocab, idiomsProperVocab, langeekVocab,
    speakingHistory, writingHistory, srsData, langeekSrsData,
    phrasalSrs, idiomsSrs, idiomsProperSrs,
    planConfig, studiedWords
  } = req.body;

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
    const mergedLevel = level || user.level;

    // Merge completed cells (combining keys)
    const mergedCells = { ...user.completedCells, ...(completedCells || {}) };

    // Merge usage time (taking max value for each day to avoid double counting)
    const mergedUsage: Record<string, number> = { ...user.usageTime };
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

    // Synchronize vocab lists (by unique "word" key)
    const mergedGlobalVocab = mergeArraysById(globalVocab, user.globalVocab, "word");
    const mergedPhrasalVocab = mergeArraysById(phrasalVocab, user.phrasalVocab, "word");
    const mergedIdiomsVocab = mergeArraysById(idiomsVocab, user.idiomsVocab, "word");
    const mergedIdiomsProperVocab = mergeArraysById(idiomsProperVocab, user.idiomsProperVocab, "word");
    const mergedLangeekVocab = mergeArraysById(langeekVocab, user.langeekVocab, "word");

    // Synchronize practice histories (by unique "id" key)
    const mergedSpeakingHistory = mergeArraysById(speakingHistory, user.speakingHistory, "id");
    const mergedWritingHistory = mergeArraysById(writingHistory, user.writingHistory, "id");

    // Synchronize Spaced Repetition (SRS) data
    const mergedSrsData = mergeSrsObjects(srsData, user.srsData);
    const mergedLangeekSrsData = mergeSrsObjects(langeekSrsData, user.langeekSrsData);
    const mergedPhrasalSrs = mergeSrsObjects(phrasalSrs, (user as any).phrasalSrs);
    const mergedIdiomsSrs = mergeSrsObjects(idiomsSrs, (user as any).idiomsSrs);
    const mergedIdiomsProperSrs = mergeSrsObjects(idiomsProperSrs, (user as any).idiomsProperSrs);

    // Merge plan config — local always wins (latest device is authoritative)
    const mergedPlanConfig = planConfig && Object.keys(planConfig).length > 0
      ? planConfig
      : (user.planConfig && Object.keys(user.planConfig).length > 0 ? user.planConfig : {});

    // Merge studied words — union of both sets
    const mergedStudiedWords = Array.from(new Set([
      ...(Array.isArray(user.studiedWords) ? user.studiedWords : []),
      ...(Array.isArray(studiedWords) ? studiedWords : [])
    ]));

    const updateFields: any = {
      xp: mergedXp,
      streak: mergedStreak,
      level: mergedLevel,
      completedCells: mergedCells,
      usageTime: mergedUsage,
      calendarDays: mergedCalendar,
      achievements: mergedAchievements,
      globalVocab: mergedGlobalVocab,
      phrasalVocab: mergedPhrasalVocab,
      idiomsVocab: mergedIdiomsVocab,
      idiomsProperVocab: mergedIdiomsProperVocab,
      langeekVocab: mergedLangeekVocab,
      speakingHistory: mergedSpeakingHistory,
      writingHistory: mergedWritingHistory,
      srsData: mergedSrsData,
      langeekSrsData: mergedLangeekSrsData,
      phrasalSrs: mergedPhrasalSrs,
      idiomsSrs: mergedIdiomsSrs,
      idiomsProperSrs: mergedIdiomsProperSrs,
      planConfig: mergedPlanConfig,
      studiedWords: mergedStudiedWords,
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

// POST /api/user/sync-beacon — lightweight endpoint for navigator.sendBeacon
router.post("/user/sync-beacon", async (req: Request, res: Response) => {
  const { token: beaconToken, ...syncData } = req.body;
  if (!beaconToken) {
    res.status(401).end();
    return;
  }
  
  // Note: we need to import verifyToken at the top of the file!
  const { verifyToken } = require("../lib/crypto");
  const decoded = verifyToken(beaconToken);
  if (!decoded) {
    res.status(401).end();
    return;
  }
  const userId = decoded.userId;

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users.length === 0) {
      res.status(404).end();
      return;
    }
    const user = users[0];

    const {
      xp, streak, level, completedCells, usageTime, calendarDays, achievements, avatar,
      globalVocab, phrasalVocab, idiomsVocab, idiomsProperVocab, langeekVocab,
      speakingHistory, writingHistory, srsData, langeekSrsData,
      phrasalSrs, idiomsSrs, idiomsProperSrs,
      planConfig, studiedWords
    } = syncData;

    const mergedXp = Math.max(user.xp, xp || 0);
    const mergedStreak = Math.max(user.streak, streak || 0);
    const mergedLevel = level || user.level;
    const mergedCells = { ...user.completedCells, ...(completedCells || {}) };
    
    const mergedUsage: Record<string, number> = { ...user.usageTime };
    if (usageTime) {
      for (const [day, mins] of Object.entries(usageTime)) {
        mergedUsage[day] = Math.max(mergedUsage[day] || 0, mins as number);
      }
    }
    
    const mergedCalendar = Array.from(new Set([...(user.calendarDays || []), ...(calendarDays || [])]));
    const mergedAchievements = Array.from(new Set([...(user.achievements || []), ...(achievements || [])]));
    const mergedGlobalVocab = mergeArraysById(globalVocab, user.globalVocab, "word");
    const mergedPhrasalVocab = mergeArraysById(phrasalVocab, user.phrasalVocab, "word");
    const mergedIdiomsVocab = mergeArraysById(idiomsVocab, user.idiomsVocab, "word");
    const mergedIdiomsProperVocab = mergeArraysById(idiomsProperVocab, user.idiomsProperVocab, "word");
    const mergedLangeekVocab = mergeArraysById(langeekVocab, user.langeekVocab, "word");
    const mergedSpeakingHistory = mergeArraysById(speakingHistory, user.speakingHistory, "id");
    const mergedWritingHistory = mergeArraysById(writingHistory, user.writingHistory, "id");
    const mergedSrsData = mergeSrsObjects(srsData, user.srsData);
    const mergedLangeekSrsData = mergeSrsObjects(langeekSrsData, user.langeekSrsData);
    const mergedPhrasalSrs = mergeSrsObjects(phrasalSrs, (user as any).phrasalSrs);
    const mergedIdiomsSrs = mergeSrsObjects(idiomsSrs, (user as any).idiomsSrs);
    const mergedIdiomsProperSrs = mergeSrsObjects(idiomsProperSrs, (user as any).idiomsProperSrs);
    const mergedPlanConfig = planConfig && Object.keys(planConfig).length > 0
      ? planConfig : (user.planConfig && Object.keys(user.planConfig).length > 0 ? user.planConfig : {});
    const mergedStudiedWords = Array.from(new Set([
      ...(Array.isArray(user.studiedWords) ? user.studiedWords : []),
      ...(Array.isArray(studiedWords) ? studiedWords : [])
    ]));

    const updateFields: any = {
      xp: mergedXp, streak: mergedStreak, level: mergedLevel,
      completedCells: mergedCells, usageTime: mergedUsage,
      calendarDays: mergedCalendar, achievements: mergedAchievements,
      globalVocab: mergedGlobalVocab, phrasalVocab: mergedPhrasalVocab,
      idiomsVocab: mergedIdiomsVocab, idiomsProperVocab: mergedIdiomsProperVocab,
      langeekVocab: mergedLangeekVocab, speakingHistory: mergedSpeakingHistory,
      writingHistory: mergedWritingHistory, srsData: mergedSrsData,
      langeekSrsData: mergedLangeekSrsData,
      phrasalSrs: mergedPhrasalSrs, idiomsSrs: mergedIdiomsSrs,
      idiomsProperSrs: mergedIdiomsProperSrs,
      planConfig: mergedPlanConfig, studiedWords: mergedStudiedWords
    };
    if (avatar !== undefined) updateFields.avatar = avatar;

    await db.update(usersTable).set(updateFields).where(eq(usersTable.id, userId));
    res.status(204).end();
  } catch (err) {
    res.status(500).end();
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
