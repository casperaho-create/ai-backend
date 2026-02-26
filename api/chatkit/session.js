import OpenAI from "openai";
import { Resend } from "resend";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS
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

    // =============================
    // 🔥 LEAD DETECTION
    // =============================

    let leadDetected = false;

    const phoneMatch = message.match(/\d{7,}/);
    const emailMatch = message.match(/\S+@\S+\.\S+/);

    if (phoneMatch || emailMatch) {
      leadDetected = true;

      // 📧 SKICKA MAIL VIA RESEND
      await resend.emails.send({
        from: "AI Lead <onboarding@resend.dev>", // Byt till din verifierade domän senare
        to: "casper.aho@gmail.com
        subject: `Ny lead från ${company}`,
        html: `
          <h2>Ny lead från AI-chatten</h2>
          <p><strong>Företag:</strong> ${company}</p>
          <p><strong>Meddelande:</strong> ${message}</p>
        `,
      });

      return res.status(200).json({
        reply: "Tack! Vi har noterat dina kontaktuppgifter och återkommer så snart som möjligt."
      });
    }

    // =============================
    // 🎭 PERSONLIGHETER
    // =============================

    const personalities = {
      bygg: `
Du är en professionell byggfirma AI.
Du hjälper kunder med renovering och nybyggnation.
Ställ frågor om projekt, budget och tidsram.
Nämn ROT-avdrag när relevant.
Avsluta ofta med: "Vill du att vi kontaktar dig för en offert?"
      `,
      tandlakare: `
Du är en trygg och professionell tandläkarklinik AI.
Svara lugnt och pedagogiskt.
Ställ frågor om symptom.
Ge informativa men inte medicinskt definitiva svar.
Erbjud alltid möjlighet att boka tid.
      `,
      gym: `
Du är en energisk personlig tränare.
Ge tränings- och kostråd.
Fråga om mål (viktnedgång, muskler, kondition).
Erbjud personligt schema.
      `,
      frisor: `
Du är en modern frisörsalong AI.
Ge stilråd baserat på hårtyp och ansiktsform.
Föreslå färg, klippning och styling.
Erbjud bokning.
      `,
      mekaniker: `
Du är en professionell bilverkstad AI.
Ställ felsökningsfrågor.
Förklara problem enkelt.
Ge ungefärlig kostnadsbild.
Erbjud tidsbokning.
      `,
      klader: `
Du är en modebutik AI.
Ge stilråd och outfitförslag.
Fråga om tillfälle.
Uppmuntra besök i butik.
      `
    };

    const systemPrompt =
      personalities[company] ||
      `Du är en professionell företags-AI som svarar hjälpsamt och tydligt.`;

    // =============================
    // 🤖 OPENAI SVAR
    // =============================

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}
