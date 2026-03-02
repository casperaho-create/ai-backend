import OpenAI from "openai";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =====================================================
  // 📊 GET – Hämta statistik (ADMIN)
  // =====================================================
  if (req.method === "GET") {
    const { api_key } = req.query;

    if (!api_key) {
      return res.status(400).json({ error: "API key required" });
    }

    // 🔎 Hitta företag
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("api_key", api_key)
      .single();

    if (companyError || !company) {
      return res.status(400).json({ error: "Invalid API key" });
    }

    // 📊 Hämta endast deras leads
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const total = data.length;

    return res.status(200).json({
      stats: {
        total,
      },
      leads: data,
    });
  }

  // =====================================================
  // ❌ FEL METHOD
  // =====================================================
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, api_key } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!api_key) {
      return res.status(400).json({ error: "API key missing" });
    }

    // 🔎 Hitta företag via api_key
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("api_key", api_key)
      .single();

    if (companyError || !company) {
      return res.status(400).json({ error: "Invalid API key" });
    }

    const phoneMatch = message.match(/\d{7,}/);
    const emailMatch = message.match(/\S+@\S+\.\S+/);

    // =====================================================
    // 🔥 LEAD DETECTION
    // =====================================================
    if (phoneMatch || emailMatch) {
      const leadId = Math.floor(Math.random() * 1000000);

      // 💾 Spara lead med company_id
      await supabase.from("leads").insert([
        {
          company_id: company.id,
          company: company.name,
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
        subject: `🔥 Ny lead #${leadId} från ${company.name.toUpperCase()}`,
        html: `
        <div style="font-family: Arial; background:#0f172a; padding:40px;">
          <div style="max-width:650px; margin:auto; background:white; padding:30px; border-radius:12px;">
            <h1>🚀 Ny AI‑Lead</h1>
            <p><strong>ID:</strong> #${leadId}</p>
            <p><strong>Tid:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p><strong>Företag:</strong> ${company.name}</p>
            <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
              ${message}
            </div>
          </div>
        </div>
        `,
      });

      return res.status(200).json({
        reply:
          "Perfekt! 🙌 Vi har tagit emot dina uppgifter och återkommer väldigt snart.",
      });
    }

    // =====================================================
    // 🤖 AI SVAR
    // =====================================================
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du är en professionell företags-AI. Var säljande och försök naturligt få kontaktuppgifter.",
        },
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
