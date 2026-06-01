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

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  const secret = getJwtSecret();
  const key = await getCryptoKey(secret);

  const header = { alg: "HS256", typ: "JWT" };
  const enrichedPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(enrichedPayload)));

  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataToSign);
  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload> {
  const secret = getJwtSecret();
  const key = await getCryptoKey(secret);

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const signatureBytes = base64UrlDecode(encodedSignature);

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes as any,
    dataToVerify
  );

  if (!isValid) {
    throw new Error("Invalid JWT signature");
  }

  const decodedPayload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(encodedPayload))
  );

  if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT has expired");
  }

  return decodedPayload as AuthTokenPayload;
}
