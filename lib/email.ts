// lib/email.ts

import nodemailer from 'nodemailer';

// Define the structure of the email payload
type RegistrationEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  customEmailText?: string;
  organiserEmail?: string;
};

// 1. Create a Nodemailer transporter using your SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  // `secure: true` for port 465, `secure: false` for other ports like 587 (uses STARTTLS)
  secure: Number(process.env.SMTP_PORT) === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// 2. Function to replace placeholders in custom text
function replacePlaceholders(text: string, payload: RegistrationEmailPayload): string {
  return text
    .replace(/\{firstName\}/g, payload.firstName)
    .replace(/\{lastName\}/g, payload.lastName)
    .replace(/\{eventTitle\}/g, payload.eventName)
    .replace(/\{eventDate\}/g, payload.eventDate || '')
    .replace(/\{eventLocation\}/g, payload.eventLocation || '');
}

// 3. Function to create the HTML content for the email
function getRegistrationEmailHtml(payload: RegistrationEmailPayload): string {
  // Get custom text or use default
  const customText = payload.customEmailText && payload.customEmailText.trim()
    ? replacePlaceholders(payload.customEmailText, payload)
    : 'Wir haben Ihre Anmeldung erhalten und freuen uns sehr, dass Sie dabei sind.\n\n';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #d4af37 0%, #c9a428 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">✓ Anmeldung bestätigt!</h1>
      </div>

      <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Sehr geehrte/r ${payload.firstName} ${payload.lastName},</p>

        <p style="font-size: 16px; color: #555; margin-bottom: 25px;">vielen Dank für Ihre Anmeldung zum folgenden Schachturnier:</p>

        <div style="background-color: #f8f9fa; border-left: 4px solid #d4af37; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <p style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 15px 0;">${payload.eventName}</p>
          ${payload.eventDate ? `<p style="font-size: 15px; color: #555; margin: 8px 0;"><strong style="color: #333;">📅 Datum:</strong> ${payload.eventDate}</p>` : ''}
          ${payload.eventLocation ? `<p style="font-size: 15px; color: #555; margin: 8px 0;"><strong style="color: #333;">📍 Ort:</strong> ${payload.eventLocation}</p>` : ''}
        </div>

        <div style="white-space: pre-line; font-size: 15px; color: #555; line-height: 1.7; margin: 25px 0;">${customText}</div>

        <p style="font-size: 15px; color: #555; margin-top: 30px;">Bei Fragen senden Sie gerne eine Mail an <a href="mailto:meldung@schachzwerge-magdeburg.de" style="color: #d4af37; text-decoration: none;">meldung@schachzwerge-magdeburg.de</a></p>

        <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #f0f0f0;">
          <p style="font-size: 15px; color: #555; margin-bottom: 8px;">Mit freundlichen Grüßen,</p>
          <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0;">Ihr Team der Schachzwerge Magdeburg e.V.</p>
        </div>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
        <p style="font-size: 11px; color: #6c757d; margin: 0 0 10px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Bankverbindung</p>
        <div style="font-size: 11px; color: #6c757d; line-height: 1.6;">
          <span style="display: inline-block; margin-right: 15px;">IBAN: DE14 8306 5408 0004 9859 82</span>
          <span style="display: inline-block; margin-right: 15px;">BIC: GENODEF1SLR</span><br>
          <span style="display: inline-block; margin-right: 15px;">Kontoinhaber: Schachzwerge Magdeburg e. V.</span>
          <span style="display: inline-block;">Bank: Deutsche Skatbank</span>
        </div>
      </div>
    </div>
  `;
}

// 3. The main function to send the confirmation email
export async function sendRegistrationConfirmationEmail(payload: RegistrationEmailPayload) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: payload.email,
    subject: `Anmeldebestätigung für "${payload.eventName}"`,
    html: getRegistrationEmailHtml(payload),
    ...(payload.organiserEmail && { bcc: payload.organiserEmail }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Registration confirmation email sent successfully to ${payload.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${payload.email}:`, error);
    // We log the error but don't throw it, so a failed email
    // doesn't cause the entire registration process to fail.
    // In a production app, you might add this to a retry queue.
  }
}