import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
const COOKIE = 'finance_session';
function signature(expires: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return '';
  return createHmac('sha256', secret).update(expires).digest('hex');
}
export function authConfigured() {
  return Boolean(process.env.APP_PASSWORD && process.env.SESSION_SECRET);
}
export function validPassword(candidate: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(candidate); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function issueSession() {
  const expires = String(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return `${expires}.${signature(expires)}`;
}
export function authorized(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production' && !authConfigured()) return true;
  if (!authConfigured()) return false;
  const token = request.cookies.get(COOKIE)?.value || '';
  const [expires, sig] = token.split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const expected = signature(expires);
  const a = Buffer.from(sig); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const sessionCookieName = COOKIE;
