// api/companySearch.js

export default async function handler(req, res) {
  try {
    const q = (req.query.query || "").trim();

    if (!q) {
      return res.status(200).json({ companies: [] });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        companies: [],
        error: "OPENAI_API_KEY missing in Vercel",
      });
    }

    // Use the chat/completions endpoint – very stable
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",        // you can change to "gpt-4o-mini" if needed
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that suggests similar companies. " +
              "Only answer with company names, one per line.",
          },
          {
            role: "user",
            content: `List 5 companies that are similar to "${q}". Only give the names, one per line.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      // Read the actual error message from OpenAI and send it back
      let errorText = "OpenAI API error";
      try {
        const errJson = await response.json();
        errorText = errJson?.error?.message || JSON.stringify(errJson);
        console.error("OpenAI error JSON:", errJson);
      } catch (_) {
        const errRaw = await response.text();
        errorText = errRaw;
        console.error("OpenAI error text:", errRaw);
      }

      return res.status(500).json({ companies: [], error: errorText });
    }

    const data = await response.json();

    const rawText =
      data.choices?.[0]?.message?.content?.trim() || "";

    const companies = rawText
      .split("\n")
      .map((c) => c.replace(/^[-•\d.]\s*/, "").trim())
      .filter((c) => c.length > 1);

    return res.status(200).json({ companies });
  } catch (err) {
    console.error("Server error:", err);
    return res
      .status(500)
      .json({ companies: [], error: "Server error calling OpenAI" });
  }
}
