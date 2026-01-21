# Marketing Agent Suite 🚀

An AI-powered marketing intelligence platform featuring 6 specialized agents that generate market research insights and social media strategies using the Perplexity API.

![Marketing Agent Suite](https://img.shields.io/badge/Powered%20by-Perplexity%20AI-6366f1)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌐 Live Demo

**[View Live App →](https://marketing-agent-suite-production.up.railway.app)**

## ✨ Features

### Market Research Pipeline (3 Agents)

1. **👥 Persona Agent** - Generates 5 detailed target personas with demographics, psychographics, and shopping behavior
2. **🎭 Customer Impersonator** - Impersonates each persona to provide authentic product impressions
3. **📊 Insights Analyst** - Analyzes all responses to create actionable marketing insights

### Social Media Marketing Pipeline (3 Agents)

4. **📈 Trend Analyzer** - Identifies platform trends and strategies for Instagram, TikTok, Meta, and X
5. **🎣 Viral Hooks Creator** - Creates 5 viral hooks + 3 captions/scripts per platform
6. **📅 Content Calendar** - Generates a 30-day content calendar with:
   - Visual calendar grid and list views
   - Color-coded content types (Value, Authority, Engagement, CTA)
   - Platform-specific posting times
   - Hashtag strategies
   - Growth hacks

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI**: Perplexity API (Sonar model)
- **Server**: Express.js (for static file serving)
- **Deployment**: Railway

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Perplexity API key ([Get one here](https://www.perplexity.ai/))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kingym88/marketing-agent-suite.git
cd marketing-agent-suite
```

2. Install dependencies:

```bash
npm install
```

3. Add your Perplexity API key in `js/app.js`:

```javascript
export const PERPLEXITY_CONFIG = {
  apiKey: "YOUR_API_KEY_HERE",
  apiUrl: "https://api.perplexity.ai/chat/completions",
  model: "sonar",
};
```

4. Start the server:

```bash
npm start
```

5. Open http://localhost:3000 in your browser

## 📖 Usage

1. **Define Your Product** - Fill in the product details (name, category, description, target market, price)
2. **Run Market Research** - Click "Run Market Research" to generate personas and insights
3. **Generate Social Strategy** - Switch to the Social Media tab and click "Generate Social Strategy"
4. **View Your Calendar** - The 30-day content calendar displays in both list and grid views
5. **Export Results** - Use the "Export All" button to download your complete marketing strategy as JSON

## 📁 Project Structure

```
marketing-agent-suite/
├── index.html              # Main application page
├── css/
│   └── styles.css          # Premium dark theme styles
├── js/
│   ├── app.js              # Main application logic
│   └── agents/
│       ├── personaAgent.js
│       ├── impersonatorAgent.js
│       ├── insightsAgent.js
│       ├── trendAgent.js
│       ├── hooksAgent.js
│       └── calendarAgent.js
├── server.js               # Express static file server
└── package.json
```

## 🎨 Design Features

- Premium dark theme with glassmorphism effects
- Animated gradient backgrounds
- Smooth micro-interactions and hover effects
- Responsive layout for all screen sizes
- Visual pipeline flow with status indicators

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Powered by [Perplexity AI](https://www.perplexity.ai/)
- Deployed on [Railway](https://railway.app/)

---

Made with ❤️ for smart marketers
