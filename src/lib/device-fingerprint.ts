import crypto from 'crypto';
import UAParser from 'ua-parser-js';

export interface DeviceFingerprint {
  fingerprint: string;
  userAgent: string;
  browser?: string;
  os?: string;
  ipHash?: string;
}

export function generateDeviceFingerprint(
  userAgent: string,
  ip: string
): DeviceFingerprint {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Don't include IP in fingerprint as it can change frequently
  // causing false session terminations
  const fingerprintData = [
    userAgent,
    result.browser.name || '',
    result.browser.version || '',
    result.os.name || '',
    result.os.version || '',
  ].join('|');

  const fingerprint = crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex');

  return {
    fingerprint,
    userAgent,
    browser: result.browser.name,
    os: result.os.name,
    ipHash: crypto.createHash('sha256').update(ip).digest('hex'),
  };
}

export function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return '0.0.0.0';
}
