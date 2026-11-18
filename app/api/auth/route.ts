import { NextResponse } from 'next/server';
import { authConfigured, authorized } from '@/lib/auth';
import type { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const required = process.env.NODE_ENV === 'production' || authConfigured();
  return NextResponse.json({ required, authorized: !required || authorized(request) });
}
