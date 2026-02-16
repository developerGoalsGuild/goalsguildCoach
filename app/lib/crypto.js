import crypto from 'crypto';

const PBKDF2_ITERATIONS = Number.parseInt(process.env.PBKDF2_ITERATIONS || '120000', 10);
const LEGACY_PBKDF2_ITERATIONS = 1000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function comparePassword(password, hashedPassword) {
  const compareWithIterations = (iterations) =>
    new Promise((resolve, reject) => {
      const [salt, key] = hashedPassword.split(':');
      crypto.pbkdf2(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, derivedKey) => {
        if (err) reject(err);
        const storedKey = Buffer.from(key, 'hex');
        const computedKey = Buffer.from(derivedKey.toString('hex'), 'hex');
        if (storedKey.length !== computedKey.length) {
          resolve(false);
          return;
        }
        resolve(crypto.timingSafeEqual(storedKey, computedKey));
      });
    });

  const modernMatch = await compareWithIterations(PBKDF2_ITERATIONS);
  if (modernMatch) return true;

  // Backward compatibility for existing users created with old hash cost.
  return compareWithIterations(LEGACY_PBKDF2_ITERATIONS);
}

export async function comparePasswordDetailed(password, hashedPassword) {
  const compareWithIterations = (iterations) =>
    new Promise((resolve, reject) => {
      const [salt, key] = hashedPassword.split(':');
      crypto.pbkdf2(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, derivedKey) => {
        if (err) reject(err);
        const storedKey = Buffer.from(key, 'hex');
        const computedKey = Buffer.from(derivedKey.toString('hex'), 'hex');
        if (storedKey.length !== computedKey.length) {
          resolve(false);
          return;
        }
        resolve(crypto.timingSafeEqual(storedKey, computedKey));
      });
    });

  const modernMatch = await compareWithIterations(PBKDF2_ITERATIONS);
  if (modernMatch) {
    return { valid: true, usedLegacy: false };
  }

  const legacyMatch = await compareWithIterations(LEGACY_PBKDF2_ITERATIONS);
  return { valid: legacyMatch, usedLegacy: legacyMatch };
}
