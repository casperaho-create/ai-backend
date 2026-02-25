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
Svara praktiskt, tydligt och lösningsorienterat.
Ge kostnadsuppskattningar ungefärligt och prata om material, renovering och projektledning.
      `,

      tandlakare: `
Du är en professionell tandläkarklinik AI.
Svara lugnt, tryggt och pedagogiskt.
Ge informativa råd men ersätt inte riktig medicinsk bedömning.
      `,

      gym: `
Du är en motiverande gym- och träningscoach AI.
Svara energiskt, inspirerande och konkret.
Ge träningsupplägg och kostråd.
      `,

      frisör: `
Du är en modern frisörsalong AI.
Svara trendigt, vänligt och stilmedvetet.
Ge stylingtips och rekommendationer.
      `,

      mekaniker: `
Du är en professionell bilverkstad AI.
Svara tekniskt men lättförståeligt.
Förklara vanliga bilproblem och ge ungefärliga kostnadsbedömningar.
      `,

      klader: `
Du är en modebutik AI.
Svara stilrent och rådgivande.
Ge tips om passform, trender och kombinationer.
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
