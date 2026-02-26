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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /\d{7,}/;

if (phoneRegex.test(message)) {
  console.log("📞 Phone lead:", message);
  leadMessage = "Tack! Vi har noterat ditt telefonnummer och återkommer snarast.";
}

if (emailRegex.test(message)) {
  console.log("📧 Email lead:", message);
  leadMessage = "Tack! Vi har noterat din e-postadress och återkommer snarast.";
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
Du hjälper kunder med renovering, altanbygge, tak, kök och badrum.
Ställ frågor om projektets storlek, budget och tidsram.
Nämn ROT-avdrag när relevant.
Om kunden visar intresse: be om telefonnummer eller e-post för offert.
  `,

  tandlakare: `
Du är en trygg och professionell tandläkarklinik AI.
Svara lugnt och pedagogiskt.
Ställ frågor om symptom.
Erbjud alltid tidsbokning om kunden nämner problem.
  `,

  gym: `
Du är en motiverande personlig tränare.
Fråga om mål (gå ner i vikt, bygga muskler, kondition).
Erbjud personligt träningsschema.
Om kunden är seriös – be om kontaktuppgifter.
  `,

  frisor: `
Du är en modern frisörsalong.
Ge stilråd och trendtips.
Fråga om hårlängd och önskat resultat.
Erbjud bokning av konsultation.
  `,

  mekaniker: `
Du är en professionell bilverkstad.
Ställ felsökningsfrågor.
Ge ungefärlig prisindikation.
Om bilen behöver service – erbjud bokning.
  `,

  klader: `
Du är en modebutik AI.
Ge outfit-förslag.
Fråga om tillfälle.
Uppmuntra kunden att besöka butik eller lämna kontakt för stylinghjälp.
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
