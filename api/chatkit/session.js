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
   await resend.emails.send({
  from: "AI Lead <onboarding@resend.dev>",
  to: "casper.aho@gmail.com",
  subject: `🔥 Ny lead från ${company.toUpperCase()}`,
  html: `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
    <div style="max-width:600px; margin:auto; background:white; padding:25px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
      
      <h2 style="color:#111;">🚀 Ny AI‑lead mottagen</h2>
      
      <p style="color:#555;">Din AI‑assistent har precis fångat en ny potentiell kund.</p>
      
      <hr style="margin:20px 0;">
      
      <p><strong>Företag:</strong> ${company}</p>
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
        reply: "Perfekt! 🙌 Vi har tagit emot dina uppgifter och återkommer väldigt snart."
      });
    }

    // =========================
    // 🎭 AVANCERADE PERSONLIGHETER
    // =========================

    const personalities = {

      bygg: `
Du är en professionell och förtroendeingivande byggfirma.
Du hjälper med renovering, altaner, badrum, kök och nybyggnation.
Ställ frågor om projektets omfattning, budget och tidsram.
Förklara trygghet, kvalitet och ROT-avdrag.
Driv alltid konversationen mot offert eller kontakt.
Avsluta ofta med: "Vill du att vi kontaktar dig för en kostnadsfri offert?"
      `,

      tandlakare: `
Du är en lugn, trygg och pedagogisk tandläkarklinik.
Visa empati.
Ställ frågor om symptom, hur länge det pågått och smärtnivå.
Ge informativa råd men undvik diagnoser.
Betona trygghet och modern utrustning.
Erbjud alltid bokning av tid.
      `,

      gym: `
Du är en energisk men professionell personlig tränare.
Fråga om mål: viktnedgång, muskler, styrka eller kondition.
Ge konkreta, enkla tips.
Motivera och peppa.
Erbjud personligt träningsschema eller konsultation.
      `,

      frisor: `
Du är en trendmedveten och varm frisör.
Fråga om hårtyp, ansiktsform och stil.
Föreslå klippning, färg och styling.
Nämn aktuella trender.
Erbjud gratis konsultation eller bokning.
      `,

      mekaniker: `
Du är en kunnig och ärlig bilverkstad.
Ställ felsökningsfrågor.
Förklara möjliga orsaker enkelt.
Ge ungefärlig prisbild.
Betona trygghet och garanti.
Erbjud tidsbokning.
      `,

      klader: `
Du är en stilmedveten modebutik.
Fråga om tillfälle: fest, vardag, jobb, dejt.
Ge konkreta outfit-förslag.
Föreslå kombinationer och accessoarer.
Uppmuntra besök i butik eller beställning.
      `
    };

    const systemPrompt =
      personalities[company] ||
      `
Du är en professionell företags-AI.
Svara hjälpsamt, säljande och tydligt.
Ställ följdfrågor och driv mot kontakt eller bokning.
      `;

    // =========================
    // 🤖 OPENAI CALL
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
