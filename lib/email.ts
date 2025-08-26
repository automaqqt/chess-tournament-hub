// lib/email.ts

import nodemailer from 'nodemailer';

// Define the structure of the email payload
type RegistrationEmailPayload = {
  firstName: string;
  lastName: string;
  email: string;
  eventName: string;
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

// 2. Function to create the HTML content for the email
function getRegistrationEmailHtml(payload: RegistrationEmailPayload): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #d4af37;">Anmeldung bestätigt!</h2>
  <p>Sehr geehrte/r ${payload.firstName} ${payload.lastName},</p>
  <br>
  <p>vielen Dank für Ihre Anmeldung zum folgenden Schachturnier:</p>
  <p style="font-size: 1.2em; font-weight: bold; color: #1a1a1a;">${payload.eventName}</p>
  <p>Wir haben Ihre Anmeldung erhalten und freuen uns sehr, dass Sie dabei sind.</p>
  <p>Bei Fragen können Sie uns jederzeit erreichen, indem Sie einfach auf diese E-Mail antworten.</p>
  <br>
  <p style="font-size: 1.1em; font-weight: bold; color: #1a1a1a;">
    Zahlungsinformationen:<br>
    IBAN: DE14 8306 5408 0004 9859 82<br>
    BIC: GENODEF1SLR<br>
    Kontoinhaber: Schachzwerge Magdeburg e. V.<br>
    Bank: Deutsche Skatbank
  </p>
  <p>Mit freundlichen Grüßen,</p>
  <p><strong>Ihr Team der Schachzwerge Magdeburg e.V.</strong></p>
</div>
  `;
}

// 3. The main function to send the confirmation email
export async function sendRegistrationConfirmationEmail(payload: RegistrationEmailPayload) {
  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL,
    to: payload.email,
    subject: `Confirmation for your registration to "${payload.eventName}"`,
    html: getRegistrationEmailHtml(payload),
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