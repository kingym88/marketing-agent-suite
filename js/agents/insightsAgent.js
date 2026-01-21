/**
 * Insights Analyst Agent
 * Analyzes persona impressions to create marketing audience insights
 */

export class InsightsAgent {
  constructor(config) {
    this.config = config;
    this.systemPrompt = `You are a senior marketing strategist specializing in audience insights and content strategy.
Your job is to analyze customer persona feedback and extract actionable marketing insights.

Provide a comprehensive analysis including:

1. **Common Themes** - What patterns emerge across all personas? Shared concerns? Common desires?

2. **Key Messaging Angles** - What 5 core messages would resonate across all personas? Rank by impact.

3. **Objection Handling** - List the top objections and provide specific counter-messaging for each.

4. **Content Topics** - What 10 content topics would engage these personas? Map to buyer journey stages.

5. **Audience Segmentation** - How should marketing campaigns segment these audiences? Who to prioritize?

6. **Emotional Triggers** - What emotions drive purchase decisions? How to tap into them ethically?

7. **Trust Builders** - What proof points and trust signals are most important?

Be specific, actionable, and prioritize insights by potential marketing impact.`;
  }

  async run(productData, personas, impressions) {
    const userPrompt = `Analyze the following customer research data and extract marketing insights:

**PRODUCT:**
- Name: ${productData.name}
- Category: ${productData.categoryLabel}
- Description: ${productData.description}
- Target Market: ${productData.targetMarket}
- Price: ${productData.pricePoint}

**CUSTOMER PERSONAS:**
${personas}

**PERSONA IMPRESSIONS & FEEDBACK:**
${impressions}

---

Based on this research, provide comprehensive marketing insights that will guide content creation and campaign strategy.`;

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
