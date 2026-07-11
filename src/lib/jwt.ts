import jwt from "jsonwebtoken";
import { env } from "@/env";

function getJwtSecret(): string {
  return env.JWT_SECRET;
}

export type JWTPayload = {
  userId: string;
  email: string;
  role: string;
};

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

function isJWTPayload(payload: unknown): payload is JWTPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "email" in payload &&
    "role" in payload
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!isJWTPayload(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
