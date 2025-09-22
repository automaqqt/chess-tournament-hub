import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Get all registrations with visibility info, ordered by creation date to maintain original numbering
    const allRegistrations = await prisma.registration.findMany({
      where: {
        eventId: eventId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        verein: true,
        elo: true,
        isPubliclyVisible: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Map to include index and hide private data
    const registrationsWithIndex = allRegistrations.map((reg, index) => ({
      index: index + 1,
      id: reg.isPubliclyVisible ? reg.id : null,
      firstName: reg.isPubliclyVisible ? reg.firstName : null,
      lastName: reg.isPubliclyVisible ? reg.lastName : null,
      verein: reg.isPubliclyVisible ? reg.verein : null,
      elo: reg.isPubliclyVisible ? reg.elo : null,
      isPubliclyVisible: reg.isPubliclyVisible,
    }));

    return NextResponse.json({
      registrations: registrationsWithIndex,
      totalCount: allRegistrations.length,
      publicCount: allRegistrations.filter(r => r.isPubliclyVisible).length,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}