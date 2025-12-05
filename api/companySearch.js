export default async function handler(req, res) {
  const { query } = req.query;

  // 1) If no query, just return empty list
  if (!query || query.trim() === "") {
    return res.status(200).json({ companies: [] });
  }

  // 2) Check env var is present
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      companies: [],
      error: "OPENAI_API_KEY missing in Vercel",
    });
  }

  try {
    // 3) Call the new Responses API (works with your sk-proj key)
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `List 10 companies similar to ${query}. Return only the company names, one per line, no bullets or numbers.`,
      }),
    });

    const data = await response.json();

    // 4) responses API gives a flat output_text string
    const text = data.output_text || "";

    const companies = text
      .split("\n")
      .map((line) => line.trim().replace(/^\d+\.\s*/, "")) // strip "1. "
      .filter((line) => line.length > 0);

    return res.status(200).json({ companies });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({
      companies: [],
      error: err.message,
    });
  }
}
