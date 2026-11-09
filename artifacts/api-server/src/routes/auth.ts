import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword, verifyPassword, signToken } from "../lib/crypto";

const router = Router();

// POST /api/auth/register
router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, username, dob, gender, languages } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    // Check if email already exists
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }

    // Hash password natively
    const { hash, salt } = hashPassword(password);

    // Create user
    const [newUser] = await db.insert(usersTable).values({
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      username: username || "New Learner",
      dob: dob || null,
      gender: gender || null,
      languages: languages || ["English"],
      xp: 0,
      streak: 0,
    }).returning();

    // Create token
    const token = signToken({ userId: newUser.id });

    // Exclude password hash and salt from response
    const { passwordHash: _, salt: __, ...userProfile } = newUser;

    res.status(201).json({
      token,
      user: userProfile
    });
  } catch (err) {
    req.log.error({ err }, "Registration failed");
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const users = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
    if (users.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const user = users[0];
    const isPasswordValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Update last active
    await db.update(usersTable)
      .set({ lastActive: new Date() })
      .where(eq(usersTable.id, user.id));

    const token = signToken({ userId: user.id });
    const { passwordHash: _, salt: __, ...userProfile } = user;

    res.json({
      token,
      user: userProfile
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

export default router;
