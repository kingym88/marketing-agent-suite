/**
 * Persona Agent
 * Generates 5 target personas with demographics, psychographics, and shopping behavior
 */

export class PersonaAgent {
  constructor(config) {
    this.config = config;
    this.systemPrompt = `You are an expert market research analyst specializing in customer persona development.
Your task is to create 5 detailed, distinct target personas for a product.

For each persona, provide:
1. **Identity (REQUIRED FORMAT):**
   - **Name:** [Name]
   - **Title:** [Descriptive Title]
   - **Occupation:** [Job Title]
2. **Demographics:**
   - **Age:** [Age]
   - **Gender:** [Gender]
   - **Income:** [Income Range]
   - **Location:** [City/Region]
   - **Education:** [Level]
3. **Psychographics** - Values, interests, lifestyle, personality traits, goals, pain points
4. **Shopping Behavior** - Purchase triggers, preferred channels, price sensitivity, decision-making process, brand loyalty patterns

Make each persona distinct and realistic. Use specific details that would help a marketing team create targeted content.
Format each persona clearly with headers and bullet points.`;
  }

  async run(productData) {
    const userPrompt = `Create 5 detailed target personas for this product:

**Product:** ${productData.name}
**Category:** ${productData.categoryLabel}
**Description:** ${productData.description}
**Target Market:** ${productData.targetMarket}
**Price Point:** ${productData.pricePoint}

Generate 5 distinct, detailed personas that represent the ideal customers for this product. Make them specific and actionable for marketing purposes.`;

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
        max_tokens: 2000,
        temperature: 0.8,
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
