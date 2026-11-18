import { type NextRequest, NextResponse } from 'next/server';
import { authConfigured, issueSession, sessionCookieName, validPassword } from '@/lib/auth';
export async function POST(request: NextRequest) {
  if (!authConfigured()) return NextResponse.json({ error: 'Set APP_PASSWORD and SESSION_SECRET in .env.local first.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (!validPassword(String(body.password || ''))) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, issueSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return response;
}
