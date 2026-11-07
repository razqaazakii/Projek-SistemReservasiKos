export interface AeadEncryptedResult {
  algorithm: string;
  keyLength: number;
  iv: string;
  tag: string;
  ciphertext: string;
  aad: string;
  serialized: string;
}

export interface AeadPayloadInput {
  ciphertext: string;
  iv: string;
  tag: string;
  aad?: string;
}

export interface SerializedAeadPayload {
  version: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export function generateSessionToken(hexLength?: number): string;
export function generateSalt(): string;
export function validateTokenFormat(token: unknown): boolean;
export function hashPassword(password: string, customSalt?: string | null): { hash: string; salt: string };
export function verifyPassword(password: string, storedHashHex: string, storedSaltHex: string): boolean;
export function generateBookingMac(data: string, secretKey: string): string;
export function verifyBookingMac(data: string, secretKey: string, mac: string): boolean;
export function hashReservationData(reservationObject: unknown): string;
export function hashPasswordBcrypt(password: string, saltRounds?: number): Promise<string>;
export function verifyPasswordBcrypt(password: string, storedHash: string): Promise<boolean>;

// Tugas 2 - AEAD (AES-256-GCM)
export function generateAeadKey(): string;
export function encryptProductAead(
  plaintext: string | object,
  secretKey?: string | Buffer | null,
  aad?: string | Buffer
): AeadEncryptedResult;

export function decryptProductAead(
  encryptedPayload: AeadPayloadInput | string,
  secretKey?: string | Buffer | null,
  expectedAad?: string | Buffer | null
): string;

export function encryptProductData(
  productData: string | object,
  secretKey?: string | Buffer | null,
  contextAad?: string | Buffer
): AeadEncryptedResult;

export function decryptProductData(
  encryptedPayload: AeadPayloadInput | string,
  secretKey?: string | Buffer | null,
  expectedContextAad?: string | Buffer | null
): string;

export function decryptProductDataJson<T = unknown>(
  encryptedPayload: AeadPayloadInput | string,
  secretKey?: string | Buffer | null,
  expectedContextAad?: string | Buffer | null
): T;

export function serializeAeadPayload(payload: { iv: string; tag: string; ciphertext: string }): string;
export function deserializeAeadPayload(serialized: string): SerializedAeadPayload;
