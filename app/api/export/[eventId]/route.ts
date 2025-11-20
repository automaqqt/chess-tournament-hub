import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import Papa from 'papaparse';
import path from 'path';
import { readCSVWithEncoding } from '@/lib/player-database';

interface SpielerRow {
  ID: string;
  VKZ: string;
  Spielername: string;
  Geburtsjahr: string;
  Geschlecht: string;
  DWZ: string;
  'FIDE-Elo': string;
  'FIDE-ID': string;
  'FIDE-Titel': string;
  'FIDE-Land': string;
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

      // Parse spieler.csv with auto-detected encoding
      const spielerCsvPath = path.join(process.cwd(), 'data', 'spieler.csv');
      const spielerCsvContent = readCSVWithEncoding(spielerCsvPath);
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

      // Parse vereine.csv with auto-detected encoding
      const vereineCsvPath = path.join(process.cwd(), 'data', 'vereine.csv');
      const vereineCsvContent = readCSVWithEncoding(vereineCsvPath);
      const vereineData = Papa.parse<VereinRow>(vereineCsvContent, { header: true, skipEmptyLines: true });

      // Create verein lookup map: key = ZPS (matches VKZ in spieler.csv)
      const vereinMap = new Map<string, string>();
      vereineData.data.forEach((row) => {
        if (row.ZPS && row.Vereinname) {
          vereinMap.set(row.ZPS, row.Vereinname);
        }
      });

      const lines = event.registrations.map(reg => {
        // Look up player data from spieler.csv
        const playerKey = `${reg.firstName.toLowerCase()}|${reg.lastName.toLowerCase()}|${reg.birthYear}`;
        const playerData = playerMap.get(playerKey);

        // Column 1: "Name" - Format as "LastName,FirstName"
        const name = `${reg.lastName},${reg.firstName}`;

        // Column 2: "Verein" - Club name from vereine.csv (mapped via VKZ)
        let vereinname = '';
        if (playerData && playerData.VKZ) {
          vereinname = vereinMap.get(playerData.VKZ) || '';
        }

        // Column 3: "Land" - FIDE country from spieler.csv
        const land = playerData?.['FIDE-Land'] || '';

        // Column 4: "ELO" - FIDE-Elo from spieler.csv
        const elo = playerData?.['FIDE-Elo'] || '';

        // Column 5: "DWZ" - DWZ rating from spieler.csv
        const dwz = playerData?.DWZ || '';

        // Column 6: "Titel" - FIDE title from spieler.csv
        const titel = playerData?.['FIDE-Titel'] || '';

        // Column 7: "Geb-Datum/Jahr" - Birth year from registration
        const birthYear = reg.birthYear.toString();

        // Column 8: "PKZ" - Player ID from spieler.csv
        const pkz = playerData?.ID || '';

        // Column 9: "FIDE-ID" - FIDE ID from spieler.csv
        const fideId = playerData?.['FIDE-ID'] || '';

        // Column 10: Empty column
        const col10 = '';

        // Column 11: "M/W" - Gender from spieler.csv
        const gender = playerData?.Geschlecht || '';

        // Column 12: Empty column
        const col12 = '';

        // Format as semicolon-separated quoted values (12 columns)
        return `"${name}";"${vereinname}";"${land}";"${elo}";"${dwz}";"${titel}";"${birthYear}";"${pkz}";"${fideId}";"${col10}";"${gender}";"${col12}"`;
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