import Papa from 'papaparse';
import { readFileSync, statSync } from 'fs';
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

export type Player = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  dwz: number | null;
  fideElo: number | null;
};

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

  // Read and parse CSV
  const csvContent = readFileSync(csvPath, 'utf-8');
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
