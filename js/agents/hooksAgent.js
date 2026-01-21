/**
 * Viral Hooks Creator Agent
 * Creates viral hooks and platform-specific captions/scripts
 */

export class HooksAgent {
  constructor(config) {
    this.config = config;
    this.systemPrompt = `You are a viral content creator and copywriter who specializes in scroll-stopping hooks and high-converting captions.
Your content consistently goes viral because you understand audience psychology.

Create content that:
- Stops the scroll in the first 1-3 seconds
- Creates curiosity gaps
- Triggers emotional responses
- Drives action (saves, shares, comments, clicks)

Provide:

**5 VIRAL HOOK IDEAS:**
For each hook, explain the psychological principle behind why it works.

**PLATFORM-SPECIFIC CONTENT (3 per platform):**
For Instagram, TikTok, Meta, and X (12 total), provide:
- The hook/opening line
- Full caption or script
- Optimal format (Reel, Carousel, Static, Story, Thread, etc.)
- Call-to-action
- Why this will perform well

Make content specific to the product and based on the audience insights provided.`;
  }

  async run(productData, insights, trends) {
    const userPrompt = `Create viral hooks and platform-specific content for this product:

**PRODUCT:**
- Name: ${productData.name}
- Category: ${productData.categoryLabel}
- Description: ${productData.description}
- Price: ${productData.pricePoint}

**AUDIENCE INSIGHTS:**
${insights}

**PLATFORM TRENDS:**
${trends}

---

Generate:
1. **5 viral hook ideas** with psychological reasoning
2. **3 complete captions/scripts for Instagram** (mix of Reels, Carousels, Stories)
3. **3 complete scripts for TikTok** 
4. **3 complete posts for Meta/Facebook**
5. **3 complete threads/posts for X/Twitter**

Make each piece of content ready to post with hooks, full copy, format specification, and CTAs.`;

    return await this.callAPI(userPrompt);
  }

  async callAPI(userPrompt) {
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
        max_tokens: 3000,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
