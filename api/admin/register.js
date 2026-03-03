import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
    const { name, email, password, company_type } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // 🔐 Hasha lösenord
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔑 Skapa unik API-nyckel
    const apiKey = crypto.randomBytes(32).toString("hex");

    // 🏢 Spara företag
    const { data, error } = await supabase
      .from("companies")
      .insert([
       .insert([
  {
    name,
    email,
    password: hashedPassword,
    api_key: apiKey,
    company_type
  }
])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      company: {
        id: data.id,
        name: data.name,
        email: data.email,
        api_key: data.api_key
      }
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
