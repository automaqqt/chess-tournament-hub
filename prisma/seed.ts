import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const events = [
    // New Event 1: Schachzwerge-Einsteiger-Serie Saison 2025/2026 - Turnier 1
    {
      id: 'czes2025t1',
      title: 'Schachzwerge-Einsteiger-Serie Saison 2025/2026 - Turnier 1',
      date: 'September 13, 2025',
      location: 'Otto-Kobin-Saal, Leipziger Straße 43, 39112 Magdeburg',
      description: 'Einsteiger-Turnierserie in 4 Gruppen für KITA-Kinder, Kinder und Jugendliche.',
      fullDetails: 'Format: Einsteiger-Turnierserie in 4 Gruppen für KITA-Kinder, Kinder und Jugendliche incl. ein Mini-Turnier für Neueinsteiger. Gruppe 1 Zwerge-Cup: Offen für alle Teilnehmer bis DWZ 1200. Gruppe 2 Däumling-Cup: Für Grundschüler der 1. und 2. Klasse. Gruppe 3 KITA-Cup: Für KITA-Kinder. Gruppe 4 Mini-Turnier: Für Neulinge und Kinder mit sehr wenig Turniererfahrung (max. 4 Turnierteilnahmen bisher) ab 3. Klasse. Modus: Schweizer System-Turnier, 5 Runden, 15 min Bedenkzeit. Anmeldung: 09:00 Uhr – 09:15 Uhr. Turnierstart: 09:30 Uhr. Siegerehrung: Gegen 13:15 Uhr. Wertung: 1. Erzielte Punkte, 2. Buchholz-Wertung. Preise: Gruppensieger Pokal, Platzierte Medaillen. Gesamtwertung im Zwerge- und Däumling-Cup. Startgeld: 7,- Euro pro TeilnehmerIn.',
      fees: [{"name":"Normal","price":7},{"name":"Kinder","price":5}],
      isPremier: false,
      type: 'scholastic',
      registrationEndDate: new Date('2025-09-10T23:59:59'), // Mittwoch vor dem Spieltag
    },
    // New Event 2: Schachzwerge-Einsteiger-Serie Saison 2025/2026 - Turnier 2
    {
      id: 'czes2025t2',
      title: 'Schachzwerge-Einsteiger-Serie Saison 2025/2026 - Turnier 2',
      date: 'November 15, 2025',
      location: 'Otto-Kobin-Saal, Leipziger Straße 43, 39112 Magdeburg',
      description: 'Einsteiger-Turnierserie in 4 Gruppen für KITA-Kinder, Kinder und Jugendliche.',
      fullDetails: 'Format: Einsteiger-Turnierserie in 4 Gruppen für KITA-Kinder, Kinder und Jugendliche incl. ein Mini-Turnier für Neueinsteiger. Gruppe 1 Zwerge-Cup: Offen für alle Teilnehmer bis DWZ 1200. Gruppe 2 Däumling-Cup: Für Grundschüler der 1. und 2. Klasse. Gruppe 3 KITA-Cup: Für KITA-Kinder. Gruppe 4 Mini-Turnier: Für Neulinge und Kinder mit sehr wenig Turniererfahrung (max. 4 Turnierteilnahmen bisher) ab 3. Klasse. Modus: Schweizer System-Turnier, 5 Runden, 15 min Bedenkzeit. Anmeldung: 09:00 Uhr – 09:15 Uhr. Turnierstart: 09:30 Uhr. Siegerehrung: Gegen 13:15 Uhr. Wertung: 1. Erzielte Punkte, 2. Buchholz-Wertung. Preise: Gruppensieger Pokal, Platzierte Medaillen. Gesamtwertung im Zwerge- und Däumling-Cup. Startgeld: 7,- Euro pro TeilnehmerIn.',
      fees: [{"name":"Normal","price":7},{"name":"Kinder","price":5}],
      isPremier: false,
      type: 'scholastic',
      registrationEndDate: new Date('2025-11-12T23:59:59'), // Mittwoch vor dem Spieltag
    },
    // New Event 3: Schachzwerge-Einsteiger-Serie Saison 2025/2026 - Turnier 3
    {
      id: 'czes2025t3',
      title: 'Schachzwerge-Einsteiger-Serie Saison 2025/2026 - Turnier 3',
      date: 'February 21, 2026',
      location: 'Otto-Kobin-Saal, Leipziger Straße 43, 39112 Magdeburg',
      description: 'Einsteiger-Turnierserie in 4 Gruppen für KITA-Kinder, Kinder und Jugendliche.',
      fullDetails: 'Format: Einsteiger-Turnierserie in 4 Gruppen für KITA-Kinder, Kinder und Jugendliche incl. ein Mini-Turnier für Neueinsteiger. Gruppe 1 Zwerge-Cup: Offen für alle Teilnehmer bis DWZ 1200. Gruppe 2 Däumling-Cup: Für Grundschüler der 1. und 2. Klasse. Gruppe 3 KITA-Cup: Für KITA-Kinder. Gruppe 4 Mini-Turnier: Für Neulinge und Kinder mit sehr wenig Turniererfahrung (max. 4 Turnierteilnahmen bisher) ab 3. Klasse. Modus: Schweizer System-Turnier, 5 Runden, 15 min Bedenkzeit. Anmeldung: 09:00 Uhr – 09:15 Uhr. Turnierstart: 09:30 Uhr. Siegerehrung: Gegen 13:15 Uhr. Wertung: 1. Erzielte Punkte, 2. Buchholz-Wertung. Preise: Gruppensieger Pokal, Platzierte Medaillen. Gesamtwertung im Zwerge- und Däumling-Cup. Startgeld: 7,- Euro pro TeilnehmerIn.',
      fees: [{"name":"Normal","price":7},{"name":"Kinder","price":5}],
      isPremier: false,
      type: 'scholastic',
      registrationEndDate: new Date('2026-02-18T23:59:59'), // Mittwoch vor dem Spieltag
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {},
      create: event,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
