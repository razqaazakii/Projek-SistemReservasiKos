/**
 * crypto_core.test.js
 * Skenario uji Jest untuk modul lib/crypto_core.js
 *
 * Mencakup 4 kategori skenario uji:
 *  1. Positif  – perilaku normal yang diharapkan
 *  2. Negatif  – input tidak valid / kondisi error
 *  3. Batas    – nilai-nilai di ujung/tepi (edge case)
 *  4. Vektor   – nilai deterministik (test vector) untuk konsistensi hash
 */

const {
  generateSalt,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateTokenFormat,
} = require('../lib/crypto_core');

// ═══════════════════════════════════════════════════════════
// SKENARIO 1 – POSITIF (Perilaku Normal)
// ═══════════════════════════════════════════════════════════
describe('Skenario Positif', () => {
  test('hashPassword menghasilkan objek { hash, salt } yang valid', () => {
    const result = hashPassword('passwordKuat123!');
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('salt');
    expect(typeof result.hash).toBe('string');
    expect(typeof result.salt).toBe('string');
    expect(result.hash.length).toBeGreaterThan(0);
  });

  test('verifyPassword mengembalikan true untuk password yang benar', () => {
    const password = 'passwordKuat123!';
    const { hash, salt } = hashPassword(password);
    expect(verifyPassword(password, hash, salt)).toBe(true);
  });

  test('generateSessionToken menghasilkan token hex 96 karakter', () => {
    const token = generateSessionToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(96); // 48 bytes × 2
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  test('validateTokenFormat mengembalikan true untuk token yang valid', () => {
    const token = generateSessionToken();
    expect(validateTokenFormat(token)).toBe(true);
  });

  test('Dua panggilan generateSessionToken menghasilkan token yang berbeda', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1).not.toBe(token2);
  });

  test('generateSalt menghasilkan salt hex 64 karakter', () => {
    const salt = generateSalt();
    expect(salt.length).toBe(64); // 32 bytes × 2
    expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// SKENARIO 2 – NEGATIF (Input Tidak Valid / Error)
// ═══════════════════════════════════════════════════════════
describe('Skenario Negatif', () => {
  test('hashPassword melempar Error jika password adalah string kosong', () => {
    expect(() => hashPassword('')).toThrow('Password harus berupa string yang tidak kosong.');
  });

  test('hashPassword melempar Error jika password bukan string (angka)', () => {
    expect(() => hashPassword(12345)).toThrow(Error);
  });

  test('hashPassword melempar Error jika password adalah null', () => {
    expect(() => hashPassword(null)).toThrow(Error);
  });

  test('verifyPassword mengembalikan false untuk password yang salah', () => {
    const { hash, salt } = hashPassword('passwordBenar');
    expect(verifyPassword('passwordSalah', hash, salt)).toBe(false);
  });

  test('verifyPassword mengembalikan false jika salt dipalsukan', () => {
    const { hash } = hashPassword('passwordBenar');
    const saltPalsu = generateSalt();
    expect(verifyPassword('passwordBenar', hash, saltPalsu)).toBe(false);
  });

  test('verifyPassword mengembalikan false jika password adalah string kosong', () => {
    const { hash, salt } = hashPassword('passwordBenar');
    expect(verifyPassword('', hash, salt)).toBe(false);
  });

  test('validateTokenFormat mengembalikan false untuk token terlalu pendek', () => {
    expect(validateTokenFormat('abc123')).toBe(false);
  });

  test('validateTokenFormat mengembalikan false untuk string bukan hex', () => {
    const tidakHex = 'Z'.repeat(96);
    expect(validateTokenFormat(tidakHex)).toBe(false);
  });

  test('validateTokenFormat mengembalikan false untuk non-string', () => {
    expect(validateTokenFormat(null)).toBe(false);
    expect(validateTokenFormat(123)).toBe(false);
    expect(validateTokenFormat(undefined)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// SKENARIO 3 – BATAS (Edge Case / Nilai Tepi)
// ═══════════════════════════════════════════════════════════
describe('Skenario Batas', () => {
  test('hashPassword berhasil untuk password 1 karakter', () => {
    const result = hashPassword('a');
    expect(result.hash).toBeTruthy();
    expect(result.salt).toBeTruthy();
  });

  test('hashPassword berhasil untuk password sangat panjang (1000 karakter)', () => {
    const longPassword = 'a'.repeat(1000);
    const result = hashPassword(longPassword);
    expect(result.hash).toBeTruthy();
  });

  test('hashPassword berhasil untuk password berisi karakter Unicode', () => {
    const unicodePassword = 'كلمةالمرور🔐密码パスワード';
    const result = hashPassword(unicodePassword);
    expect(result.hash).toBeTruthy();
    expect(verifyPassword(unicodePassword, result.hash, result.salt)).toBe(true);
  });

  test('hashPassword dengan salt yang diberikan menghasilkan hash yang sama setiap kali', () => {
    const salt = generateSalt();
    const result1 = hashPassword('testPassword', salt);
    const result2 = hashPassword('testPassword', salt);
    expect(result1.hash).toBe(result2.hash);
  });

  test('hashPassword dengan salt berbeda menghasilkan hash berbeda untuk password sama', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const result1 = hashPassword('samePwd', salt1);
    const result2 = hashPassword('samePwd', salt2);
    expect(result1.hash).not.toBe(result2.hash);
  });

  test('validateTokenFormat mengembalikan false untuk string hex terlalu panjang (97 karakter)', () => {
    const terlampauPanjang = 'a'.repeat(97);
    expect(validateTokenFormat(terlampauPanjang)).toBe(false);
  });

  test('validateTokenFormat mengembalikan false untuk string hex kurang 1 karakter (95 karakter)', () => {
    const kurang = 'a'.repeat(95);
    expect(validateTokenFormat(kurang)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════
// SKENARIO 4 – VEKTOR (Test Vector / Konsistensi Hash)
// ═══════════════════════════════════════════════════════════
describe('Skenario Vektor (Test Vector)', () => {
  /**
   * Vektor referensi yang dihitung secara manual / deterministik.
   * Jika implementasi hashPassword berubah, tes ini akan gagal
   * sebagai peringatan bahwa kompatibilitas mundur mungkin terganggu.
   *
   * Cara menghitung:
   *   combined = "<salt>:<password>:<pepper>"
   *   hash     = SHA-256(combined).hex
   *
   * PEPPER default = 'reservasi-kos-pepper-2026'
   */

  const KNOWN_SALT     = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';
  const KNOWN_PASSWORD = 'VektorUji@2026';
  const KNOWN_PEPPER   = 'reservasi-kos-pepper-2026';

  // Hitung expected hash secara independen di dalam test
  const { createHash } = require('crypto');
  const EXPECTED_HASH  = createHash('sha256')
    .update(`${KNOWN_SALT}:${KNOWN_PASSWORD}:${KNOWN_PEPPER}`, 'utf8')
    .digest('hex');

  test('hashPassword menghasilkan hash yang identik untuk input yang sama (deterministik)', () => {
    // Pastikan CRYPTO_PEPPER tidak di-override oleh environment
    const original = process.env.CRYPTO_PEPPER;
    delete process.env.CRYPTO_PEPPER;

    const { hash } = hashPassword(KNOWN_PASSWORD, KNOWN_SALT);
    expect(hash).toBe(EXPECTED_HASH);

    if (original !== undefined) process.env.CRYPTO_PEPPER = original;
  });

  test('verifyPassword berhasil memvalidasi dengan vektor yang diketahui', () => {
    const original = process.env.CRYPTO_PEPPER;
    delete process.env.CRYPTO_PEPPER;

    expect(verifyPassword(KNOWN_PASSWORD, EXPECTED_HASH, KNOWN_SALT)).toBe(true);

    if (original !== undefined) process.env.CRYPTO_PEPPER = original;
  });

  test('verifyPassword gagal untuk password berbeda pada vektor yang sama', () => {
    const original = process.env.CRYPTO_PEPPER;
    delete process.env.CRYPTO_PEPPER;

    expect(verifyPassword('PasswordSalah!', EXPECTED_HASH, KNOWN_SALT)).toBe(false);

    if (original !== undefined) process.env.CRYPTO_PEPPER = original;
  });

  test('Format hash adalah string hex 64 karakter (SHA-256 output)', () => {
    const { hash } = hashPassword(KNOWN_PASSWORD, KNOWN_SALT);
    expect(hash.length).toBe(64);         // SHA-256 = 32 bytes = 64 hex chars
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });
});
