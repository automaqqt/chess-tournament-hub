import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { isTeamMode: true },
    });

    if (event?.isTeamMode) {
      const allTeams = await prisma.team.findMany({
        where: { eventId },
        select: {
          id: true,
          name: true,
          isPubliclyVisible: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      const teams = allTeams.map((team, index) => ({
        index: index + 1,
        id: team.isPubliclyVisible ? team.id : null,
        name: team.isPubliclyVisible ? team.name : null,
        memberCount: team._count.members,
        isPubliclyVisible: team.isPubliclyVisible,
      }));

      return NextResponse.json({
        mode: 'team',
        teams,
        totalCount: allTeams.length,
        publicCount: allTeams.filter(t => t.isPubliclyVisible).length,
      });
    }

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
      mode: 'solo',
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