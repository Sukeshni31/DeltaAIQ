// api/companySearch.js
// Vercel serverless function to suggest company names using OpenAI

export default async function handler(req, res) {
  const { query } = req.query;

  // Validate query
  if (!query || query.trim() === "") {
    return res.status(200).json({ companies: [] });
  }

  // Validate environment variable
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      companies: [],
      error: "OPENAI_API_KEY missing in Vercel"
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You suggest company names similar to a given company. Return only the list, one company per line."
          },
          {
            role: "user",
            content: `Suggest 10 companies similar to: ${query}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content || "";

    const companies = content
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\-\)]?\s*/, "").trim())
      .filter((line) => line.length > 0);

    return res.status(200).json({ companies });
  } catch (error) {
    return res.status(500).json({
      companies: [],
      error: error.message
    });
  }
}
