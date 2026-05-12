'use server';

import { z } from 'zod';
import prisma from './db';
import { revalidatePath } from 'next/cache';
import { signIn, verifyAuth } from './auth';
import { sendRegistrationConfirmationEmail } from './email';
import { parseDateAsBerlin } from './utils';
import fs from 'fs/promises';
import path from 'path';

const parseFees = (feeString: string) => {
    if (!feeString) return [];
    try {
        return feeString.split(',').map(pair => {
            const [name, price] = pair.split(':');
            if (!name || isNaN(parseInt(price))) {
                throw new Error('Ungültiges Gebührenformat');
            }
            return { name: name.trim(), price: parseInt(price.trim()) };
        });
    } catch {
        throw new Error('Ungültiges Gebührenformat. Verwenden Sie "Name:Preis, Name2:Preis2".');
    }
};

// Schema for login form
const loginSchema = z.object({
    username: z.string().min(1, { message: 'Benutzername ist erforderlich.' }),
    password: z.string().min(1, { message: 'Passwort ist erforderlich.' }),
});

export async function login(prevState: { type: string; message?: string; errors?: Record<string, string[]> } | null, formData: FormData) {
    const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            type: 'error',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    return await signIn(validatedFields.data.username, validatedFields.data.password);
}

import whitelist from '@/data/filter-whitelist.json';
import { redirect } from 'next/navigation';
import { playerExists } from './player-database';
// --- Updated Registration Schema ---
const registrationSchema = z.object({
    firstName: z.string().min(2, { message: 'Vorname muss mindestens 2 Zeichen lang sein.' }),
    lastName: z.string().min(2, { message: 'Nachname muss mindestens 2 Zeichen lang sein.' }),
    email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
    birthYear: z.coerce.number().min(1920, "Ungültiges Geburtsjahr.").max(new Date().getFullYear(), "Sie müssen mindestens 5 Jahre alt sein."),
    verein: z.string().optional(),
    elo: z.string().optional(),
    fideElo: z.string().optional(),
    eventId: z.string(),
    feeCategory: z.string().optional(),
    agreeToTerms: z.preprocess((val) => val === 'on', z.boolean()).refine(val => val === true, {
      message: "Sie müssen den Allgemeinen Geschäftsbedingungen und der Datenschutzerklärung zustimmen."
    }),
    isPubliclyVisible: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  });
  
  
  const teamMemberSchema = z.object({
    firstName: z.string().min(2, { message: 'Vorname muss mindestens 2 Zeichen lang sein.' }),
    lastName: z.string().min(2, { message: 'Nachname muss mindestens 2 Zeichen lang sein.' }),
    birthYear: z.coerce.number().min(1920, 'Ungültiges Geburtsjahr.').max(new Date().getFullYear(), 'Ungültiges Geburtsjahr.'),
    elo: z.string().optional(),
  });

  const teamRegistrationSchema = z.object({
    teamName: z.string().min(2, { message: 'Teamname muss mindestens 2 Zeichen lang sein.' }),
    email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
    eventId: z.string(),
    feeCategory: z.string().optional(),
    agreeToTerms: z.preprocess((val) => val === 'on', z.boolean()).refine(val => val === true, {
      message: 'Sie müssen den Allgemeinen Geschäftsbedingungen und der Datenschutzerklärung zustimmen.',
    }),
    isPubliclyVisible: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  });

  type EventForTeamRegistration = {
    id: string;
    title: string;
    date: Date;
    endDate: Date | null;
    location: string;
    fees: unknown;
    isTeamMode: boolean;
    minTeamSize: number;
    maxTeamSize: number;
    customFields: string;
    emailText: string;
    organiserEmail: string | null;
    registrationEndDate: Date;
  };

  async function registerTeamForEvent(event: EventForTeamRegistration, formData: FormData, rawData: Record<string, FormDataEntryValue>) {
    const validatedFields = teamRegistrationSchema.safeParse(rawData);
    if (!validatedFields.success) {
      return {
        type: 'error',
        errors: validatedFields.error.flatten().fieldErrors,
        fields: rawData,
      };
    }

    // Reconstruct the members array from `members[i].field` form entries.
    const memberMap = new Map<number, { firstName?: string; lastName?: string; birthYear?: string; elo?: string }>();
    const memberKeyRegex = /^members\[(\d+)\]\.(firstName|lastName|birthYear|elo)$/;
    for (const [key, value] of formData.entries()) {
      const match = key.match(memberKeyRegex);
      if (!match) continue;
      const idx = Number(match[1]);
      const field = match[2] as 'firstName' | 'lastName' | 'birthYear' | 'elo';
      const current = memberMap.get(idx) ?? {};
      current[field] = typeof value === 'string' ? value : '';
      memberMap.set(idx, current);
    }
    const rawMembers = [...memberMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, m]) => m);

    if (rawMembers.length < event.minTeamSize || rawMembers.length > event.maxTeamSize) {
      return {
        type: 'error',
        errors: { members: [`Bitte mindestens ${event.minTeamSize} und höchstens ${event.maxTeamSize} Spieler eintragen.`] },
        fields: rawData,
      };
    }

    const memberErrors: Record<string, string[]> = {};
    const parsedMembers: { firstName: string; lastName: string; birthYear: number; elo: number }[] = [];
    rawMembers.forEach((m, i) => {
      const parsed = teamMemberSchema.safeParse(m);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const firstMessage = Object.values(fieldErrors).flat()[0] ?? 'Ungültige Eingabe.';
        memberErrors[`members.${i}`] = [firstMessage];
        return;
      }
      const eloRaw = parsed.data.elo?.trim() ?? '';
      let elo = 0;
      if (eloRaw !== '') {
        const eloNumber = parseInt(eloRaw, 10);
        if (isNaN(eloNumber) || eloNumber < 100 || eloNumber > 3000) {
          memberErrors[`members.${i}`] = ['DWZ muss zwischen 100 und 3000 liegen.'];
          return;
        }
        elo = eloNumber;
      }
      parsedMembers.push({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        birthYear: parsed.data.birthYear,
        elo,
      });
    });

    if (Object.keys(memberErrors).length > 0) {
      return { type: 'error', errors: memberErrors, fields: rawData };
    }

    const eventFees = Array.isArray(event.fees) ? event.fees as { name: string; price: number }[] : [];
    if (eventFees.length > 0 && (!validatedFields.data.feeCategory || validatedFields.data.feeCategory.trim() === '')) {
      return {
        type: 'error',
        errors: { feeCategory: ['Sie müssen eine Gebührenkategorie auswählen.'] },
        fields: rawData,
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday > event.registrationEndDate) {
      return { type: 'error', message: 'Die Anmeldefrist für diese Veranstaltung ist abgelaufen.' };
    }

    // Custom fields validation (mandatory if defined on event), reused logic.
    const additionalInfo: Record<string, string> = {};
    if (event.customFields) {
      const customFieldKeys = event.customFields.split(',').map(f => f.trim()).filter(f => f);
      const missingFields: string[] = [];
      for (const key of customFieldKeys) {
        const value = formData.get(key);
        if (typeof value !== 'string' || value.trim() === '') {
          missingFields.push(key);
        } else {
          additionalInfo[key] = value.trim();
        }
      }
      if (missingFields.length > 0) {
        const fieldErrors: Record<string, string[]> = {};
        missingFields.forEach(field => {
          fieldErrors[field] = [`${field} ist erforderlich.`];
        });
        return { type: 'error', errors: fieldErrors, fields: rawData };
      }
    }

    const { teamName, email, feeCategory, isPubliclyVisible } = validatedFields.data;

    try {
      await prisma.team.create({
        data: {
          name: teamName,
          contactEmail: email,
          feeCategory: feeCategory || 'Standard',
          isPubliclyVisible: isPubliclyVisible !== undefined ? isPubliclyVisible : true,
          additionalInfo,
          eventId: event.id,
          members: {
            create: parsedMembers.map(m => ({
              firstName: m.firstName,
              lastName: m.lastName,
              email,
              birthYear: m.birthYear,
              verein: 'N/A',
              elo: m.elo,
              fideElo: 0,
              feeCategory: feeCategory || 'Standard',
              additionalInfo,
              isPubliclyVisible: isPubliclyVisible !== undefined ? isPubliclyVisible : true,
              eventId: event.id,
            })),
          },
        },
      });

      const captain = parsedMembers[0];
      await sendRegistrationConfirmationEmail({
        firstName: captain.firstName,
        lastName: captain.lastName,
        email,
        eventName: event.title,
        eventDate: new Date(event.date).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Berlin',
        }),
        eventDateRaw: new Date(event.date),
        eventEndDateRaw: event.endDate ? new Date(event.endDate) : undefined,
        eventLocation: event.location,
        customEmailText: event.emailText || undefined,
        organiserEmail: event.organiserEmail || undefined,
      });

      revalidatePath('/');
      return { type: 'success', message: `Team "${teamName}" erfolgreich angemeldet!` };
    } catch (error) {
      console.error('Team registration error:', error);
      return { type: 'error', message: 'Irgendwas ist schief, versuch es erneut.' };
    }
  }

  export async function registerForEvent(prevState: { type: string; message?: string; errors?: Record<string, string[]>; fields?: Record<string, unknown> } | null, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());

    const eventIdFromForm = typeof rawData.eventId === 'string' ? rawData.eventId : '';
    if (!eventIdFromForm) {
      return { type: 'error', message: 'Veranstaltung nicht gefunden.' };
    }

    const event = await prisma.event.findUnique({ where: { id: eventIdFromForm } });
    if (!event) {
      return { type: 'error', message: 'Veranstaltung nicht gefunden.' };
    }

    if (event.isTeamMode) {
      return registerTeamForEvent(event, formData, rawData);
    }

    const validatedFields = registrationSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        type: 'error',
        errors: validatedFields.error.flatten().fieldErrors,
        fields: rawData,
      };
    }

    const eventFees = Array.isArray(event.fees) ? event.fees as { name: string; price: number }[] : [];
    if (eventFees.length > 0 && (!validatedFields.data.feeCategory || validatedFields.data.feeCategory.trim() === '')) {
      return {
        type: 'error',
        errors: { feeCategory: ['Sie müssen eine Gebührenkategorie auswählen.'] },
        fields: rawData,
      };
    }

    // Validate player exists in spieler.csv database for isEloRequired events
    if (event.isEloRequired) {
      try {
        const exists = playerExists(
          validatedFields.data.firstName,
          validatedFields.data.lastName,
          validatedFields.data.birthYear
        );

        if (!exists) {
          return {
            type: 'error',
            errors: { firstName: ['Spieler nicht in der Datenbank gefunden. Bitte wählen Sie sich aus der Liste aus.'] },
            fields: rawData,
          };
        }
      } catch (error) {
        console.error('Error validating player:', error);
        return {
          type: 'error',
          message: 'Fehler bei der Validierung der Spielerdaten.',
        };
      }
    }

    // Validate ELO range IF provided (optional for all events)
    const eloValue = validatedFields.data.elo;
    if (eloValue && eloValue.trim() !== '') {
      const eloNumber = parseInt(eloValue);
      if (isNaN(eloNumber) || eloNumber < 100 || eloNumber > 3000) {
        return {
          type: 'error',
          errors: { elo: ['ELO muss zwischen 100 und 3000 liegen.'] },
          fields: rawData,
        };
      }
    }

    // Validate FIDE-Elo range IF provided (optional for all events)
    const fideEloValue = validatedFields.data.fideElo;
    if (fideEloValue && fideEloValue.trim() !== '') {
      const fideEloNumber = parseInt(fideEloValue);
      if (isNaN(fideEloNumber) || fideEloNumber < 100 || fideEloNumber > 3000) {
        return {
          type: 'error',
          errors: { fideElo: ['FIDE-Elo muss zwischen 100 und 3000 liegen.'] },
          fields: rawData,
        };
      }
    }

    // Destructure the new fields
    const { firstName, lastName, email, birthYear, verein, elo, fideElo, eventId, feeCategory, isPubliclyVisible } = validatedFields.data;
  
    try {
      
      // Check whitelist only for premier events
      if (event.isPremier) {
        const fullName = `${firstName} ${lastName}`;
        if (!whitelist.players.includes(fullName)) {
          return {
            type: 'error',
            errors: { firstName: ['Für diese Veranstaltung musst du ein Schachzwerg sein.'] },
            fields: rawData,
          };
        }
      }
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() - 1);
      if (tomorrow > event.registrationEndDate) {
        return { type: 'error', message: 'Die Anmeldefrist für diese Veranstaltung ist abgelaufen.' };
    }
  
      const existingRegistrations = await prisma.registration.findMany({
        where: { 
          email: email,
          eventId: eventId 
        },
      });
  
      if (existingRegistrations.length >= 20) {
        return { type: 'error', message: 'Maximale Anzahl von 5 Anmeldungen pro E-Mail-Adresse für diese Veranstaltung erreicht. Weitere Meldungen bitte per Mail an meldung@schachzwerge-magdeburg.de' };
      }
      
      // Validate and collect additional info - all fields are mandatory
      const additionalInfo: { [key: string]: string } = {};
      if (event.customFields) {
          const customFieldKeys = event.customFields.split(',').map(f => f.trim());
          const missingFields: string[] = [];
          
          for (const key of customFieldKeys) {
              const value = formData.get(key) as string;
              if (!value || value.trim() === '') {
                  missingFields.push(key);
              } else {
                  additionalInfo[key] = value.trim();
              }
          }
          
          if (missingFields.length > 0) {
              const fieldErrors: Record<string, string[]> = {};
              missingFields.forEach(field => {
                  fieldErrors[field] = [`${field} ist erforderlich.`];
              });
              return {
                  type: 'error',
                  errors: fieldErrors,
                  fields: rawData,
              };
          }
      }
  
      await prisma.registration.create({
        data: {
          // Save the new fields to the database
          firstName,
          lastName,
          email,
          birthYear,
          verein: verein || 'N/A',
          elo: elo ? parseInt(elo) : 0,
          fideElo: fideElo ? parseInt(fideElo) : 0,
          feeCategory: feeCategory || 'Standard',
          eventId,
          additionalInfo,
          isPubliclyVisible: isPubliclyVisible !== undefined ? isPubliclyVisible : true,
        },
      });

      await sendRegistrationConfirmationEmail({
        firstName,
        lastName,
        email,
        eventName: event.title,
        eventDate: new Date(event.date).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Berlin'
        }),
        eventDateRaw: new Date(event.date),
        eventEndDateRaw: event.endDate ? new Date(event.endDate) : undefined,
        eventLocation: event.location,
        customEmailText: event.emailText || undefined,
        organiserEmail: event.organiserEmail || undefined,
    });
  
      revalidatePath('/');
      return { type: 'success', message: 'Anmeldung erfolgreich!' };
    } catch (error) {
      console.error('Registration error:', error);
      return { type: 'error', message: 'Irgendwas ist schief, versuch es erneut.' };
    }
  }

  const eventSchema = z.object({
    title: z.string().min(5, 'Titel muss mindestens 5 Zeichen lang sein.'),
    description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein.'),
    fullDetails: z.string().min(20, 'Vollständige Details müssen mindestens 20 Zeichen lang sein.'),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Ungültiges Datumsformat" }),
    endDate: z.string().optional().refine(
      (date) => !date || !isNaN(Date.parse(date)),
      { message: "Ungültiges Datumsformat" }
    ),
    location: z.string().min(5, 'Ort ist erforderlich.'),
    // Zod transform to handle fee string parsing and validation
    fees: z.string().transform((val, ctx) => {
        // Allow empty string for free events
        if (!val || val.trim() === '') {
            return [];
        }
        try {
            return parseFees(val);
        } catch (e: unknown) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: e instanceof Error ? e.message : 'Ungültiges Gebührenformat' });
            return z.NEVER;
        }
    }),
    registrationEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Ungültiges Datumsformat" }),
    type: z.enum(['keine', 'Einsteiger', 'Fortgeschritten', 'Wettkampf Schach']),
    isPremier: z.preprocess((val) => val === 'on', z.boolean()).optional(),
    isEloRequired: z.preprocess((val) => val === 'on', z.boolean()).optional(),
    isTeamMode: z.preprocess((val) => val === 'on', z.boolean()).optional(),
    minTeamSize: z.coerce.number().int().min(1).optional(),
    maxTeamSize: z.coerce.number().int().min(1).optional(),
    customFields: z.string().optional(),
    emailText: z.string().optional(),
    organiserEmail: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }).optional().or(z.literal('')),
    pdfFile: z.any().refine(
        (file) => {
            // If no file is uploaded, or it's an empty file, it's valid (optional).
            if (!file || file.size === 0) {
                return true;
            }
            // Check if it has the properties of a File object.
            return (
                typeof file.name === 'string' &&
                typeof file.size === 'number' &&
                typeof file.type === 'string'
            );
        },
        { message: "Ungültiger Datei-Upload." }
    ).optional(),
});

// --- MODIFIED FUNCTION ---
async function handleEventForm(formData: FormData, eventId?: string) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = eventSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { type: 'error', errors: validatedFields.error.flatten().fieldErrors, fields: rawData };
    }

    // Validate that dates are in the future
    const now = new Date();
    const eventDate = parseDateAsBerlin(validatedFields.data.date);
    const registrationEndDate = parseDateAsBerlin(validatedFields.data.registrationEndDate);

    if (eventDate <= now) {
        return {
            type: 'error',
            errors: { date: ['Das Veranstaltungsdatum muss in der Zukunft liegen.'] },
            fields: rawData
        };
    }

    if (registrationEndDate <= now) {
        return {
            type: 'error',
            errors: { registrationEndDate: ['Der Anmeldeschluss muss in der Zukunft liegen.'] },
            fields: rawData
        };
    }

    // Additional validation: registration end date should be before or equal to event date
    if (registrationEndDate > eventDate) {
        return {
            type: 'error',
            errors: { registrationEndDate: ['Der Anmeldeschluss muss vor oder am Veranstaltungsdatum liegen.'] },
            fields: rawData
        };
    }

    // Validate end date is after start date if provided
    if (validatedFields.data.endDate) {
        const endDate = new Date(validatedFields.data.endDate);

        if (endDate <= eventDate) {
            return {
                type: 'error',
                errors: { endDate: ['Das Enddatum muss nach dem Startdatum liegen.'] },
                fields: rawData
            };
        }
    }

    const { pdfFile, ...eventData } = validatedFields.data;
    // For editing: get existing PDF URL from database
    // For duplicating: get existing PDF URL from hidden form field
    const existingPdfUrl = formData.get('existingPdfUrl') as string | null;
    let pdfUrl: string | undefined = eventId
        ? (await prisma.event.findUnique({ where: { id: eventId } }))?.pdfUrl || undefined
        : existingPdfUrl || undefined;

    // Handle PDF upload
    if (pdfFile && pdfFile.size > 0) {
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const filename = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '_')}`;
        
        // --- START OF FIX ---
        // 1. Define the target directory using environment variable or default
        const pdfUploadPath = process.env.PDF_UPLOAD_PATH || 'public/uploads/pdfs';
        const uploadDir = path.join(pdfUploadPath);
        
        try {
            // 2. Ensure the directory exists. `recursive: true` creates parent directories if needed.
            await fs.mkdir(uploadDir, { recursive: true });

            // 3. Define the full path for the file
            const uploadPath = path.join(uploadDir, filename);

            // 4. Write the file
            await fs.writeFile(uploadPath, buffer);
            
            // 5. Generate the public URL - use environment variable or default
            const pdfUrlBase = '/uploads/pdfs';
            pdfUrl = `${pdfUrlBase}/${filename}`;
        // --- END OF FIX ---
        } catch (error) {
            console.error("File upload failed:", error);
            // This will now provide a more detailed error in your server logs
            return { type: 'error', message: 'PDF-Upload fehlgeschlagen.', fields: rawData };
        }
    }

    const isTeamMode = eventData.isTeamMode || false;
    const minTeamSize = isTeamMode ? (eventData.minTeamSize ?? 2) : 2;
    const maxTeamSize = isTeamMode ? (eventData.maxTeamSize ?? 4) : 4;

    if (isTeamMode && minTeamSize > maxTeamSize) {
        return {
            type: 'error',
            errors: { maxTeamSize: ['Maximalanzahl muss größer oder gleich der Mindestanzahl sein.'] },
            fields: rawData,
        };
    }

    const dataToSave = {
        ...eventData,
        date: parseDateAsBerlin(eventData.date),
        endDate: eventData.endDate ? parseDateAsBerlin(eventData.endDate) : null,
        pdfUrl,
        isPremier: eventData.isPremier || false,
        isEloRequired: eventData.isEloRequired !== undefined ? eventData.isEloRequired : false,
        isTeamMode,
        minTeamSize,
        maxTeamSize,
        registrationEndDate: parseDateAsBerlin(eventData.registrationEndDate),
    };

    try {
        if (eventId) {
            await prisma.event.update({ where: { id: eventId }, data: dataToSave });
        } else {
            await prisma.event.create({ data: dataToSave });
        }
    } catch (error) {
        console.error('DB Error:', error);
        return { type: 'error', message: 'Datenbankfehler.', fields: rawData };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    if (eventId) revalidatePath(`/admin/dashboard/events/${eventId}/edit`);
    redirect('/admin/dashboard');
}

export async function createEvent(prevState: { type: string; message?: string; errors?: Record<string, string[]>; fields?: Record<string, unknown> } | null, formData: FormData) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
        return { type: 'error', message: 'Nicht autorisiert. Bitte melden Sie sich an.' };
    }
    return handleEventForm(formData);
}

export async function updateEvent(eventId: string, prevState: { type: string; message?: string; errors?: Record<string, string[]>; fields?: Record<string, unknown> } | null, formData: FormData) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
        return { type: 'error', message: 'Nicht autorisiert. Bitte melden Sie sich an.' };
    }
    return handleEventForm(formData, eventId);
}

// --- NEW: Delete Event Action ---
export async function deleteEvent(eventId: string) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
        return { type: 'error', message: 'Nicht autorisiert. Bitte melden Sie sich an.' };
    }

    try {
        // Must delete dependent registrations + teams first due to foreign key constraints
        await prisma.$transaction([
            prisma.registration.deleteMany({ where: { eventId } }),
            prisma.team.deleteMany({ where: { eventId } }),
            prisma.event.delete({ where: { id: eventId } }),
        ]);
    } catch (error) {
        console.error('Event deletion error:', error);
        return { type: 'error', message: 'Datenbankfehler. Veranstaltung konnte nicht gelöscht werden.' };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
}

// --- Team admin actions ---
const teamUpdateMemberSchema = z.object({
    id: z.string().optional(), // existing registration id; absent for new members
    firstName: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein.'),
    lastName: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein.'),
    birthYear: z.coerce.number().min(1920, 'Ungültiges Geburtsjahr.').max(new Date().getFullYear(), 'Ungültiges Geburtsjahr.'),
    elo: z.coerce.number().optional(),
});

export async function updateTeam(teamId: string, prevState: { type: string; message?: string; errors?: Record<string, string[]> } | null, formData: FormData) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
        return { type: 'error' as const, message: 'Nicht autorisiert. Bitte melden Sie sich an.' };
    }

    const name = String(formData.get('name') ?? '').trim();
    const contactEmail = String(formData.get('contactEmail') ?? '').trim();
    const feeCategory = String(formData.get('feeCategory') ?? '').trim();
    const isPubliclyVisible = formData.get('isPubliclyVisible') === 'on';

    if (name.length < 2) {
        return { type: 'error' as const, errors: { name: ['Teamname muss mindestens 2 Zeichen lang sein.'] } };
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
        return { type: 'error' as const, errors: { contactEmail: ['Bitte geben Sie eine gültige E-Mail-Adresse ein.'] } };
    }

    const memberMap = new Map<number, { id?: string; firstName?: string; lastName?: string; birthYear?: string; elo?: string }>();
    const memberKeyRegex = /^members\[(\d+)\]\.(id|firstName|lastName|birthYear|elo)$/;
    for (const [key, value] of formData.entries()) {
        const match = key.match(memberKeyRegex);
        if (!match) continue;
        const idx = Number(match[1]);
        const field = match[2] as 'id' | 'firstName' | 'lastName' | 'birthYear' | 'elo';
        const current = memberMap.get(idx) ?? {};
        current[field] = typeof value === 'string' ? value : '';
        memberMap.set(idx, current);
    }
    const rawMembers = [...memberMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, m]) => m);

    const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { event: true, members: { select: { id: true } } },
    });
    if (!team) {
        return { type: 'error' as const, message: 'Team nicht gefunden.' };
    }

    if (rawMembers.length < team.event.minTeamSize || rawMembers.length > team.event.maxTeamSize) {
        return {
            type: 'error' as const,
            errors: { members: [`Bitte mindestens ${team.event.minTeamSize} und höchstens ${team.event.maxTeamSize} Spieler eintragen.`] },
        };
    }

    const memberErrors: Record<string, string[]> = {};
    const parsedMembers: { id?: string; firstName: string; lastName: string; birthYear: number; elo: number }[] = [];
    rawMembers.forEach((m, i) => {
        const parsed = teamUpdateMemberSchema.safeParse(m);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            const firstMessage = Object.values(fieldErrors).flat()[0] ?? 'Ungültige Eingabe.';
            memberErrors[`members.${i}`] = [firstMessage];
            return;
        }
        let elo = 0;
        if (parsed.data.elo !== undefined && !Number.isNaN(parsed.data.elo) && parsed.data.elo !== 0) {
            if (parsed.data.elo < 100 || parsed.data.elo > 3000) {
                memberErrors[`members.${i}`] = ['DWZ muss zwischen 100 und 3000 liegen.'];
                return;
            }
            elo = parsed.data.elo;
        }
        parsedMembers.push({
            id: parsed.data.id && parsed.data.id !== '' ? parsed.data.id : undefined,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            birthYear: parsed.data.birthYear,
            elo,
        });
    });

    if (Object.keys(memberErrors).length > 0) {
        return { type: 'error' as const, errors: memberErrors };
    }

    const existingMemberIds = new Set(team.members.map(m => m.id));
    const keptIds = new Set(parsedMembers.filter(m => m.id).map(m => m.id as string));
    const toDelete = [...existingMemberIds].filter(id => !keptIds.has(id));

    try {
        await prisma.$transaction(async (tx) => {
            await tx.team.update({
                where: { id: teamId },
                data: {
                    name,
                    contactEmail,
                    feeCategory: feeCategory || 'Standard',
                    isPubliclyVisible,
                },
            });

            if (toDelete.length > 0) {
                await tx.registration.deleteMany({ where: { id: { in: toDelete } } });
            }

            for (const m of parsedMembers) {
                if (m.id) {
                    await tx.registration.update({
                        where: { id: m.id },
                        data: {
                            firstName: m.firstName,
                            lastName: m.lastName,
                            birthYear: m.birthYear,
                            elo: m.elo,
                            email: contactEmail,
                            feeCategory: feeCategory || 'Standard',
                            isPubliclyVisible,
                        },
                    });
                } else {
                    await tx.registration.create({
                        data: {
                            firstName: m.firstName,
                            lastName: m.lastName,
                            birthYear: m.birthYear,
                            elo: m.elo,
                            fideElo: 0,
                            verein: 'N/A',
                            email: contactEmail,
                            feeCategory: feeCategory || 'Standard',
                            isPubliclyVisible,
                            additionalInfo: {},
                            eventId: team.eventId,
                            teamId,
                        },
                    });
                }
            }
        });
    } catch (error) {
        console.error('Team update error:', error);
        return { type: 'error' as const, message: 'Team konnte nicht gespeichert werden.' };
    }

    revalidatePath('/');
    revalidatePath(`/admin/dashboard/events/${team.eventId}`);
    return { type: 'success' as const, message: 'Team aktualisiert.' };
}

export async function deleteTeam(teamId: string, eventId: string) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
        return { type: 'error', message: 'Nicht autorisiert. Bitte melden Sie sich an.' };
    }

    try {
        await prisma.$transaction([
            prisma.registration.deleteMany({ where: { teamId } }),
            prisma.team.delete({ where: { id: teamId } }),
        ]);
    } catch (error) {
        console.error('Team deletion error:', error);
        return { type: 'error', message: 'Team konnte nicht gelöscht werden.' };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/dashboard/events/${eventId}`);
}

// --- NEW: Delete Registration Action ---
export async function deleteRegistration(registrationId: string, eventId: string) {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
        return { type: 'error', message: 'Nicht autorisiert. Bitte melden Sie sich an.' };
    }

    try {
        await prisma.registration.delete({
            where: { id: registrationId },
        });
    } catch (error) {
        console.error('Registration deletion error:', error);
        return { type: 'error', message: 'Datenbankfehler. Anmeldung konnte nicht gelöscht werden.' };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/admin/dashboard/events/${eventId}`);
}