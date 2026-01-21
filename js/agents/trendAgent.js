/**
 * Trend Analyzer Agent
 * Identifies platform-specific trends and creates social media strategies
 */

export class TrendAgent {
  constructor(config) {
    this.config = config;
    this.systemPrompt = `You are a social media strategist with expertise in current platform trends and algorithms.
Use your knowledge of the current social media trends over the last 3 months to provide platform-specific strategies.

For each platform (Instagram, TikTok, Meta/Facebook, X/Twitter), provide:

1. **Current Trending Formats** - What content types are performing best right now?
2. **Algorithm Preferences** - What does the algorithm prioritize? How to get reach?
3. **Trending Topics & Sounds** - Current trends relevant to this product category in the last week
4. **Optimal Posting Strategy** - Best times, frequency, and engagement tactics
5. **Hashtag Strategy** - Mix of trending, niche, and branded hashtags
6. **Platform-Specific Strategy** - A tailored approach for this specific product

Base your recommendations on current trends and best practices. Be specific with examples.`;
  }

  async run(productData, insights) {
    const userPrompt = `Create platform-specific social media strategies based on this market research:

**PRODUCT:**
- Name: ${productData.name}
- Category: ${productData.categoryLabel}
- Description: ${productData.description}
- Target Market: ${productData.targetMarket}
- Price: ${productData.pricePoint}

**MARKET RESEARCH INSIGHTS:**
${insights}

---

Generate comprehensive, current social media strategies for:
1. **Instagram** (Reels, Stories, Posts, Carousels)
2. **TikTok** (Short-form video trends)
3. **Meta/Facebook** (Groups, Ads, Reels)
4. **X/Twitter** (Threads, engagement tactics)

Include current trends, algorithm tips, and platform-specific best practices.`;

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
        max_tokens: 2500,
        temperature: 0.75,
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
