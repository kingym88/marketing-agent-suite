/**
 * Content Calendar Agent
 * Builds a 30-day narrative content calendar with AI-generated image prompts
 * and optional image generation via a separate image API.
 */

export class CalendarAgent {
  constructor(config) {
    this.config = config;

    this.systemPrompt = `You are a senior social media growth strategist who has scaled DTC brands from 0 to 100k followers.

You understand that:
- Algorithms reward watch time, saves, comments, and shares — in that order on every platform
- The first line of every post is the only thing that determines if it gets read or watched
- A 30-day calendar must tell a building narrative arc, not 30 isolated posts
- Platform-native content always dramatically outperforms cross-posted content
- Over-hashtagging is now penalized — 5 max, targeted not generic
- UGC, social proof, and community posts generate the most algorithmic lift

Platform rules you must follow:
- Instagram Reels: hook in first 1.5s, vertical 9:16, 15–30s sweet spot, trending audio reference
- TikTok: raw/authentic > polished, text overlays essential, duet/stitch invitations drive discovery
- LinkedIn: no hashtag overload, line-break formatting, cliffhanger first sentence drives "see more"
- X/Twitter: threads with bold opener + numbered points outperform single tweets

For each day you MUST return a JSON object with these exact fields:
- day: number (1–30)
- date_offset: string (e.g. "Day 1 - Monday")
- narrative_phase: one of ["Awareness", "Education", "Social Proof", "Conversion"]
- platform: string (specific platform)
- format: string (platform-native format e.g. "Reel", "Carousel", "Thread", "UGC Repost", "Story Poll")
- hook: string (exact opening line or on-screen text — max 10 words, high tension or curiosity gap)
- visual_frame_1: string (precise description of the exact first frame, shot, or hero image)
- image_prompt: string (a detailed, vivid prompt for an AI image generator — include style, lighting, composition, colours, and any text overlay needed — must be detailed enough to produce a ready-to-post visual with no further editing)
- caption_opener: string (first 125 characters of caption — ends before "more" truncation)
- full_caption: string (complete caption with line breaks formatted for the platform)
- post_time: string (exact local time + timezone, e.g. "7:30 PM WET")
- hashtags: array of 5 strings max
- engagement_trigger: string (specific action this post engineers: save / comment / share / DM / duet)
- engagement_cta: string (the explicit call-to-action line at the end of the post)
- repurpose_as: array of strings (how this adapts to 1–2 other platforms)
- is_flex_slot: boolean (true = leave for trending moment, false = fixed content)

Structure the 30 days as a deliberate narrative arc:
- Week 1 (Days 1–7): Problem + Empathy — audience feels deeply understood
- Week 2 (Days 8–14): Education + Authority — you own the solution
- Week 3 (Days 15–21): Social Proof + Community — others validate you
- Week 4 (Days 22–30): Urgency + Conversion — why act now

Include exactly 3 flex slots spread across weeks 2, 3, and 4. Mark them with is_flex_slot: true and set hook and full_caption to "[TRENDING OPPORTUNITY — replace with real-time trend]".

Return ONLY a valid JSON object in this format:
{
  "strategy_summary": "2–3 sentence overview of the narrative arc and growth strategy",
  "weekly_themes": ["Week 1 theme", "Week 2 theme", "Week 3 theme", "Week 4 theme"],
  "calendar": [ ...30 day objects... ]
}`;
  }

  async run(productData, insights, trends, hooks) {
    const platforms = productData.platforms
      ? Array.isArray(productData.platforms)
        ? productData.platforms.join(", ")
        : productData.platforms
      : "Instagram, TikTok";

    const brandVoice = productData.brandVoice || "authentic, energetic, direct";
    const launchDate = productData.launchDate || "upcoming";

    const userPrompt = `Create a comprehensive 30-day narrative content calendar for this product:

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
${hooks}

---

Build the 30-day narrative arc calendar. Every post must feel like it was written by the brand's best copywriter — no filler, no generic descriptions. The image_prompt field must be detailed enough that an AI image model produces a ready-to-post visual with no further editing needed.`;

    const calendarData = await this.callPlanningAPI(userPrompt);
    const enrichedData = await this.generateImages(calendarData);
    return enrichedData;
  }

  async callPlanningAPI(userPrompt) {
    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.82,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;

    try {
      return JSON.parse(rawContent);
    } catch (e) {
      throw new Error(
        `CalendarAgent: Failed to parse JSON response from planning API. Raw content: ${rawContent.substring(0, 200)}...`,
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
