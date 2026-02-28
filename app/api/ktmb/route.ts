import { fetchAndParseGTFS } from '@/lib/gtfsService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchAndParseGTFS();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GTFS Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch GTFS data' }, { status: 500 });
  }
}
