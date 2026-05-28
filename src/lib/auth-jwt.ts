import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role?: "customer" | "admin";
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Please define the JWT_SECRET environment variable.");
  }

  return secret;
}

const JWT_SECRET = getJwtSecret();

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}
