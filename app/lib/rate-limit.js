const attempts = new Map();

function cleanup(now, windowMs) {
  for (const [key, data] of attempts.entries()) {
    if (now - data.windowStart > windowMs) {
      attempts.delete(key);
    }
  }
}

export function checkRateLimit({ key, windowMs = 15 * 60 * 1000, max = 10 }) {
  const now = Date.now();
  cleanup(now, windowMs);

  const existing = attempts.get(key);
  if (!existing || now - existing.windowStart > windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1 };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - existing.windowStart),
    };
  }

  existing.count += 1;
  attempts.set(key, existing);
  return { allowed: true, remaining: max - existing.count };
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
