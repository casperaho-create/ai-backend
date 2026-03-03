import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !company) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, company.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.setHeader(
      "Set-Cookie",
      `company_auth=${company.id}; HttpOnly; Path=/; SameSite=Strict`
    );

    return res.status(200).json({
      success: true,
      company_id: company.id,
      name: company.name
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
