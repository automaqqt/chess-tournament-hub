import Papa from 'papaparse';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import * as iconv from 'iconv-lite';

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

export type Player = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  dwz: number | null;
  fideElo: number | null;
};

/**
 * Helper function to read CSV files with automatic encoding detection.
 * Handles UTF-8, Latin-1, Windows-1252, and other common encodings.
 */
export function readCSVWithEncoding(filePath: string): string {
  // Read file as buffer
  const buffer = readFileSync(filePath);

  // Try to detect encoding by checking for common patterns
  // Check for UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return buffer.toString('utf-8');
  }

  // Try UTF-8 first - if it decodes without errors, use it
  try {
    const utf8String = iconv.decode(buffer, 'utf-8');
    // Check if decode was successful (no replacement characters)
    if (!utf8String.includes('\uFFFD')) {
      return utf8String;
    }
  } catch {
    // UTF-8 decode failed, continue to try other encodings
  }

  // Try common German/European encodings
  const encodingsToTry = ['windows-1252', 'iso-8859-1', 'latin1'];

  for (const encoding of encodingsToTry) {
    try {
      const decoded = iconv.decode(buffer, encoding);
      // If successful and contains valid characters, use this encoding
      if (decoded && !decoded.includes('\uFFFD')) {
        return decoded;
      }
    } catch {
      continue;
    }
  }

  // Fallback to latin1 (never fails, always produces output)
  return iconv.decode(buffer, 'latin1');
}

// In-memory cache for parsed player data
let cachedPlayers: Map<string, Player> | null = null;
let lastFileModTime: number | null = null;

/**
 * Load players from spieler.csv with intelligent caching.
 * Cache is invalidated only when the CSV file is modified.
 */
export function loadPlayersFromCSV(): Map<string, Player> {
  const csvPath = join(process.cwd(), 'data', 'spieler.csv');

  // Check if file has been modified since last load
  const stats = statSync(csvPath);
  const currentModTime = stats.mtimeMs;

  if (cachedPlayers && lastFileModTime === currentModTime) {
    // Return cached data if file hasn't changed
    return cachedPlayers;
  }

  // Read and parse CSV with auto-detected encoding
  const csvContent = readCSVWithEncoding(csvPath);
  const { data } = Papa.parse<PlayerRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  // Build player map with deduplication by ID
  const playerMap = new Map<string, Player>();

  for (const row of data) {
    if (!row.Spielername || playerMap.has(row.ID)) continue;

    const [lastName, firstName] = row.Spielername.split(',').map(s => s.trim());
    if (!lastName || !firstName) continue;

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

  // Update cache
  cachedPlayers = playerMap;
  lastFileModTime = currentModTime;

  return playerMap;
}

/**
 * Search for players by name.
 * Returns up to maxResults matching players.
 */
export function searchPlayers(query: string, maxResults: number = 20): Player[] {
  const allPlayers = loadPlayersFromCSV();
  const searchTerm = query.toLowerCase();

  return Array.from(allPlayers.values())
    .filter(player => player.fullName.toLowerCase().includes(searchTerm))
    .slice(0, maxResults);
}

/**
 * Check if a player exists in the database by matching
 * firstName, lastName, and birthYear.
 */
export function playerExists(
  firstName: string,
  lastName: string,
  birthYear: number
): boolean {
  const allPlayers = loadPlayersFromCSV();

  return Array.from(allPlayers.values()).some(player =>
    player.firstName.toLowerCase() === firstName.toLowerCase() &&
    player.lastName.toLowerCase() === lastName.toLowerCase() &&
    player.birthYear === birthYear
  );
}
