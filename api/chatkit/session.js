import OpenAI from "openai";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 📊 GET = Statistik + senaste leads
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const total = data.length;

    const byCompany = {};
    data.forEach((lead) => {
      const key = lead.company || "okant";
      if (!byCompany[key]) byCompany[key] = 0;
      byCompany[key]++;
    });

    return res.status(200).json({
      stats: {
        total,
        byCompany,
      },
      leads: data,
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

      // 💾 Spara i Supabase
      await supabase.from("leads").insert([
        {
          company: companyName,
          message,
          email: emailMatch ? emailMatch[0] : null,
          phone: phoneMatch ? phoneMatch[0] : null,
        },
      ]);

      // 📧 Skicka mail
      await resend.emails.send({
        from: "AI Lead <onboarding@resend.dev>",
        to: "casper.aho@gmail.com",
        reply_to: emailMatch ? emailMatch[0] : undefined,
        subject: `🔥 Ny lead #${leadId} från ${companyName.toUpperCase()}`,
        html: `
        <div style="font-family: Arial; background:#0f172a; padding:40px;">
          <div style="max-width:650px; margin:auto; background:white; padding:30px; border-radius:12px;">
            <h1>🚀 Ny AI‑Lead</h1>
            <p><strong>ID:</strong> #${leadId}</p>
            <p><strong>Tid:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p><strong>Bransch:</strong> ${companyName}</p>
            <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
              ${message}
            </div>
            ${
              emailMatch
                ? `<p style="margin-top:20px;">
                    <a href="mailto:${emailMatch[0]}" 
                       style="background:#2563eb;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">
                       Svara direkt till kunden
                    </a>
                  </p>`
                : ""
            }
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
    // 🎭 PERSONLIGHETER
    // =========================
    const personalities = {
      bygg: `Du är en professionell byggfirma. Ställ frågor om projekt, budget och tidsram. Försök få kontaktuppgifter.`,
      tandlakare: `Du är en trygg tandläkarklinik. Visa empati och föreslå bokning.`,
      gym: `Du är en energisk PT. Fråga om mål och erbjud konsultation.`,
      frisor: `Du är en trendig frisör. Fråga om stil och erbjud bokning.`,
      mekaniker: `Du är en kunnig bilverkstad. Förklara enkelt och erbjud tidsbokning.`,
      klader: `Du är en stilmedveten modebutik. Föreslå outfits och uppmuntra köp.`,
    };

    const systemPrompt =
      personalities[company] ||
      `Du är en professionell företags-AI. Var säljande och försök naturligt få kontaktuppgifter.`;

    // 🤖 OPENAI
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
