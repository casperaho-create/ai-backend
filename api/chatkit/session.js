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
      await resend.emails.send({
        from: "AI Lead <onboarding@resend.dev>",
        to: "casper.aho@gmail.com",
        subject: `🔥 Ny lead från ${(company || "Okänt företag").toUpperCase()}`,
        html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
          <div style="max-width:600px; margin:auto; background:white; padding:25px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            
            <h2 style="color:#111;">🚀 Ny AI‑lead mottagen</h2>
            
            <p style="color:#555;">Din AI‑assistent har precis fångat en ny potentiell kund.</p>
            
            <hr style="margin:20px 0;">
            
            <p><strong>Företag:</strong> ${company || "Okänt företag"}</p>
            <p><strong>Meddelande:</strong></p>
            
            <div style="background:#f9fafb; padding:15px; border-radius:6px; margin-top:10px;">
              ${message}
            </div>
            
            <hr style="margin:25px 0;">
            
            <p style="font-size:14px; color:#777;">
              💡 Svara direkt på detta mail för att kontakta kunden.
            </p>
            
            <p style="font-size:12px; color:#aaa;">
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
