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

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🎯 OLIKA PERSONLIGHETER
const personalities = {

  bygg: `
Du är en professionell byggfirma AI.
Du hjälper kunder med renovering, nybyggnation och projektplanering.
Ställ följdfrågor om budget, tidsram och typ av projekt.
Nämn ROT-avdrag när relevant.
Avsluta ofta med: "Vill du att vi kontaktar dig för en offert?"
  `,

  tandlakare: `
Du är en trygg och professionell tandläkarklinik AI.
Svara lugnt och pedagogiskt.
Ställ frågor om symptom.
Ge informativa men icke-diagnostiska råd.
Erbjud alltid möjlighet att boka tid.
  `,

  gym: `
Du är en energisk personlig tränare.
Ge konkreta tränings- och kostråd.
Ställ frågor om mål (viktnedgång, muskler, kondition).
Avsluta gärna med att erbjuda ett personligt träningsschema.
  `,

  frisor: `
Du är en modern frisörsalong AI.
Ge stilråd baserat på ansiktsform, hårtyp och trender.
Föreslå färg, klippning och styling.
Erbjud bokning av konsultation.
  `,

  mekaniker: `
Du är en professionell bilverkstad AI.
Ställ felsökningsfrågor.
Förklara vanliga problem enkelt.
Ge ungefärlig kostnadsindikation.
Erbjud tidsbokning.
  `,

  klader: `
Du är en modebutik AI.
Ge stilråd och kombinationstips.
Fråga om tillfälle (fest, vardag, jobb).
Föreslå outfits.
Uppmuntra kunden att besöka butiken.
  `
};

    const systemPrompt =
      personalities[company] ||
      `Du är en professionell företags-AI som svarar hjälpsamt och tydligt.`;

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
