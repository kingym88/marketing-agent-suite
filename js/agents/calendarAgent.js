/**
 * Content Calendar Agent
 * Builds a 30-day content calendar with posting times, hashtags, and growth hacks
 */

export class CalendarAgent {
  constructor(config) {
    this.config = config;
    this.systemPrompt = `You are a social media strategist who creates comprehensive content calendars.
Build a strategic 30-day content calendar that balances different content types for maximum growth.

The calendar should include:

**CONTENT MIX (balanced across 30 days):**
- Value posts (educational, tips, how-tos) - 35%
- Authority posts (expertise, case studies, data) - 20%
- Engagement posts (questions, polls, challenges) - 25%
- CTA posts (promotions, launches, offers) - 20%

**FOR EACH DAY, PROVIDE:**
1. Day number and theme
2. Platform(s) to post on
3. Content type (Reel, Carousel, Story, Thread, etc.)
4. Brief content description
5. Optimal posting time
6. Hashtag set (5-10 hashtags)
7. Growth hack or engagement tip for that post

**ALSO INCLUDE:**
- Weekly themes that create momentum
- Platform-specific posting frequencies
- Cross-posting strategy
- Key dates or events to leverage

Make the calendar practical and immediately actionable.`;
  }

  async run(productData, insights, trends, hooks) {
    const userPrompt = `Create a comprehensive 30-day content calendar for this product:

**PRODUCT:**
- Name: ${productData.name}
- Category: ${productData.categoryLabel}
- Description: ${productData.description}
- Target Market: ${productData.targetMarket}
- Price: ${productData.pricePoint}

**AUDIENCE INSIGHTS:**
${insights}

**PLATFORM TRENDS & STRATEGIES:**
${trends}

**VIRAL HOOKS & CONTENT:**
${hooks}

---

Build a strategic 30-day content calendar that includes:
1. Daily content themes and descriptions
2. Platform assignments for each day
3. Content formats (Reel, Carousel, Thread, etc.)
4. Optimal posting times for maximum reach
5. Hashtag strategies for each post
6. Growth hacks and engagement tactics through the month
7. Balance of Value/Authority/Engagement/CTA posts

Make this calendar immediately actionable for a marketing team.`;

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
        max_tokens: 4000,
        temperature: 0.7,
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
