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

  const { userId, company } = req.body;

  if (!company) {
    return res.status(400).json({ error: "company required" });
  }

  // 🔥 Simulera olika företag
  let companyResponse;

  if (company === "gym") {
    companyResponse = "Välkommen till vårt gym! 💪";
  } else if (company === "lawfirm") {
    companyResponse = "Välkommen till vår juristbyrå ⚖️";
  } else {
    companyResponse = "Okänt företag";
  }

  return res.status(200).json({
    message: companyResponse,
    userId,
    company
  });
}
