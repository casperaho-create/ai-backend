import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const match = cookies.match(/company_auth=([^;]+)/);
    if (!match) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await resend.emails.send({
      from: "AI Support <onboarding@resend.dev>",
      to,
      subject: "Svar på din förfrågan",
      html: `
        <div style="font-family: Arial;">
          <p>${message}</p>
          <hr>
          <small>Skickat via AI Admin</small>
        </div>
      `,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("REPLY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
