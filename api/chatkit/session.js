import OpenAI from "openai";
import { Resend } from "resend";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

// 📊 Tillfällig statistik (server memory)
let leadStats = {
  total: 0,
  byCompany: {},
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 📊 Statistik endpoint
  if (req.method === "GET") {
    return res.status(200).json({
      stats: leadStats,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, company } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const phoneMatch = message.match(/\d{7,}/);
    const emailMatch = message.match(/\S+@\S+\.\S+/);

    // =========================
    // 🔥 LEAD DETECTION
    // =========================

    if (phoneMatch || emailMatch) {
      const leadId = Math.floor(Math.random() * 1000000);
      const companyName = company || "okant";

      // 📊 Uppdatera statistik
      leadStats.total += 1;

      if (!leadStats.byCompany[companyName]) {
        leadStats.byCompany[companyName] = 0;
      }

      leadStats.byCompany[companyName] += 1;

      await resend.emails.send({
        from: "AI Lead <onboarding@resend.dev>",
        to: "casper.aho@gmail.com",
        reply_to: emailMatch ? emailMatch[0] : undefined,
        subject: `🔥 Ny lead #${leadId} från ${companyName.toUpperCase()}`,
        html: `
        <div style="font-family: Arial, sans-serif; background:#0f172a; padding:40px;">
          <div style="max-width:650px; margin:auto; background:white; padding:30px; border-radius:12px;">
            
            <h1 style="color:#111; margin-bottom:10px;">🚀 Ny AI‑Lead</h1>
            <p style="color:#666;">Lead ID: <strong>#${leadId}</strong></p>
            <p style="color:#666;">Tid: ${new Date().toLocaleString()}</p>

            <hr style="margin:25px 0;">

            <p><strong>Bransch:</strong> ${companyName}</p>

            <p style="margin-top:20px;"><strong>Kundens meddelande:</strong></p>

            <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
              ${message}
            </div>

            <hr style="margin:25px 0;">

            ${
              emailMatch
                ? `<a href="mailto:${emailMatch[0]}" 
                   style="display:inline-block; background:#2563eb; color:white; padding:12px 20px; border-radius:8px; text-decoration:none; margin-top:10px;">
                   Svara direkt till kunden
                 </a>`
                : ""
            }

            <p style="margin-top:30px; font-size:12px; color:#999;">
              Skickat automatiskt från din AI‑säljare.
            </p>

          </div>
        </div>
        `,
      });

      return res.status(200).json({
        reply:
          "Perfekt! 🙌 Vi har tagit emot dina uppgifter och återkommer väldigt snart.",
      });
    }

    // =========================
    // 🎭 SMARTARE PERSONLIGHETER
    // =========================

    const personalities = {
      bygg: `
Du är en professionell och förtroendeingivande byggfirma.
Ställ alltid följdfrågor om projektets omfattning, budget och tidsram.
Försök aktivt få kunden att lämna telefon eller mail för offert.
Var trygg, tydlig och lösningsorienterad.
      `,
      tandlakare: `
Du är en lugn och trygg tandläkarklinik.
Visa empati.
Ställ frågor om symptom och hur länge det pågått.
Föreslå alltid bokning av tid.
Försök få kontaktuppgifter om de inte redan lämnat.
      `,
      gym: `
Du är en energisk personlig tränare.
Fråga om mål (viktnedgång, muskler, kondition).
Ge konkreta tips.
Motivera.
Försök få kunden att boka konsultation och lämna kontaktuppgifter.
      `,
      frisor: `
Du är en trendmedveten och varm frisör.
Fråga om hårtyp och stil.
Föreslå klippning eller färg.
Erbjud gratis konsultation.
Be om kontaktuppgifter om de vill boka.
      `,
      mekaniker: `
Du är en kunnig och ärlig bilverkstad.
Ställ felsökningsfrågor.
Förklara möjliga orsaker enkelt.
Ge ungefärlig prisbild.
Erbjud tidsbokning och be om kontaktuppgifter.
      `,
      klader: `
Du är en stilmedveten modebutik.
Fråga om tillfälle (fest, jobb, vardag).
Föreslå konkreta outfits.
Uppmuntra beställning eller besök.
      `,
    };

    const systemPrompt =
      personalities[company] ||
      `
Du är en professionell företags-AI.
Var hjälpsam, säljande och ställ följdfrågor.
Försök naturligt få kunden att lämna kontaktuppgifter om det är relevant.
`;

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
