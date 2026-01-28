import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Only GET allowed" });
  }

  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.status(200).json({ companies: [] });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY missing" });
  }

  try {
    const prompt = `
Return up to 8 real company name suggestions for: "${q}"

Output ONLY valid JSON exactly:
{"companies":[{"name":"...","note":"..."}]}
`;

    const r = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return only valid JSON. No extra text." },
        { role: "user", content: prompt }
      ],
      max_tokens: 250
    });

    const text = r.choices?.[0]?.message?.content || "{}";
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { companies: [] }; }

    const companies = Array.isArray(parsed.companies) ? parsed.companies : [];
    const clean = companies
      .filter(c => c && typeof c.name === "string")
      .slice(0, 8)
      .map(c => ({ name: c.name.trim(), note: String(c.note || "").trim() }));

    return res.status(200).json({ companies: clean });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
