const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");

// Load env vars
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PERPLEXITY_API_KEY;

// Parse JSON bodies (limit to prevent DoS)
app.use(express.json({ limit: "1mb" }));

// Rate limit for proxy endpoint
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: { error: { message: "Too many requests from this IP. Please try again later." } }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Proxy endpoint for Perplexity API (avoids CORS issues)
app.post("/api/chat", chatLimiter, async (req, res) => {
  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: { message: "Server missing API configuration" } });
  }

  // Validate payload structure
  if (!req.body || !req.body.messages || !Array.isArray(req.body.messages)) {
    return res.status(400).json({ error: { message: "Invalid payload structure" } });
  }

  // 120s timeout — large calendar requests can take 60-90s
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Proxy timeout: Perplexity API took too long");
      return res.status(504).json({ error: { message: "Request timed out. Try again or reduce request size." } });
    }
    console.error("Proxy error:", error);
    res.status(500).json({ error: { message: error.message } });
  } finally {
    clearTimeout(timeout);
  }
});

// Serve index.html for root route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Marketing Agent Suite running on port ${PORT}`);
});
