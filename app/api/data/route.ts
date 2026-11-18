import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { authorized } from '@/lib/auth';
export const runtime = 'nodejs';
const allowed = new Set(['transactions', 'khata', 'groups', 'groupExpenses']);
function collectionName(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('collection') || '';
  return allowed.has(name) ? name : null;
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const name = collectionName(request);
  if (!name) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  try {
    const db = await getDatabase();
    return NextResponse.json(await db.collection(name).find({}, { projection: { _id: 0 } }).toArray());
  } catch (error) {
    console.error('MongoDB read failed:', error);
    return NextResponse.json({ error: 'Database unavailable. Check MONGODB_URI and network access.' }, { status: 503 });
  }
}
export async function PUT(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const name = collectionName(request);
  if (!name) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  try {
    const records: unknown = await request.json();
    if (!Array.isArray(records) || records.length > 5000 || records.some((r) => !r || typeof r !== 'object' || !('id' in r))) {
      return NextResponse.json({ error: 'Expected an array of records with IDs (maximum 5,000).' }, { status: 400 });
    }
    const db = await getDatabase();
    const collection = db.collection(name);
    if (records.length) {
      await collection.bulkWrite(records.map((record) => ({
        replaceOne: { filter: { id: (record as { id: string | number }).id }, replacement: record as Record<string, unknown>, upsert: true },
      })));
      await collection.deleteMany({ id: { $nin: records.map((r) => (r as { id: string | number }).id) } });
    } else await collection.deleteMany({});
    return NextResponse.json({ saved: records.length });
  } catch (error) {
    console.error('MongoDB write failed:', error);
    return NextResponse.json({ error: 'Could not save data. Check your MongoDB connection.' }, { status: 503 });
  }
}
