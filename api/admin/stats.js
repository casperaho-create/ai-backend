import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function checkAuth(req) {
  const cookie = req.headers.cookie || "";
  return cookie.includes("admin_auth=valid");
}

export default async function handler(req, res) {
  // 🔐 Skydda endpointen
  if (!checkAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Hämta leads
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Räkna stats
    const total = leads.length;

    const byCompany = {};
    leads.forEach((lead) => {
      const company = lead.company || "Okänd";
      byCompany[company] = (byCompany[company] || 0) + 1;
    });

    return res.status(200).json({
      stats: {
        total,
        byCompany,
      },
      leads,
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
