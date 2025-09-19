
import type { Trip } from './types';
import { placeholderImageById, defaultPlaceholderImage } from './placeholder-images';

interface EmailRecipient {
  name: string;
  email: string;
}

interface WelcomeEmailParams extends EmailRecipient {}

interface TripInviteEmailParams extends EmailRecipient {
  trip: Trip;
}

/**
 * Generates an HTML welcome email for new users.
 * In a real app, this would use an email service (e.g., SendGrid, Resend) to send the email.
 * For now, it logs the HTML content to the console.
 */
export async function sendWelcomeEmail({ name, email }: WelcomeEmailParams) {
  const subject = "You're Invited to Plan Your Next Adventure with Trippy!";
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header { background-color: #0077ff; color: #ffffff; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px; }
        .content h2 { font-size: 22px; color: #0077ff; }
        .content p { font-size: 16px; line-height: 1.6; }
        .cta-button { display: inline-block; background-color: #0077ff; color: #ffffff; padding: 12px 25px; margin-top: 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        .footer { background-color: #f4f4f7; padding: 20px; text-align: center; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Trippy!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name}, get ready for an adventure!</h2>
          <p>You've been invited to collaborate on a trip using Trippy, the ultimate AI-powered travel planner.</p>
          <p>To get started and see the trip details, click the button below to create your account.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/signup" class="cta-button">Sign Up for Trippy</a>
          <p style="margin-top: 30px;">Happy travels!</p>
          <p><strong>- The Trippy Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Trippy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('--- SENDING WELCOME EMAIL ---');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  // console.log(html); // Uncomment to see the full HTML in logs
  console.log('----------------------------');
  
  // In a real app, you would replace the console logs with your email service call:
  // await resend.emails.send({ from: 'onboarding@trippy.com', to: email, subject, html });
}


/**
 * Generates an HTML trip invitation email.
 * In a real app, this would use an email service to send the email.
 * For now, it logs the HTML content to the console.
 */
export async function sendTripInviteEmail({ name, email, trip }: TripInviteEmailParams) {
  const subject = `You're invited to plan a trip to ${trip.destination}!`;
  const imageInfo = (trip.imageId && placeholderImageById[trip.imageId]) || defaultPlaceholderImage;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background-color: #f4f4f7; color: #333; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .header-image { width: 100%; height: 250px; background-image: url('${imageInfo.imageUrl.replace('/600/400', '/800/500')}'); background-size: cover; background-position: center; }
        .content { padding: 40px; }
        .content h1 { font-size: 28px; margin-top: 0; color: #333; }
        .content p { font-size: 16px; line-height: 1.6; }
        .cta-button { display: inline-block; background-color: #0077ff; color: #ffffff; padding: 12px 25px; margin-top: 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        .footer { background-color: #f4f4f7; padding: 20px; text-align: center; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-image"></div>
        <div class="content">
          <h1>Let's plan a trip to ${trip.destination}!</h1>
          <p>Hi ${name},</p>
          <p>You've been invited to start planning an amazing adventure. Click the button below to view the itinerary, manage expenses, and collaborate in real-time.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/trips/${trip.id}" class="cta-button">View Trip Details</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Trippy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  console.log('--- SENDING TRIP INVITE EMAIL ---');
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  // console.log(html); // Uncomment to see the full HTML in logs
  console.log('-------------------------------');

  // In a real app, you would replace the console logs with your email service call:
  // await resend.emails.send({ from: 'invites@trippy.com', to: email, subject, html });
}
