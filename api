export default async function handler(req, res) {
  const { query } = req.query;

  // If no query entered, return empty list
  if (!query || query.trim() === "") {
    return res.status(200).json({ companies: [] });
  }

  // Ensure API KEY is set in Vercel
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      companies: [],
      error: "OPENAI_API_KEY missing in Vercel"
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `Give me a list of real company names that match: ${query}`
      })
    });

    const data = await response.json();
    const text = data.output_text || "";

    const companies = text
      .split("\n")
      .map(c => c.trim())
      .filter(Boolean);

    return res.status(200).json({ companies });

  } catch (error) {
    return res.status(500).json({
      companies: [],
      error: error.message
    });
  }
}
