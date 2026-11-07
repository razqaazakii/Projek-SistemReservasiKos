const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Pembangkitan token sesi kriptografis.
 * @param {number} hexLength - Panjang output dalam karakter hex (default: 96 karakter = 48 bytes)
 * @returns {string} Token sesi hex
 */
function generateSessionToken(hexLength = 96) {
  return crypto.randomBytes(hexLength / 2).toString('hex');
}

/**
 * Pembangkitan salt acak 256-bit menggunakan CSPRNG.
 * @returns {string} Salt 64 karakter hex (32 bytes)
 */
function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validasi format token sesi (harus string hex 96 karakter).
 * @param {unknown} token
 * @returns {boolean}
 */
function validateTokenFormat(token) {
  if (typeof token !== 'string') return false;
  if (token.length !== 96) return false;
  return /^[0-9a-fA-F]+$/.test(token);
}

/**
 * Hash password dengan SHA-256 + Salt + Pepper.
 * @param {string} password
 * @param {string|null} customSalt - Salt dalam format hex string (opsional)
 * @returns {{ hash: string, salt: string }}
 */
function hashPassword(password, customSalt = null) {
  if (typeof password !== 'string' || password === '') {
    throw new Error('Password harus berupa string yang tidak kosong.');
  }

  let saltHex;
  if (customSalt) {
    saltHex = typeof customSalt === 'string' ? customSalt : Buffer.from(customSalt).toString('hex');
  } else {
    saltHex = crypto.randomBytes(32).toString('hex');
  }

  const pepper = process.env.CRYPTO_PEPPER || 'reservasi-kos-pepper-2026';
  const combined = `${saltHex}:${password}:${pepper}`;

  // SHA-256 = 32 bytes = 64 karakter hex
  const hash = crypto.createHash('sha256').update(combined, 'utf8').digest('hex');

  return {
    salt: saltHex,
    hash
  };
}

/**
 * Verifikasi password terhadap hash tersimpan dengan perbandingan timing-safe.
 * @param {string} password
 * @param {string} storedHashHex
 * @param {string} storedSaltHex
 * @returns {boolean}
 */
function verifyPassword(password, storedHashHex, storedSaltHex) {
  if (typeof password !== 'string' || password === '') return false;
  try {
    const { hash: recalculatedHash } = hashPassword(password, storedSaltHex);
    const expectedBuffer = Buffer.from(storedHashHex, 'hex');
    const recalculatedBuffer = Buffer.from(recalculatedHash, 'hex');

    if (expectedBuffer.length !== recalculatedBuffer.length) return false;

    return crypto.timingSafeEqual(expectedBuffer, recalculatedBuffer);
  } catch {
    return false;
  }
}

/**
 * Pembangkitan HMAC-SHA256 untuk integritas data reservasi.
 * @param {string} data
 * @param {string} secretKey
 * @returns {string} Nilai MAC 64 karakter hex
 */
function generateBookingMac(data, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('hex');
}

/**
 * Verifikasi HMAC-SHA256 dengan perbandingan timing-safe.
 * @param {string} data
 * @param {string} secretKey
 * @param {string} mac - Nilai MAC yang akan diverifikasi
 * @returns {boolean}
 */
function verifyBookingMac(data, secretKey, mac) {
  try {
    const expectedMac = generateBookingMac(data, secretKey);
    const expectedBuffer = Buffer.from(expectedMac, 'hex');
    const receivedBuffer = Buffer.from(mac, 'hex');
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Menghasilkan SHA-256 hash dari objek reservasi dengan kanonikalisasi urutan kunci JSON.
 * @param {unknown} reservationObject
 * @returns {string} Hash 64 karakter hex
 */
function hashReservationData(reservationObject) {
  if (!reservationObject || typeof reservationObject !== 'object') {
    return crypto.createHash('sha256').update(String(reservationObject), 'utf8').digest('hex');
  }
  const sortedKeys = Object.keys(reservationObject).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = reservationObject[key];
  }
  const canonicalString = JSON.stringify(sortedObj);
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Hash password menggunakan pustaka Bcrypt dengan cost factor adaptif.
 * @param {string} password
 * @param {number} saltRounds - Default: 10 putaran
 * @returns {Promise<string>}
 */
async function hashPasswordBcrypt(password, saltRounds = 10) {
  if (typeof password !== 'string' || password.trim() === '') {
    throw new Error('Password harus berupa string yang tidak kosong.');
  }
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verifikasi password Bcrypt.
 * @param {string} password
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
async function verifyPasswordBcrypt(password, storedHash) {
  if (typeof password !== 'string' || !password || !storedHash) {
    return false;
  }
  try {
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

// ============================================================================
// TUGAS 2: ENKRIPSI TERAUTENTIKASI (AEAD) & INTEGRITAS DATA PRODUK
// Algoritma: AES-256-GCM (Galois/Counter Mode) via Node.js crypto
// ============================================================================

/**
 * Pembangkitan kunci enkripsi AEAD 256-bit (32 bytes) menggunakan CSPRNG.
 * Kunci ini wajib disimpan di luar repository (environment variable .env).
 * @returns {string} Kunci 64 karakter hexadecimal (256-bit)
 */
function generateAeadKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Helper internal: Normalisasi dan validasi kunci 256-bit.
 * Memastikan prinsip Gagal Tertutup (Fail-Closed) jika format kunci tidak memenuhi syarat 32 bytes.
 * @param {string|Buffer|null} key
 * @returns {Buffer} Buffer kunci 32 bytes
 */
function normalizeAeadKey(key) {
  let rawKey = key;
  if (!rawKey && typeof process !== 'undefined' && process.env) {
    rawKey = process.env.PRODUCT_ENCRYPTION_KEY;
  }

  if (!rawKey) {
    throw new TypeError(
      'Kunci enkripsi AEAD tidak ditemukan. Berikan parameter kunci 256-bit atau set environment variable PRODUCT_ENCRYPTION_KEY.'
    );
  }

  if (Buffer.isBuffer(rawKey)) {
    if (rawKey.length !== 32) {
      throw new TypeError(`Panjang kunci AEAD tidak sah: ${rawKey.length} byte. Kunci wajib berukuran tepat 32 byte (256-bit).`);
    }
    return rawKey;
  }

  if (typeof rawKey === 'string') {
    const trimmed = rawKey.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      throw new TypeError(
        `Format kunci AEAD tidak sah: harus berupa 64 karakter hexadecimal (32 byte / 256-bit). Diterima: ${trimmed.length} karakter.`
      );
    }
    return Buffer.from(trimmed, 'hex');
  }

  throw new TypeError('Tipe data kunci AEAD tidak sah: harus berupa string hexadecimal 64 karakter atau Buffer 32 byte.');
}

/**
 * Melindungi kerahasiaan dan integritas data produk menggunakan Enkripsi Terautentikasi (AEAD) AES-256-GCM.
 *
 * Parameter Kriptografi Terdokumentasi:
 * - Panjang Kunci: 256-bit (32 bytes)
 * - Nonce / IV: 96-bit (12 bytes) unik per operasi via CSPRNG (tidak pernah diulang)
 * - AAD: Additional Authenticated Data (pengikat konteks seperti ID kamar/produk)
 * - Tag Otentikasi: 128-bit (16 bytes) GMAC tag
 *
 * @param {string|object} plaintext - Data produk / informasi kamar kos yang dilindungi
 * @param {string|Buffer|null} [secretKey=null] - Kunci 256-bit (default: membaca PRODUCT_ENCRYPTION_KEY)
 * @param {string|Buffer} [aad=''] - Additional Authenticated Data untuk mengikat konteks produk
 * @returns {{
 *   algorithm: string,
 *   keyLength: number,
 *   iv: string,
 *   tag: string,
 *   ciphertext: string,
 *   aad: string,
 *   serialized: string
 * }}
 */
function encryptProductAead(plaintext, secretKey = null, aad = '') {
  if (plaintext === null || plaintext === undefined) {
    throw new TypeError('Masukan plaintext tidak boleh null atau undefined.');
  }

  const keyBuffer = normalizeAeadKey(secretKey);

  // Serialisasi data produk jika berupa objek
  const dataString = typeof plaintext === 'object' ? JSON.stringify(plaintext) : String(plaintext);

  // Bangkitkan Nonce / IV unik 96-bit (12 bytes) melalui CSPRNG
  const ivBuffer = crypto.randomBytes(12);

  // Inisialisasi Cipher AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, ivBuffer);

  // Lampirkan AAD jika ada untuk context-binding (mencegah context swap)
  const aadString = typeof aad === 'string' ? aad : (Buffer.isBuffer(aad) ? aad.toString('utf8') : String(aad || ''));
  if (aadString.length > 0) {
    cipher.setAAD(Buffer.from(aadString, 'utf8'));
  }

  // Enkripsi ciphertext
  const ciphertextBuffer = Buffer.concat([
    cipher.update(dataString, 'utf8'),
    cipher.final()
  ]);

  // Ekstrak Authentication Tag 128-bit (16 bytes)
  const tagBuffer = cipher.getAuthTag();

  const ivHex = ivBuffer.toString('hex');
  const tagHex = tagBuffer.toString('hex');
  const ciphertextHex = ciphertextBuffer.toString('hex');

  // Format serialisasi portabel ringkas: v1:<iv>:<tag>:<ciphertext>
  const serialized = `v1:${ivHex}:${tagHex}:${ciphertextHex}`;

  return {
    algorithm: 'aes-256-gcm',
    keyLength: 256,
    iv: ivHex,
    tag: tagHex,
    ciphertext: ciphertextHex,
    aad: aadString,
    serialized
  };
}

/**
 * Mendekripsi data produk dan memverifikasi integritasnya menggunakan AES-256-GCM.
 * Bersifat Gagal Tertutup (Fail-Closed):
 * - Jika data ciphertext diubah 1 bit saja -> Ditolak.
 * - Jika tag otentikasi dimodifikasi -> Ditolak.
 * - Jika AAD tidak cocok -> Ditolak.
 * - Jika kunci yang digunakan salah -> Ditolak.
 * Sistem melempar exception tertutup dan TIDAK PERNAH mengembalikan potongan data atau plaintext.
 *
 * @param {object|string} encryptedPayload - Objek { ciphertext, iv, tag, aad? } atau format string serial
 * @param {string|Buffer|null} [secretKey=null] - Kunci 256-bit (default: membaca PRODUCT_ENCRYPTION_KEY)
 * @param {string|Buffer|null} [expectedAad=null] - AAD yang diharapkan untuk memverifikasi konteks
 * @returns {string} Plaintext data produk yang terverifikasi utuh
 */
function decryptProductAead(encryptedPayload, secretKey = null, expectedAad = null) {
  const keyBuffer = normalizeAeadKey(secretKey);

  let ivHex, tagHex, ciphertextHex, payloadAad;

  if (typeof encryptedPayload === 'string') {
    const parts = encryptedPayload.split(':');
    if (parts.length === 4 && parts[0] === 'v1') {
      [, ivHex, tagHex, ciphertextHex] = parts;
      payloadAad = '';
    } else {
      throw new Error('Format string terenkripsi tidak sah. Format yang diharapkan: v1:<iv>:<tag>:<ciphertext>');
    }
  } else if (typeof encryptedPayload === 'object' && encryptedPayload !== null) {
    ivHex = encryptedPayload.iv;
    tagHex = encryptedPayload.tag;
    ciphertextHex = encryptedPayload.ciphertext;
    payloadAad = encryptedPayload.aad || '';
  } else {
    throw new TypeError('Masukan payload terenkripsi tidak sah: harus berupa objek atau string serial.');
  }

  // Validasi parameter masukan secara ketat (Fail-Closed)
  if (typeof ivHex !== 'string' || !/^[0-9a-fA-F]{24}$/.test(ivHex)) {
    throw new Error('IV / Nonce tidak sah: wajib berupa string hexadecimal 24 karakter (12 bytes / 96-bit).');
  }

  if (typeof tagHex !== 'string' || !/^[0-9a-fA-F]{32}$/.test(tagHex)) {
    throw new Error('Tag otentikasi tidak sah: wajib berupa string hexadecimal 32 karakter (16 bytes / 128-bit).');
  }

  if (typeof ciphertextHex !== 'string' || !/^[0-9a-fA-F]*$/.test(ciphertextHex)) {
    throw new Error('Ciphertext tidak sah: wajib berupa string hexadecimal.');
  }

  // Tentukan AAD yang digunakan untuk verifikasi integritas konteks
  const aadToUse = expectedAad !== null ? String(expectedAad) : String(payloadAad || '');

  const ivBuffer = Buffer.from(ivHex, 'hex');
  const tagBuffer = Buffer.from(tagHex, 'hex');
  const ciphertextBuffer = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);

  if (aadToUse.length > 0) {
    decipher.setAAD(Buffer.from(aadToUse, 'utf8'));
  }

  // Pasang tag otentikasi 128-bit
  decipher.setAuthTag(tagBuffer);

  // Proses dekripsi dengan jaminan fail-closed
  try {
    const part1 = decipher.update(ciphertextBuffer);
    const part2 = decipher.final(); // Verifikasi otentikasi Galois Field GMAC dievaluasi di sini
    const decryptedBuffer = Buffer.concat([part1, part2]);
    return decryptedBuffer.toString('utf8');
  } catch {
    // Gagal Tertutup: Jangan bocorkan rincian galat kriptografi internal atau plaintext parsial
    throw new Error('Autentikasi data gagal: data ciphertext, tag otentikasi, atau konteks AAD telah dimodifikasi, atau kunci salah.');
  }
}

/**
 * Helper: Enkripsi data produk kamar kos (alias ramah konteks bisnis)
 */
function encryptProductData(productData, secretKey = null, contextAad = '') {
  return encryptProductAead(productData, secretKey, contextAad);
}

/**
 * Helper: Dekripsi data produk kamar kos (alias ramah konteks bisnis)
 */
function decryptProductData(encryptedPayload, secretKey = null, expectedContextAad = null) {
  return decryptProductAead(encryptedPayload, secretKey, expectedContextAad);
}

/**
 * Helper: Dekripsi data produk dan langsung mengonversinya kembali ke objek JSON.
 */
function decryptProductDataJson(encryptedPayload, secretKey = null, expectedContextAad = null) {
  const plaintext = decryptProductAead(encryptedPayload, secretKey, expectedContextAad);
  return JSON.parse(plaintext);
}

/**
 * Helper: Serialisasi payload terenkripsi ke format portabel string
 */
function serializeAeadPayload({ iv, tag, ciphertext }) {
  if (!iv || !tag || !ciphertext) {
    throw new Error('Payload tidak lengkap untuk diserialisasi: membutuhkan iv, tag, dan ciphertext.');
  }
  return `v1:${iv}:${tag}:${ciphertext}`;
}

/**
 * Helper: Deserialisasi string portabel ke objek
 */
function deserializeAeadPayload(serialized) {
  if (typeof serialized !== 'string') {
    throw new TypeError('Masukan harus berupa string serial.');
  }
  const parts = serialized.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Format serialisasi tidak sah. Harus berformat v1:<iv>:<tag>:<ciphertext>');
  }
  return {
    version: parts[0],
    iv: parts[1],
    tag: parts[2],
    ciphertext: parts[3]
  };
}

module.exports = {
  // Komponen Dasar (Tugas 1 & Milestone)
  generateSessionToken,
  generateSalt,
  validateTokenFormat,
  hashPassword,
  verifyPassword,
  generateBookingMac,
  verifyBookingMac,
  hashReservationData,
  hashPasswordBcrypt,
  verifyPasswordBcrypt,

  // Komponen Tugas 2: AEAD AES-256-GCM
  generateAeadKey,
  encryptProductAead,
  decryptProductAead,
  encryptProductData,
  decryptProductData,
  decryptProductDataJson,
  serializeAeadPayload,
  deserializeAeadPayload
};
