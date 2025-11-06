import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

interface SpielerRow {
  ID: string;
  VKZ: string;
  Spielername: string;
  Geburtsjahr: string;
  DWZ: string;
  'FIDE-Elo': string;
  'FIDE-ID': string;
  [key: string]: string;
}

interface VereinRow {
  ZPS: string;
  Vereinname: string;
  [key: string]: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const parms = await params;
    const eventId = parms.eventId;

    // Get format from query params (default to csv)
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

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

    if (format === 'swiss') {
      // Swiss chess format (TXT)

      // Parse spieler.csv
      const spielerCsvPath = path.join(process.cwd(), 'data', 'spieler.csv');
      const spielerCsvContent = fs.readFileSync(spielerCsvPath, 'utf-8');
      const spielerData = Papa.parse<SpielerRow>(spielerCsvContent, { header: true, skipEmptyLines: true });

      // Create player lookup map: key = "firstName|lastName|birthYear"
      const playerMap = new Map<string, SpielerRow>();
      spielerData.data.forEach((row) => {
        if (row.Spielername) {
          // Spielername format is "LastName,FirstName"
          const [lastName, firstName] = row.Spielername.split(',').map((s: string) => s.trim());
          if (firstName && lastName && row.Geburtsjahr) {
            const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${row.Geburtsjahr}`;
            // Store first occurrence (in case of duplicates)
            if (!playerMap.has(key)) {
              playerMap.set(key, row);
            }
          }
        }
      });

      // Parse vereine.csv
      const vereineCsvPath = path.join(process.cwd(), 'data', 'vereine.csv');
      const vereineCsvContent = fs.readFileSync(vereineCsvPath, 'utf-8');
      const vereineData = Papa.parse<VereinRow>(vereineCsvContent, { header: true, skipEmptyLines: true });

      // Create verein lookup map: key = ZPS (matches VKZ in spieler.csv)
      const vereinMap = new Map<string, string>();
      vereineData.data.forEach((row) => {
        if (row.ZPS && row.Vereinname) {
          vereinMap.set(row.ZPS, row.Vereinname);
        }
      });

      const lines = event.registrations.map(reg => {
        // Column 1: Format name as "LastName, FirstName" and pad to 32 characters
        const name = `${reg.lastName}, ${reg.firstName}`.padEnd(32, ' ');

        // Column 2: Empty (padded to 32 characters)
        const col2 = ''.padEnd(32, ' ');

        // Column 3: Empty (3 spaces)
        const col3 = '   ';

        // Column 4: Empty (4 spaces)
        const col4 = '    ';

        // Column 5: ELO as string
        const elo = reg.elo.toString();

        // Look up player data from spieler.csv
        const playerKey = `${reg.firstName.toLowerCase()}|${reg.lastName.toLowerCase()}|${reg.birthYear}`;
        const playerData = playerMap.get(playerKey);

        // Column 6: Vereinname from vereine.csv (mapped via VKZ)
        let vereinname = '';
        if (playerData && playerData.VKZ) {
          vereinname = vereinMap.get(playerData.VKZ) || '';
        }
        const col6 = vereinname.padEnd(32, ' ');

        // Column 7: Empty (3 spaces)
        const col7 = '   ';

        // Column 8: ID from spieler.csv
        const col8 = playerData?.ID || '';

        // Column 9: FIDE-ID from spieler.csv
        const col9 = playerData?.['FIDE-ID'] || '';

        // Format as semicolon-separated quoted values
        return `"${name}";"${col2}";"${col3}";"${col4}";"${elo}";"${col6}";"${col7}";"${col8}";"${col9}"`;
      });

      const txt = lines.join('\n');

      const headers = new Headers();
      headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('Content-Disposition', `attachment; filename="registrations-${event.title.replace(/\s+/g, '-')}.txt"`);

      return new NextResponse(txt, { headers });
    } else {
      // CSV format (default)
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
    }

  } catch (error) {
    console.error("Failed to export registrations:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}