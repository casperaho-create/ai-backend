import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Hämta cookie
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const match = cookies.match(/company_auth=([^;]+)/);
    if (!match) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const companyId = match[1];

    // 📊 Hämta leads för rätt företag
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      leads: data
    });

  } catch (err) {
    console.error("LEADS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
