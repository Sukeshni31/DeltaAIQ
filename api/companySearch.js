// api/companySearch.js

export default async function handler(req, res) {
  try {
    const q = (req.query.query || "").trim();

    // no input → no suggestions
    if (!q) {
      return res.status(200).json({ companies: [] });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        companies: [],
        error: "Missing OPENAI_API_KEY"
      });
    }

    const payload = {
      model: "gpt-4.1-mini",
      input: `List exactly 5 companies similar to "${q}". 
Only output the company names, one per line, with no numbering and no extra text.`
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "response-2024-12-01"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON from OpenAI:", text);
      return res.status(500).json({
        companies: [],
        error: "Invalid JSON from OpenAI"
      });
    }

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        companies: [],
        error: data.error?.message || "OpenAI API error"
      });
    }

    const raw =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text?.value ||
      "";

    const companies = raw
      .split("\n")
      .map((c) => c.trim().replace(/^[-•\d.]\s*/, ""))
      .filter((c) => c);

    return res.status(200).json({ companies });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ companies: [], error: "Server error" });
  }
}
