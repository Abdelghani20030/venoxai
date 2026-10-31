import pg from 'pg';
import crypto from 'node:crypto';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function verifyPassword(password, hash, salt) {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
  } catch (e) {
    console.error('verifyPassword error:', e.message);
    return false;
  }
}

try {
  const testPassword = "TestSync2026!";
  const testEmail = "test-sync@venoxa.test";
  
  const result = await pool.query('SELECT id, email, password_hash, salt FROM users WHERE email = $1', [testEmail]);
  if (result.rows.length === 0) {
    console.log('User not found');
  } else {
    const user = result.rows[0];
    console.log(`User found: #${user.id} ${user.email}`);
    console.log(`Hash: ${user.password_hash.substring(0, 20)}...`);
    console.log(`Salt: ${user.salt}`);
    
    const isValid = verifyPassword(testPassword, user.password_hash, user.salt);
    console.log(`Password verify result: ${isValid}`);
    
    // Also try hashing the password with the same salt and comparing
    const checkHash = crypto.scryptSync(testPassword, user.salt, 64).toString("hex");
    console.log(`Check hash matches stored: ${checkHash === user.password_hash}`);
  }
} catch (err) {
  console.error('Error:', err);
} finally {
  await pool.end();
}
