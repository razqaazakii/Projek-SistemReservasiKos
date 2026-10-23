const crypto = require('crypto');

/**
 * Generate session token acak.
 * @param {number} hexLength - Panjang output dalam karakter hex (bukan bytes). Default 96.
 */
function generateSessionToken(hexLength = 96) {
  return crypto.randomBytes(hexLength / 2).toString('hex');
}

/**
 * Generate salt acak, output 64 karakter hex (32 bytes).
 */
function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validasi format token: harus string, hex valid, panjang tepat 96 karakter.
 */
function validateTokenFormat(token) {
  if (typeof token !== 'string') return false;
  if (token.length !== 96) return false;
  return /^[0-9a-f]+$/.test(token);
}

/**
 * Hash password dengan SHA-256 menggunakan pola: SHA-256("salt:password:pepper").
 * @param {string} password
 * @param {string|null} customSalt - Salt dalam bentuk hex string (opsional).
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
 * Verifikasi password terhadap hash yang tersimpan.
 * Menggunakan SHA-256 dengan pola: SHA-256("salt:password:pepper").
 */
function verifyPassword(password, storedHashHex, storedSaltHex) {
  if (typeof password !== 'string' || password === '') return false;
  try {
    const { hash: recalculatedHash } = hashPassword(password, storedSaltHex);
    const expectedBuffer     = Buffer.from(storedHashHex, 'hex');
    const recalculatedBuffer = Buffer.from(recalculatedHash, 'hex');

    if (expectedBuffer.length !== recalculatedBuffer.length) return false;

    return crypto.timingSafeEqual(expectedBuffer, recalculatedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate HMAC-SHA256 dari data reservasi.
 * @param {string} data
 * @param {string} secretKey
 * @returns {string} hex MAC
 */
function generateBookingMac(data, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('hex');
}

/**
 * Verifikasi HMAC-SHA256 dari data reservasi (timing-safe).
 * @param {string} data
 * @param {string} secretKey
 * @param {string} mac - Hex MAC yang akan diverifikasi
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
 * Hash objek reservasi menjadi SHA-256 hex string.
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

module.exports = {
  generateSessionToken,
  generateSalt,
  validateTokenFormat,
  hashPassword,
  verifyPassword,
  generateBookingMac,
  verifyBookingMac,
  hashReservationData
};