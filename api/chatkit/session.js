import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 🔥 LEAD DETECTION
    let leadMessage = null;

    if (message && message.match(/\d{7,}/)) {
      console.log("📞 Lead detected:", message);
      leadMessage = "Tack! Vi har noterat ditt telefonnummer och kontaktar dig snart.";
    }

    if (message && message.includes("@")) {
      console.log("📧 Lead detected:", message);
      leadMessage = "Tack! Vi har noterat din e-postadress och återkommer snart.";
    }

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔥 STOPPA HÄR OM LEAD
    if (leadMessage) {
      return res.status(200).json({
        reply: leadMessage
      });
    }

    // 🎯 OLIKA PERSONLIGHETER
    const personalities = {
      bygg: `
Du är en professionell byggfirma AI.
Ställ följdfrågor om projekt, budget och tidsram.
Nämn ROT-avdrag när relevant.
Avsluta med att erbjuda offert.
      `,
      tandlakare: `
Du är en trygg tandläkarklinik AI.
Svara lugnt och erbjud tidsbokning.
      `,
      gym: `
Du är en energisk personlig tränare.
Ge tränings- och kostråd.
      `,
      frisor: `
Du är en modern frisörsalong AI.
Ge stilråd och erbjud konsultation.
      `,
      mekaniker: `
Du är en professionell bilverkstad AI.
Ställ felsökningsfrågor och erbjud bokning.
      `,
      klader: `
Du är en modebutik AI.
Ge stilförslag och kombinationstips.
      `
    };

    const systemPrompt =
      personalities[company] ||
      `Du är en professionell företags-AI som svarar hjälpsamt.`;

    // 🔥 OPENAI ANROP
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
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}
