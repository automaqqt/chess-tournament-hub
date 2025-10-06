import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { join } from 'path';

type PlayerRow = {
  ID: string;
  VKZ: string;
  'Mgl-Nr': string;
  Status: string;
  Spielername: string;
  Geschlecht: string;
  Spielberechtigung: string;
  Geburtsjahr: string;
  'Letzte-Auswertung': string;
  DWZ: string;
  Index: string;
  'FIDE-Elo': string;
  'FIDE-Titel': string;
  'FIDE-ID': string;
  'FIDE-Land': string;
};

type Player = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  dwz: number | null;
  fideElo: number | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Read and parse CSV
    const csvPath = join(process.cwd(), 'data', 'spieler.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');

    const { data } = Papa.parse<PlayerRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Search and deduplicate
    const searchTerm = query.toLowerCase();
    const playerMap = new Map<string, Player>();

    for (const row of data) {
      if (!row.Spielername) continue;

      // Search in player name
      if (!row.Spielername.toLowerCase().includes(searchTerm)) continue;

      // Skip if already processed this player ID
      if (playerMap.has(row.ID)) continue;

      // Parse name (format: "Lastname,Firstname")
      const [lastName, firstName] = row.Spielername.split(',').map(s => s.trim());

      if (!lastName || !firstName) continue;

      // Parse ratings
      const dwz = row.DWZ ? parseInt(row.DWZ) : null;
      const fideElo = row['FIDE-Elo'] ? parseInt(row['FIDE-Elo']) : null;
      const birthYear = row.Geburtsjahr ? parseInt(row.Geburtsjahr) : 0;

      playerMap.set(row.ID, {
        id: row.ID,
        fullName: row.Spielername,
        firstName,
        lastName,
        birthYear,
        dwz,
        fideElo,
      });
    }

    // Convert to array and limit results
    const results = Array.from(playerMap.values())
      .slice(0, 20); // Limit to 20 results

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search players:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
