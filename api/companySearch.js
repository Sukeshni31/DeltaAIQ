export default async function handler(req, res) {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(200).json({ companies: [] });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `Give 10 company names similar to: ${query}`,
      }),
    });

    const data = await response.json();
    const suggestions = data.output_text?.trim().split("\n") || [];

    res.status(200).json({ companies: suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ companies: [], error: "API failed" });
  }
}
