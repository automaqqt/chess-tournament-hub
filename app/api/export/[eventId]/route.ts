import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import Papa from 'papaparse';

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

    const dataToExport = event.registrations.map(reg => {
      const baseData: Record<string, string | number> = {
        'Vorname': reg.firstName,
        'Nachname': reg.lastName,
        'E-Mail': reg.email,
        'Geburtsjahr': reg.birthYear,
        'ELO': reg.elo,
        'Verein': reg.verein,
        'Startgeld-Kategorie': reg.feeCategory || '',
        'Anmeldung am': reg.createdAt.toLocaleDateString('de-DE'),
      };

      if (reg.additionalInfo && typeof reg.additionalInfo === 'object') {
        const additionalFields = reg.additionalInfo as Record<string, string | number | boolean>;
        Object.keys(additionalFields).forEach(key => {
          baseData[key] = String(additionalFields[key]);
        });
      }

      return baseData;
    });

    const csv = Papa.unparse(dataToExport);

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="registrations-${event.title.replace(/\s+/g, '-')}.csv"`);

    return new NextResponse(csv, { headers });

  } catch (error) {
    console.error("Failed to export registrations:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}