const express = require("express");
const path = require("path");

// Load env vars
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PERPLEXITY_API_KEY;

// Parse JSON bodies
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Proxy endpoint for Perplexity API (avoids CORS issues)
app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: { message: "Server missing API configuration" } });
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: { message: error.message } });
  }
});

// Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Marketing Agent Suite running on port ${PORT}`);
});
