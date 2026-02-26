import OpenAI from "openai";
import { Resend } from "resend";

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

    // ======================
    // LEAD DETECTION
    // ======================

    const phoneMatch = message.match(/\d{7,}/);
    const emailMatch = message.match(/\S+@\S+\.\S+/);

    if (phoneMatch || emailMatch) {
      await resend.emails.send({
        from: "AI Lead <onboarding@resend.dev>",
        to: "DINMAIL@DIN-DOMÄN.SE",
        subject: `Ny lead från ${company}`,
        html: `
          <h2>Ny lead från AI-chatten</h2>
          <p><strong>Företag:</strong> ${company}</p>
          <p><strong>Meddelande:</strong> ${message}</p>
        `,
      });

      return res.status(200).json({
        reply: "Tack! Vi har noterat dina kontaktuppgifter och återkommer snart.",
      });
    }

    // ======================
    // PERSONALITIES
    // ======================

    const personalities = {
      bygg: "Du är en professionell byggfirma AI.",
      tandlakare: "Du är en trygg tandläkarklinik AI.",
      gym: "Du är en energisk personlig tränare.",
      frisor: "Du är en modern frisörsalong.",
      mekaniker: "Du är en professionell bilverkstad.",
      klader: "Du är en modebutik.",
    };

    const systemPrompt =
      personalities[company] ||
      "Du är en professionell företags-AI som svarar hjälpsamt.";

    // ======================
    // OPENAI CALL
    // ======================

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
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
