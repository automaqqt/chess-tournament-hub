'use server';

import { z } from 'zod';
import prisma from './db';
import { revalidatePath } from 'next/cache';
import { signIn } from './auth';
import { sendRegistrationConfirmationEmail } from './email'; 
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
// --- Updated Registration Schema ---
const registrationSchema = z.object({
    firstName: z.string().min(2, { message: 'Vorname muss mindestens 2 Zeichen lang sein.' }),
    lastName: z.string().min(2, { message: 'Nachname muss mindestens 2 Zeichen lang sein.' }),
    email: z.string().email({ message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }),
    birthYear: z.coerce.number().min(1920, "Ungültiges Geburtsjahr.").max(new Date().getFullYear() - 5, "Sie müssen mindestens 5 Jahre alt sein."),
    verein: z.string().optional(),
    elo: z.string().optional(),
    eventId: z.string(),
    feeCategory: z.string().optional(),
    agreeToTerms: z.preprocess((val) => val === 'on', z.boolean()).refine(val => val === true, {
      message: "Sie müssen den Allgemeinen Geschäftsbedingungen und der Datenschutzerklärung zustimmen."
    }),
    isPubliclyVisible: z.preprocess((val) => val === 'on', z.boolean()).optional(),
  });
  
  
  export async function registerForEvent(prevState: { type: string; message?: string; errors?: Record<string, string[]>; fields?: Record<string, unknown> } | null, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    
    const validatedFields = registrationSchema.safeParse(rawData);
  
    if (!validatedFields.success) {
      return {
        type: 'error',
        errors: validatedFields.error.flatten().fieldErrors,
        fields: rawData, 
      };
    }

    // Check if fee category is required
    const event = await prisma.event.findUnique({ where: { id: validatedFields.data.eventId } });
    if (!event) {
      return { type: 'error', message: 'Veranstaltung nicht gefunden.' };
    }

    const eventFees = Array.isArray(event.fees) ? event.fees as { name: string; price: number }[] : [];
    if (eventFees.length > 0 && (!validatedFields.data.feeCategory || validatedFields.data.feeCategory.trim() === '')) {
      return {
        type: 'error',
        errors: { feeCategory: ['Sie müssen eine Gebührenkategorie auswählen.'] },
        fields: rawData,
      };
    }

    // Check if ELO is required and validate it
    if (event.isEloRequired) {
      const eloValue = validatedFields.data.elo;
      if (!eloValue || eloValue.trim() === '') {
        return {
          type: 'error',
          errors: { elo: ['ELO-Zahl ist erforderlich.'] },
          fields: rawData,
        };
      }
      const eloNumber = parseInt(eloValue);
      if (isNaN(eloNumber) || eloNumber < 100 || eloNumber > 3000) {
        return {
          type: 'error',
          errors: { elo: ['ELO muss zwischen 100 und 3000 liegen.'] },
          fields: rawData,
        };
      }
    }
  
    // Destructure the new fields
    const { firstName, lastName, email, birthYear, verein, elo, eventId, feeCategory, isPubliclyVisible } = validatedFields.data;
  
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
  
      if (existingRegistrations.length >= 5) {
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
          minute: '2-digit'
        }),
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
    type: z.enum(['classic', 'blitz', 'scholastic', 'rapid']),
    isPremier: z.preprocess((val) => val === 'on', z.boolean()).optional(),
    isEloRequired: z.preprocess((val) => val === 'on', z.boolean()).optional(),
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
    const eventDate = new Date(validatedFields.data.date);
    const registrationEndDate = new Date(validatedFields.data.registrationEndDate);

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

    const { pdfFile, ...eventData } = validatedFields.data;
    let pdfUrl: string | undefined = eventId ? (await prisma.event.findUnique({ where: { id: eventId } }))?.pdfUrl || undefined : undefined;

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

    const dataToSave = {
        ...eventData,
        date: new Date(eventData.date),
        pdfUrl,
        isPremier: eventData.isPremier || false,
        isEloRequired: eventData.isEloRequired !== undefined ? eventData.isEloRequired : false,
        registrationEndDate: new Date(eventData.registrationEndDate),
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
    return handleEventForm(formData);
}

export async function updateEvent(eventId: string, prevState: { type: string; message?: string; errors?: Record<string, string[]>; fields?: Record<string, unknown> } | null, formData: FormData) {
    return handleEventForm(formData, eventId);
}

// --- NEW: Delete Event Action ---
export async function deleteEvent(eventId: string) {
    try {
        // Must delete dependent registrations first due to foreign key constraints
        await prisma.registration.deleteMany({
            where: { eventId: eventId },
        });

        await prisma.event.delete({
            where: { id: eventId },
        });
    } catch (error) {
        console.error('Event deletion error:', error);
        return { type: 'error', message: 'Datenbankfehler. Veranstaltung konnte nicht gelöscht werden.' };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
}

// --- NEW: Delete Registration Action ---
export async function deleteRegistration(registrationId: string, eventId: string) {
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