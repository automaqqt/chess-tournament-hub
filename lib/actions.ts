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
                throw new Error('Invalid fee format');
            }
            return { name: name.trim(), price: parseInt(price.trim()) };
        });
    } catch {
        throw new Error('Invalid fee format. Use "Name:Price, Name2:Price2".');
    }
};

// Schema for login form
const loginSchema = z.object({
    username: z.string().min(1, { message: 'Username is required.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
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
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    birthYear: z.coerce.number().min(1920, "Invalid birth year.").max(new Date().getFullYear() - 5, "You must be at least 5 years old."),
    verein: z.string().optional(),
    elo: z.coerce.number().min(100, "ELO must be at least 100.").max(3000, "ELO cannot exceed 3000."),
    eventId: z.string(),
    feeCategory: z.string().min(1, "You must select a fee category."),
    agreeToTerms: z.preprocess((val) => val === 'on', z.boolean()).refine(val => val === true, {
      message: "You must agree to the Terms & Conditions and Privacy Policy."
    }),
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
  
    // Destructure the new fields
    const { firstName, lastName, email, birthYear, verein, elo, eventId } = validatedFields.data;
  
    try {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
          return { type: 'error', message: 'Event not found.' };
      }
      
      // Check whitelist only for premier events
      if (event.isPremier) {
        const fullName = `${firstName} ${lastName}`;
        if (!whitelist.players.includes(fullName)) {
          return {
            type: 'error',
            errors: { firstName: ['Player not found in the official whitelist.'] },
            fields: rawData,
          };
        }
      }
      
      if (new Date() > event.registrationEndDate) {
        return { type: 'error', message: 'The registration deadline for this event has passed.' };
    }
  
      const existingRegistration = await prisma.registration.findUnique({
        where: { email_eventId: { email, eventId } },
      });
  
      if (existingRegistration) {
        return { type: 'error', message: 'You are already registered for this event with this email.' };
      }
      
      // ... (additionalInfo logic remains the same) ...
      const additionalInfo: { [key: string]: string } = {};
      if (event.customFields) {
          const customFieldKeys = event.customFields.split(',').map(f => f.trim());
          for (const key of customFieldKeys) {
              const value = formData.get(key) as string;
              if (value) {
                  additionalInfo[key] = value;
              }
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
          elo,
          eventId,
          additionalInfo,
        },
      });

      await sendRegistrationConfirmationEmail({
        firstName,
        lastName,
        email,
        eventName: event.title,
    });
  
      revalidatePath('/');
      return { type: 'success', message: 'Registration successful!' };
    } catch (error) {
      console.error('Registration error:', error);
      return { type: 'error', message: 'Something went wrong. Please try again.' };
    }
  }

  const eventSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    fullDetails: z.string().min(20, 'Full details must be at least 20 characters.'),
    date: z.string().min(5, 'Date is required.'),
    location: z.string().min(5, 'Location is required.'),
    // Zod transform to handle fee string parsing and validation
    fees: z.string().transform((val, ctx) => {
        try {
            return parseFees(val);
        } catch (e: unknown) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: e instanceof Error ? e.message : 'Invalid fee format' });
            return z.NEVER;
        }
    }),
    registrationEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    type: z.enum(['classic', 'blitz', 'scholastic', 'rapid']),
    isPremier: z.preprocess((val) => val === 'on', z.boolean()).optional(),
    customFields: z.string().optional(),
    pdfFile: z.any().refine(
        (file) => {
            if (!file || file.size === 0) {
                return true; // Optional file is allowed
            }
            // The `File` object will only be present when called from the client.
            // When this schema is evaluated on the server at build time, `File` might not be defined,
            // but the refine function won't be called with a File object then.
            return file instanceof File;
        },
        { message: "Invalid file type." }
    ).optional(),
});

async function handleEventForm(formData: FormData, eventId?: string) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = eventSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { type: 'error', errors: validatedFields.error.flatten().fieldErrors, fields: rawData };
    }

    const { pdfFile, ...eventData } = validatedFields.data;
    let pdfUrl: string | undefined = eventId ? (await prisma.event.findUnique({ where: { id: eventId } }))?.pdfUrl || undefined : undefined;

    // Handle PDF upload
    if (pdfFile && pdfFile.size > 0) {
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const filename = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '_')}`;
        const uploadPath = path.join(process.cwd(), 'public/uploads/pdfs', filename);
        
        try {
            await fs.writeFile(uploadPath, buffer);
            pdfUrl = `/uploads/pdfs/${filename}`;
        } catch (error) {
            console.error("File upload failed:", error);
            return { type: 'error', message: 'Failed to upload PDF.', fields: rawData };
        }
    }

    const dataToSave = {
        ...eventData,
        pdfUrl,
        isPremier: eventData.isPremier || false,
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
        return { type: 'error', message: 'Database error.', fields: rawData };
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
        return { type: 'error', message: 'Database error. Could not delete event.' };
    }

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
}