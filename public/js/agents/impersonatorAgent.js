/**
 * Customer Impersonator Agent
 * Impersonates each persona to give authentic product impressions
 */

export class ImpersonatorAgent {
  constructor(config) {
    this.config = config;
    this.systemPrompt = `You are an expert at role-playing different customer personas. 
You will impersonate 5 different customer personas and provide their authentic first impressions of a product.

For each persona, you MUST follow this format:

### Persona [Number]: [Name] - [Title]
**Identity:**
- Name: [Name]
- Title: [Title]

Then provide their detailed perspective on:
1. **First Impression** - What catches their attention first? Initial reaction?
2. **Value Perception** - Do they see the value? Is the price fair to them?
3. **Concerns & Objections** - What would make them hesitate? What worries them?
4. **What Would Make Them Buy** - What features, guarantees, or messaging would convert them?
5. **Word of Mouth** - How would they describe this to a friend?

Use first-person voice ("I think...", "As someone who..."). Make each persona's voice distinct and authentic based on their background.
Be specific and provide actionable insights that a marketing team can use.`;
  }

  async run(productData, personas) {
    const userPrompt = `You are going to impersonate 5 different customer personas and give your authentic impressions of this product from each perspective.

**PRODUCT:**
- Name: ${productData.name}
- Category: ${productData.categoryLabel}
- Description: ${productData.description}
- Price: ${productData.pricePoint}

**THE 5 PERSONAS TO IMPERSONATE:**
${personas}

---

Now, impersonate each of the 5 personas above and provide their authentic first impressions, concerns, and what would make them purchase. Use first-person voice for each persona.`;

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
