/**
 * Email Service
 * 
 * Uses EmailJS (https://www.emailjs.com/) to send welcome emails securely from the frontend.
 * 
 * SETUP INSTRUCTIONS FOR FULL CUSTOM HTML:
 * 1. Go to your EmailJS Template.
 * 2. Delete everything in the template body.
 * 3. Type exactly this (with triple brackets): {{{html_content}}}
 * 4. Save the template.
 * Now, the React code directly controls the entire email design!
 */

interface WelcomeEmailParams {
  to_email: string;
  to_name: string;
}

const getWelcomeEmailHtml = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Aethelcare</title>
</head>
<body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 40px 20px;">
  <div style="max-w-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.04); border: 1px solid #f3f4f6;">
    
    <div style="text-align: left; margin-bottom: 32px;">
      <h2 style="color: #2563EB; font-weight: 900; font-size: 24px; margin: 0; letter-spacing: -0.5px;">Aethelcare<span style="color: #0F172A;">.</span></h2>
    </div>

    <h1 style="color: #0F172A; font-size: 28px; font-weight: 800; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.5px;">Welcome to the future of health, ${name}!</h1>
    
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      We're absolutely thrilled to have you here. You now have instant access to our advanced AI Medical Scanner, smart timetables, and detailed pharmaceutical insights.
    </p>

    <div style="background-color: #EFF6FF; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #DBEAFE;">
      <h3 style="color: #1E3A8A; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">What can you do right now?</h3>
      <ul style="color: #1E40AF; font-size: 15px; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>Upload a prescription for instant safety analysis.</li>
        <li>Set up your automated medication reminders.</li>
        <li>Compare generic variants vs branded medicines.</li>
      </ul>
    </div>

    <a href="https://aethelcare.xyz/dashboard" style="display: inline-block; background-color: #0F172A; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; margin-bottom: 32px;">Go to your Dashboard &rarr;</a>

    <p style="color: #64748B; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
      Got questions? Just reply to this email, we're always here to help.
      <br><br>
      Stay healthy,<br>
      <strong style="color: #0F172A;">The Aethelcare Team</strong>
    </p>
  </div>
  <div style="text-align: center; margin-top: 24px;">
    <p style="color: #94A3B8; font-size: 12px;">© ${new Date().getFullYear()} Aethelcare AI. All rights reserved.</p>
  </div>
</body>
</html>
`;

export const sendWelcomeEmail = async (params: WelcomeEmailParams) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.log(
      '📧 [Email Service] Welcome email skipped: VITE_EMAILJS_* environment variables are missing. ' +
      `Would have sent welcome email to: ${params.to_email}`
    );
    return;
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          email: params.to_email,
          name: params.to_name,
          html_content: getWelcomeEmailHtml(params.to_name || 'there'),
        }
      })
    });

    if (response.ok) {
      console.log(`📧 [Email Service] Welcome email successfully sent to ${params.to_email}`);
    } else {
      console.error('📧 [Email Service] Failed to send email', await response.text());
    }
  } catch (error) {
    console.error('📧 [Email Service] Error triggering EmailJS:', error);
  }
};
