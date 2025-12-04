// api/companySearch.js
// Vercel serverless function using OpenAI to suggest company names

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const query = (req.query.q || "").toString().trim();
  if (!query || query.length < 2) {
    res.status(400).json({ error: "Query too short" });
    return;
  }

  try {
    const prompt = `
You are an API that helps with company name autocomplete.
The user typed: "${query}".

Return up to 6 likely real company names that match this fragment.
Include well-known global brands and relevant regional players if obvious.

Answer ONLY in this JSON format:
{
  "companies": [
    { "name": "Company Name 1", "note": "short descriptor like country/sector" },
    { "name": "Company Name 2", "note": "..." }
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON API. You only return valid JSON with the keys: companies -> [{name, note}].",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parsed = { companies: [] };
    }

    if (!Array.isArray(parsed.companies)) {
      parsed.companies = [];
    }

    res.status(200).json(parsed);
  } catch (err) {
    console.error("companySearch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
