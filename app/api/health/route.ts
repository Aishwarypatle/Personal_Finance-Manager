import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
export const runtime = 'nodejs';
export async function GET() {
  try { await getDatabase(); return NextResponse.json({ status: 'connected' }); }
  catch { return NextResponse.json({ status: 'setup-required' }, { status: 503 }); }
}
