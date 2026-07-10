import jwt from "jsonwebtoken";
import { env } from "@/env";

const JWT_SECRET = env.JWT_SECRET;

export type JWTPayload = {
  userId: string;
  phone: string;
  role: string;
};

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function isJWTPayload(payload: unknown): payload is JWTPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "phone" in payload &&
    "role" in payload
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isJWTPayload(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
