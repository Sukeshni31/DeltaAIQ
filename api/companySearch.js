// api/companySearch.js

export default async function handler(req, res) {
  try {
    const q = (req.query.query || "").trim();

    // If no query text, just return empty list
    if (!q) {
      return res.status(200).json({ companies: [] });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        companies: [],
        error: "OPENAI_API_KEY missing in Vercel"
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `List 5 companies that are similar to "${q}". 
Only return the company names, one per line, no numbering.`
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", text);
      return res.status(500).json({ companies: [], error: "OpenAI API error" });
    }

    const data = await response.json();

    // New Responses API shape: output[0].content[0].text.value
    const rawText =
      data.output?.[0]?.content?.[0]?.text?.value || "";

    // Convert the text into a clean list of company names
    const companies = rawText
      .split("\n")
      .map((c) => c.replace(/^[-•\d.]\s*/, "").trim())
      .filter((c) => c.length > 1);

    return res.status(200).json({ companies });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ companies: [], error: "Server error" });
  }
}
