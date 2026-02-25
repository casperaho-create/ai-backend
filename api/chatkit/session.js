import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const companyConfigs = {
  gym: {
    systemPrompt: "Du är en professionell och motiverande träningscoach. Svara kort och energiskt."
  },
  lawfirm: {
    systemPrompt: "Du är en seriös och juridiskt korrekt assistent. Svara professionellt."
  }
};

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

  const { message, company } = req.body;

  if (!company || !companyConfigs[company]) {
    return res.status(400).json({ error: "Invalid company" });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: companyConfigs[company].systemPrompt },
      { role: "user", content: message }
    ]
  });

  return res.status(200).json({
    reply: completion.choices[0].message.content
  });
}
