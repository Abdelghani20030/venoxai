import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET || "venoxa-default-fallback-secret-key-2026-secure-hashing";

function base64url(str: string): string {
  return Buffer.from(str).toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signToken(payload: { userId: number }): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify({ 
    ...payload, 
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  }));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
  return `${signatureInput}.${signature}`;
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) return null; // Expired
    return payload;
  } catch (err) {
    return null;
  }
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
  } catch {
    return false;
  }
}
