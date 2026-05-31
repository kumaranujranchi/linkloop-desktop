import { DatabaseReader, DatabaseWriter } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to convert Uint8Array/ArrayBuffer to hex string
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to convert hex string back to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Generate a cryptographically secure random salt (hex string)
export function generateSalt(): string {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  return bufToHex(saltBytes.buffer);
}

// Hash password using PBKDF2 with SHA-256
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const saltBuf = hexToBuf(saltHex);
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuf as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    256 // length in bits (32 bytes)
  );

  return bufToHex(derivedKey);
}

// Generate a random session token
export function generateSessionToken(): string {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  return bufToHex(tokenBytes.buffer);
}

// Create a new session for a user
export async function createSession(db: DatabaseWriter, userId: Id<"users">) {
  const token = generateSessionToken();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  await db.insert("sessions", {
    userId,
    token,
    expiresAt,
  });
  return { token, expiresAt };
}

// Get user ID associated with a valid session token
export async function getUserIdFromToken(db: DatabaseReader, token: string): Promise<Id<"users"> | null> {
  const session = await db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    return null;
  }

  return session.userId;
}

// Clean up expired sessions for a user
export async function cleanExpiredSessions(db: DatabaseWriter, userId: Id<"users">) {
  const sessions = await db
    .query("sessions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const now = Date.now();
  for (const session of sessions) {
    if (session.expiresAt < now) {
      await db.delete(session._id);
    }
  }
}
