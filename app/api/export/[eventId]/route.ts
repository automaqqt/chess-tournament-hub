import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const parms = await params;
    const eventId = parms.eventId;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!event) {
      return new NextResponse('Event not found', { status: 404 });
    }

    // Format registrations in Swiss chess format
    const lines = event.registrations.map(reg => {
      // Format name as "LastName, FirstName" and pad to 32 characters
      const name = `${reg.lastName}, ${reg.firstName}`.padEnd(32, ' ');

      // Pad verein to 32 characters
      const verein = reg.verein.padEnd(32, ' ');

      // Empty columns
      const col3 = '   '; // 3 spaces
      const col4 = '    '; // 4 spaces

      // ELO as string
      const elo = reg.elo.toString();

      // Last empty column
      const col6 = '   '; // 3 spaces

      // Format as semicolon-separated quoted values
      return `"${name}";"${verein}";"${col3}";"${col4}";"${elo}";"${col6}"`;
    });

    const txt = lines.join('\n');

    const headers = new Headers();
    headers.set('Content-Type', 'text/plain; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="registrations-${event.title.replace(/\s+/g, '-')}.txt"`);

    return new NextResponse(txt, { headers });

  } catch (error) {
    console.error("Failed to export registrations:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}