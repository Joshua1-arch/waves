interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  const senderEmail = process.env.EMAIL_SENDER || "noreply@waves-collective.com";
  const senderName = process.env.EMAIL_SENDER_NAME || "Waves Collective";

  console.log(`[Email Dispatcher] Queued email to: ${to}`);
  console.log(`[Email Dispatcher] Subject: ${subject}`);

  // Fallback / skeleton mock mode when no API keys are provided
  if (!brevoApiKey && !resendApiKey) {
    console.log("---------------- EMAIL SKELETON MODE ----------------");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body: ${text || "N/A"}`);
    console.log(`HTML Body:\n${html}`);
    console.log("-----------------------------------------------------");
    return true;
  }

  // 1. Resend API Integration
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to,
          subject,
          html,
          text,
        }),
      });

      if (response.ok) {
        console.log(`[Email Dispatcher] Resend successfully sent email to ${to}`);
        return true;
      } else {
        const errorData = await response.json();
        console.error(`[Email Dispatcher] Resend API failed:`, errorData);
      }
    } catch (err) {
      console.error(`[Email Dispatcher] Resend connection error:`, err);
    }
  }

  // 2. Brevo (Sendinblue) Transactional API Integration
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      if (response.ok) {
        console.log(`[Email Dispatcher] Brevo successfully sent email to ${to}`);
        return true;
      } else {
        const errorData = await response.json();
        console.error(`[Email Dispatcher] Brevo API failed:`, errorData);
      }
    } catch (err) {
      console.error(`[Email Dispatcher] Brevo connection error:`, err);
    }
  }

  return false;
}
