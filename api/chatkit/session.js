import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  // ✅ CORS (så Webador funkar)
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

    // ✅ Dynamisk system prompt baserat på företagstyp
    const systemPrompt = `
Du är en professionell AI-assistent för ett ${company || "företag"}.
Svara hjälpsamt, tydligt och professionellt.
Om det är en advokatfirma, ge juridiskt informativa men icke-bindande svar.
Om det är gym, ge träningsråd.
Anpassa tonen efter branschen.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    return res.status(200).json({
      reply: aiResponse
    });

  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}
