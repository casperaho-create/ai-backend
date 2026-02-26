import OpenAI from "openai";
import { Resend } from "resend";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, company } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // =========================
    // 🔥 LEAD DETECTION
    // =========================

    const phoneMatch = message.match(/\d{7,}/);
    const emailMatch = message.match(/\S+@\S+\.\S+/);

    if (phoneMatch || emailMatch) {

      // 📊 Spara lead i fil (kan vara temporärt på Vercel)
      try {
        const newLead = {
          company: company || "Okänt företag",
          message,
          date: new Date().toISOString(),
        };

        let leads = [];

        try {
          const fileData = fs.readFileSync("leads.json", "utf8");
          leads = JSON.parse(fileData);
        } catch {
          leads = [];
        }

        leads.push(newLead);

        fs.writeFileSync("leads.json", JSON.stringify(leads, null, 2));
      } catch (err) {
        console.log("Kunde inte spara lead i fil:", err.message);
      }

      // 📧 Skicka mail
     const leadId = Math.floor(Math.random() * 1000000);

await resend.emails.send({
  from: "AI Lead <onboarding@resend.dev>",
  to: "casper.aho@gmail.com",
  reply_to: emailMatch ? emailMatch[0] : undefined,
  subject: `🔥 Ny lead #${leadId} från ${(company || "Okänt företag").toUpperCase()}`,
  html: `
  <div style="font-family: Arial, sans-serif; background:#0f172a; padding:40px;">
    <div style="max-width:650px; margin:auto; background:white; padding:30px; border-radius:12px;">
      
      <h1 style="color:#111; margin-bottom:10px;">🚀 Ny AI‑Lead</h1>
      <p style="color:#666;">Lead ID: <strong>#${leadId}</strong></p>
      <p style="color:#666;">Tid: ${new Date().toLocaleString()}</p>

      <hr style="margin:25px 0;">

      <p><strong>Bransch:</strong> ${company || "Okänt företag"}</p>

      <p style="margin-top:20px;"><strong>Kundens meddelande:</strong></p>

      <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
        ${message}
      </div>

      <hr style="margin:25px 0;">

      <a href="mailto:${emailMatch ? emailMatch[0] : ""}" 
         style="display:inline-block; background:#2563eb; color:white; padding:12px 20px; border-radius:8px; text-decoration:none; margin-top:10px;">
         Svara direkt till kunden
      </a>

      <p style="margin-top:30px; font-size:12px; color:#999;">
        Skickat automatiskt från din AI‑säljare.
      </p>

    </div>
  </div>
  `,
});

      return res.status(200).json({
        reply: "Perfekt! 🙌 Vi har tagit emot dina uppgifter och återkommer väldigt snart.",
      });
    }

    // =========================
    // 🎭 PERSONLIGHETER
    // =========================

    const personalities = {
      bygg: `
Du är en professionell och förtroendeingivande byggfirma.
Ställ frågor om projektets omfattning, budget och tidsram.
Nämn ROT-avdrag när relevant.
Driv mot offert.
      `,
      tandlakare: `
Du är en lugn och trygg tandläkarklinik.
Ställ frågor om symptom och smärta.
Ge informativa men icke-diagnostiska råd.
Erbjud alltid bokning.
      `,
      gym: `
Du är en energisk personlig tränare.
Fråga om mål.
Ge konkreta tips.
Motivera.
      `,
      frisor: `
Du är en trendmedveten frisör.
Fråga om hårtyp och stil.
Föreslå klippning och färg.
Erbjud konsultation.
      `,
      mekaniker: `
Du är en kunnig bilverkstad.
Ställ felsökningsfrågor.
Ge ungefärlig prisbild.
Erbjud tidsbokning.
      `,
      klader: `
Du är en stilmedveten modebutik.
Fråga om tillfälle.
Föreslå outfits och kombinationer.
      `,
    };

    const systemPrompt =
      personalities[company] ||
      `Du är en professionell företags-AI som svarar hjälpsamt och säljande.`;

    // =========================
    // 🤖 OPENAI
    // =========================

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.8,
    });

    return res.status(200).json({
      reply: aiResponse.choices[0].message.content,
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
