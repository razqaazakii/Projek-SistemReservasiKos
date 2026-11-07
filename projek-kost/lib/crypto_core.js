const crypto = require('crypto');
const bcrypt = require('bcryptjs');

function generateSessionToken(hexLength = 96) {
  return crypto.randomBytes(hexLength / 2).toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function validateTokenFormat(token) {
  if (typeof token !== 'string') return false;
  if (token.length !== 96) return false;
  return /^[0-9a-f]+$/.test(token);
}

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

function generateBookingMac(data, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(data, 'utf8').digest('hex');
}

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

async function hashPasswordBcrypt(password, saltRounds = 10) {
  if (typeof password !== 'string' || password.trim() === '') {
    throw new Error('Password harus berupa string yang tidak kosong.');
  }
  return await bcrypt.hash(password, saltRounds);
}

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

module.exports = {
  generateSessionToken,
  generateSalt,
  validateTokenFormat,
  hashPassword,
  verifyPassword,
  generateBookingMac,
  verifyBookingMac,
  hashReservationData,
  hashPasswordBcrypt,
  verifyPasswordBcrypt
};