// app/api/events/counts/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Transform to a simple id -> count mapping
    const counts = events.reduce((acc, event) => {
      acc[event.id] = event._count.registrations;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }
}
