import { NextResponse } from 'next/server';
import { searchPlayers } from '@/lib/player-database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const results = searchPlayers(query, 20);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search players:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
