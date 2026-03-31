/**
 * Content Calendar Agent
 * Builds a 30-day narrative content calendar with AI-generated image prompts
 * and optional image generation via a separate image API.
 *
 * Generation strategy:
 * - Strategy summary + weekly themes: 1 lightweight call (800 tokens)
 * - 30 calendar days: 6 sequential chunk calls of 4–6 days each (~2500 tokens each)
 * - Field rules are embedded in the USER message so they count against the input
 *   budget (large) rather than the output budget (limited on Sonar)
 * - Each chunk uses a minimal system prompt to maximise output token headroom
 */

export class CalendarAgent {
  constructor(config) {
    this.config = config;

    // Full system prompt — used ONLY for the strategy summary call
    this.systemPrompt = `You are a senior social media growth strategist who has scaled DTC brands from 0 to 100k followers.

You understand that:
- Algorithms reward watch time, saves, comments, and shares — in that order on every platform
- The first line of every post is the only thing that determines if it gets read or watched
- A 30-day calendar must tell a building narrative arc, not 30 isolated posts
- Platform-native content always dramatically outperforms cross-posted content
- Over-hashtagging is now penalized — 5 max, targeted not generic
- UGC, social proof, and community posts generate the most algorithmic lift

Platform rules:
- Instagram Reels: hook in first 1.5s, vertical 9:16, 15–30s sweet spot, trending audio reference
- TikTok: raw/authentic > polished, text overlays essential, duet/stitch invitations drive discovery
- LinkedIn: no hashtag overload, line-break formatting, cliffhanger first sentence drives "see more"
- X/Twitter: threads with bold opener + numbered points outperform single tweets`;

    // Short system prompt — used for every chunk call to preserve output token budget
    this.chunkSystemPrompt = `You are a social media content strategist. Return ONLY valid JSON — no markdown, no explanation. The JSON must be complete and properly closed.`;
  }

  async run(productData, insights, trends, hooks) {
    const platforms = productData.platforms
      ? Array.isArray(productData.platforms)
        ? productData.platforms.join(", ")
        : productData.platforms
      : "Instagram, TikTok";

    const brandVoice = productData.brandVoice || "authentic, energetic, direct";
    const launchDate = productData.launchDate || "upcoming";

    // Base product context reused across all chunk calls
    const baseContext = `
**PRODUCT:**
- Name: ${productData.name}
- Category: ${productData.categoryLabel}
- Description: ${productData.description}
- Target Market: ${productData.targetMarket}
- Price Point: ${productData.pricePoint}
- Brand Voice: ${brandVoice}
- Active Platforms: ${platforms}
- Launch Date: ${launchDate}

**AUDIENCE INSIGHTS:**
${insights}

**PLATFORM TRENDS & STRATEGIES:**
${trends}

**VIRAL HOOKS & CONTENT:**
${hooks}`;

    // Step 1: Strategy summary + weekly themes (small dedicated call)
    const strategyPrompt = `${baseContext}

---

Based on the above product and research context, return ONLY this JSON object (no calendar days):
{
  "strategy_summary": "2–3 sentence overview of the 30-day narrative arc and growth strategy for this product",
  "weekly_themes": [
    "Week 1 theme (Days 1–7)",
    "Week 2 theme (Days 8–14)",
    "Week 3 theme (Days 15–21)",
    "Week 4 theme (Days 22–30)"
  ]
}`;

    const strategy = await this.callPlanningAPI(strategyPrompt, { max_tokens: 800 });

    // Step 2: Generate 30 calendar days across 6 chunks
    const calendarDays = await this.callPlanningAPIChunked(baseContext);

    // Step 3: Assemble final output — same shape as before, downstream rendering unchanged
    const calendarData = {
      strategy_summary: strategy.strategy_summary || "",
      weekly_themes: strategy.weekly_themes || [],
      calendar: calendarDays,
    };

    // Step 4: Optionally enrich with generated images
    return await this.generateImages(calendarData);
  }

  /**
   * Generates all 30 days across 6 sequential API calls of 4–6 days each.
   * Uses a short system prompt + embedded field rules in the user message
   * to maximise the output token budget available per chunk.
   */
  async callPlanningAPIChunked(baseContext) {
    const chunks = [
      { label: "Chunk 1", dayRange: "days 1–4",   startDay: 1,  endDay: 4,  phase: "Problem Recognition & Emotional Hook",  flexInstruction: "Do NOT include any flex slots." },
      { label: "Chunk 2", dayRange: "days 5–8",   startDay: 5,  endDay: 8,  phase: "Problem Recognition & Empathy",          flexInstruction: "Do NOT include any flex slots." },
      { label: "Chunk 3", dayRange: "days 9–12",  startDay: 9,  endDay: 12, phase: "Education & Authority Building",         flexInstruction: "Include exactly 1 flex slot (is_flex_slot: true)." },
      { label: "Chunk 4", dayRange: "days 13–18", startDay: 13, endDay: 18, phase: "Education → Social Proof",               flexInstruction: "Include exactly 1 flex slot (is_flex_slot: true)." },
      { label: "Chunk 5", dayRange: "days 19–24", startDay: 19, endDay: 24, phase: "Social Proof & Community",               flexInstruction: "Include exactly 1 flex slot (is_flex_slot: true)." },
      { label: "Chunk 6", dayRange: "days 25–30", startDay: 25, endDay: 30, phase: "Urgency, Conversion & CTA",              flexInstruction: "Do NOT include any additional flex slots." },
    ];

    const allDays = [];

    // Field definitions embedded here (input budget) so they don't eat output tokens
    const fieldRules = `Each day object MUST include ALL of these fields:
- day: number (the day number, e.g. 1, 2, 3...)
- date_offset: string (e.g. "Day 1 - Monday")
- narrative_phase: one of ["Awareness", "Education", "Social Proof", "Conversion"]
- platform: string (e.g. "Instagram", "TikTok", "X/Twitter", "LinkedIn")
- format: string (e.g. "Reel", "Carousel", "Thread", "Story Poll", "UGC Repost")
- hook: string (max 10 words — high tension or curiosity gap opening line)
- visual_frame_1: string (precise description of the first frame or hero image)
- image_prompt: string (detailed AI image generator prompt — include style, lighting, colours, composition)
- caption_opener: string (first 125 characters of caption, before truncation)
- full_caption: string (complete caption formatted for the platform, with line breaks)
- post_time: string (e.g. "7:30 PM WET")
- hashtags: array of up to 5 strings
- engagement_trigger: string (e.g. "save", "comment", "share", "DM", "duet")
- engagement_cta: string (explicit CTA at end of post)
- repurpose_as: array of 1–2 strings (how this adapts to other platforms)
- is_flex_slot: boolean`;

    for (const chunk of chunks) {
      const dayCount = chunk.endDay - chunk.startDay + 1;

      const chunkPrompt = `${baseContext}

---

TASK: Generate ONLY ${chunk.label} (${chunk.dayRange}) of a 30-day social media content calendar.
Narrative phase for this chunk: "${chunk.phase}"
Flex slot rule: ${chunk.flexInstruction}

RULES:
- Day numbers MUST start at ${chunk.startDay} and end at ${chunk.endDay} — use no other numbers.
- Generate exactly ${dayCount} day objects.
- Platform rules: Instagram Reels hook in first 1.5s; TikTok raw/authentic > polished; LinkedIn cliffhanger first sentence; X/Twitter threads with bold opener.
- Every post must feel written by the brand's best copywriter — no filler, no generic descriptions.
- For flex slots: set is_flex_slot to true, hook to "[TRENDING OPPORTUNITY]", full_caption to "[TRENDING OPPORTUNITY — replace with real-time trend]".

${fieldRules}

Return ONLY this JSON (no other text):
{
  "calendar": [ ...array of exactly ${dayCount} day objects... ]
}`;

      let parsed = null;
      let attempts = 0;

      while (attempts < 3 && !parsed) {
        attempts++;
        try {
          const result = await this.callPlanningAPI(chunkPrompt, {
            max_tokens: 2500,
            systemPrompt: this.chunkSystemPrompt,
          });

          if (!result?.calendar || !Array.isArray(result.calendar) || result.calendar.length === 0) {
            throw new Error(`returned an empty or invalid calendar array`);
          }

          parsed = result;
        } catch (err) {
          if (attempts >= 3) {
            throw new Error(
              `CalendarAgent: Failed to generate ${chunk.label} after 3 attempts. Last error: ${err.message}`,
            );
          }
          console.warn(
            `CalendarAgent: ${chunk.label} attempt ${attempts} failed — retrying in ${attempts}s... (${err.message})`,
          );
          await new Promise((res) => setTimeout(res, 1000 * attempts));
        }
      }

      allDays.push(...parsed.calendar);
    }

    return allDays;
  }

  /**
   * Core API call.
   * @param {string} userPrompt
   * @param {object} options
   * @param {number} options.max_tokens - token limit override (default: 2500)
   * @param {string} options.systemPrompt - system message override (default: this.systemPrompt)
   */
  async callPlanningAPI(userPrompt, options = {}) {
    const max_tokens = options.max_tokens || 2500;
    const systemMessage = options.systemPrompt || this.systemPrompt;

    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
        max_tokens,
        temperature: 0.82,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;

    // Strip markdown code fences robustly — handles ```json, ``` with or without newlines
    const cleaned = rawContent
      .trim()
      .replace(/^```(?:json|JSON)?\r?\n?/, "")
      .replace(/\r?\n?```\s*$/, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const hint =
        cleaned.length > 100 && !cleaned.endsWith("}")
          ? " (response may have been truncated — try again)"
          : "";
      throw new Error(
        `CalendarAgent: Failed to parse JSON response from planning API${hint}. Raw content: ${rawContent.substring(0, 200)}...`,
      );
    }
  }

  async generateImages(calendarData) {
    // Image generation is optional — skip if no imageApiUrl configured
    if (!this.config.imageApiUrl) {
      return calendarData;
    }

    const daysToProcess = (calendarData.calendar || []).filter(
      (day) => !day.is_flex_slot && day.image_prompt,
    );

    // Process in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < daysToProcess.length; i += BATCH_SIZE) {
      const batch = daysToProcess.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (day) => {
          try {
            day.generated_image_url = await this.callImageAPI(
              day.image_prompt,
              day.day,
            );
          } catch (err) {
            console.warn(
              `CalendarAgent: Image generation failed for Day ${day.day}:`,
              err.message,
            );
            day.generated_image_url = null;
          }
        }),
      );
    }

    return calendarData;
  }

  async callImageAPI(prompt, dayNumber) {
    const model = this.config.imageModel || "dall-e-3";
    const size = this.config.imageSize || "1024x1024";

    const response = await fetch(this.config.imageApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.imageApiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: `Social media post visual for Day ${dayNumber}. ${prompt}. Style: high quality, brand-ready, no watermarks. Format: square 1:1 for feed, or 9:16 vertical for Reels/TikTok as specified.`,
        n: 1,
        size,
        quality: "hd",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `CalendarAgent image API error for Day ${dayNumber}: ${error.error?.message || response.status}`,
      );
    }

    const data = await response.json();
    return data.data[0].url;
  }
}
