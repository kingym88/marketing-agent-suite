/**
 * Marketing Agent Suite - Main Application
 * 6 AI Agents powered by Perplexity API
 */

import { PersonaAgent } from "./agents/personaAgent.js";
import { ImpersonatorAgent } from "./agents/impersonatorAgent.js";
import { InsightsAgent } from "./agents/insightsAgent.js";
import { TrendAgent } from "./agents/trendAgent.js";
import { HooksAgent } from "./agents/hooksAgent.js";
import { CalendarAgent } from "./agents/calendarAgent.js";

// Perplexity API Configuration
export const PERPLEXITY_CONFIG = {
  apiUrl: "/api/chat", // calls our local server proxy
  model: "sonar",
};

// Cache Configuration
const CACHE_KEY = "marketing_suite_cache";

// Application State (exposed globally for console access)
window.appState = {
  productData: null,
  isRunning: false,
  useCache: false,
  researchComplete: false,
  socialComplete: false,
  results: {
    personas: null,
    impressions: null,
    insights: null,
    trends: null,
    hooks: null,
    calendar: null,
  },
};

// Cache Helper Functions
function saveToCache(agentName, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    cache[agentName] = {
      data: data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`💾 Cached: ${agentName}`);
  } catch (e) {
    console.warn("Cache save failed:", e);
  }
}

function getFromCache(agentName) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    if (cache[agentName]) {
      console.log(`📦 Using cached: ${agentName}`);
      return cache[agentName].data;
    }
  } catch (e) {
    console.warn("Cache read failed:", e);
  }
  return null;
}

function hasCachedData(agentName) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return !!cache[agentName];
  } catch (e) {
    return false;
  }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log("🗑️ Cache cleared");
}

// DOM Elements Cache
const elements = {};

// Initialize Application
function initApp() {
  cacheElements();
  setupEventListeners();
  loadCachePreference();
  console.log("🚀 Marketing Agent Suite initialized");
}

function loadCachePreference() {
  const useCacheToggle = document.getElementById("useCacheToggle");
  if (useCacheToggle) {
    // Check if there's cached data
    const hasCache = hasCachedData("personas");
    if (hasCache) {
      useCacheToggle.checked = true;
      window.appState.useCache = true;
    }
  }
}

function cacheElements() {
  elements.productForm = document.getElementById("productForm");
  elements.exportBtn = document.getElementById("exportBtn");
  elements.runAllBtn = document.getElementById("runAllBtn");
  elements.useCacheToggle = document.getElementById("useCacheToggle");
  elements.agentProgress = document.getElementById("agentProgress");
  elements.agentProgressFill = document.getElementById("agentProgressFill");
  elements.agentProgressText = document.getElementById("agentProgressText");
  elements.tabBtns = document.querySelectorAll(".tab-btn");
  elements.tabContents = document.querySelectorAll(".tab-content");

  // Individual agent run buttons
  elements.runPersonaBtn = document.getElementById("runPersonaBtn");
  elements.runImpersonatorBtn = document.getElementById("runImpersonatorBtn");
  elements.runInsightsBtn = document.getElementById("runInsightsBtn");
  elements.runTrendsBtn = document.getElementById("runTrendsBtn");
  elements.runHooksBtn = document.getElementById("runHooksBtn");
  elements.runCalendarBtn = document.getElementById("runCalendarBtn");
}

function setupEventListeners() {
  // Tab Navigation
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Cache Toggle
  elements.useCacheToggle?.addEventListener("change", (e) => {
    window.appState.useCache = e.target.checked;
    console.log(`📦 Cache mode: ${window.appState.useCache ? "ON" : "OFF"}`);
  });

  // Run All Button
  elements.runAllBtn?.addEventListener("click", handleRunAll);

  // Individual Agent Run Buttons
  elements.runPersonaBtn?.addEventListener("click", handleRunPersona);
  elements.runImpersonatorBtn?.addEventListener("click", handleRunImpersonator);
  elements.runInsightsBtn?.addEventListener("click", handleRunInsights);
  elements.runTrendsBtn?.addEventListener("click", handleRunTrends);
  elements.runHooksBtn?.addEventListener("click", handleRunHooks);
  elements.runCalendarBtn?.addEventListener("click", handleRunCalendar);

  // Export Button
  elements.exportBtn?.addEventListener("click", handleExport);
}

function switchTab(tabName) {
  // Update tab buttons
  elements.tabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // Update tab content - hide all, show selected
  elements.tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  const targetTab = document.getElementById(`${tabName}Tab`);
  if (targetTab) {
    targetTab.classList.add("active");
  }
}

function getProductData() {
  return {
    name: document.getElementById("productName").value,
    category: document.getElementById("productCategory").value,
    categoryLabel:
      document.getElementById("productCategory").selectedOptions[0]?.text || "",
    description: document.getElementById("productDescription").value,
    targetMarket: document.getElementById("targetMarket").value,
    pricePoint: document.getElementById("pricePoint").value,
  };
}

function validateProduct() {
  const product = getProductData();
  if (
    !product.name ||
    !product.category ||
    !product.description ||
    !product.targetMarket ||
    !product.pricePoint
  ) {
    alert("Please fill in all product details before running agents.");
    return false;
  }
  return true;
}

// Run All Agents Sequentially
async function handleRunAll() {
  if (window.appState.isRunning) return;
  if (!validateProduct()) return;

  window.appState.productData = getProductData();
  window.appState.isRunning = true;
  elements.runAllBtn.disabled = true;

  // Disable all individual buttons
  const allBtns = [
    elements.runPersonaBtn,
    elements.runImpersonatorBtn,
    elements.runInsightsBtn,
    elements.runTrendsBtn,
    elements.runHooksBtn,
    elements.runCalendarBtn,
  ];
  allBtns.forEach((btn) => btn && (btn.disabled = true));

  try {
    // Agent 1: Persona
    switchTab("persona");
    showProgress("Running Persona Agent... (1/6)");
    setAgentStatus("persona", "running");

    const personaAgent = new PersonaAgent(PERPLEXITY_CONFIG);
    window.appState.results.personas = await personaAgent.run(
      window.appState.productData,
    );
    setAgentStatus("persona", "completed");
    displayAgentOutput("persona", window.appState.results.personas);
    unlockAgent("impersonator");

    // Agent 2: Impersonator
    switchTab("impersonator");
    showProgress("Running Customer Impersonator... (2/6)");
    setAgentStatus("impersonator", "running");

    const impersonatorAgent = new ImpersonatorAgent(PERPLEXITY_CONFIG);
    window.appState.results.impressions = await impersonatorAgent.run(
      window.appState.productData,
      window.appState.results.personas,
    );
    setAgentStatus("impersonator", "completed");
    displayAgentOutput("impersonator", window.appState.results.impressions);
    unlockAgent("insights");

    // Agent 3: Insights
    switchTab("insights");
    showProgress("Running Insights Analyst... (3/6)");
    setAgentStatus("insights", "running");

    const insightsAgent = new InsightsAgent(PERPLEXITY_CONFIG);
    window.appState.results.insights = await insightsAgent.run(
      window.appState.productData,
      window.appState.results.personas,
      window.appState.results.impressions,
    );
    setAgentStatus("insights", "completed");
    displayAgentOutput("insights", window.appState.results.insights);
    unlockAgent("trends");

    // Agent 4: Trends
    switchTab("trends");
    showProgress("Running Trend Analyzer... (4/6)");
    setAgentStatus("trends", "running");

    const trendAgent = new TrendAgent(PERPLEXITY_CONFIG);
    window.appState.results.trends = await trendAgent.run(
      window.appState.productData,
      window.appState.results.insights,
    );
    setAgentStatus("trends", "completed");
    displayAgentOutput("trends", window.appState.results.trends);
    unlockAgent("hooks");

    // Agent 5: Hooks
    switchTab("hooks");
    showProgress("Running Viral Hooks Creator... (5/6)");
    setAgentStatus("hooks", "running");

    const hooksAgent = new HooksAgent(PERPLEXITY_CONFIG);
    window.appState.results.hooks = await hooksAgent.run(
      window.appState.productData,
      window.appState.results.insights,
      window.appState.results.trends,
    );
    setAgentStatus("hooks", "completed");
    displayAgentOutput("hooks", window.appState.results.hooks);
    unlockAgent("calendar");

    // Agent 6: Calendar
    switchTab("calendar");
    showProgress("Building Content Calendar... (6/6)");
    setAgentStatus("calendar", "running");

    const calendarAgent = new CalendarAgent(PERPLEXITY_CONFIG);
    window.appState.results.calendar = await calendarAgent.run(
      window.appState.productData,
      window.appState.results.insights,
      window.appState.results.trends,
      window.appState.results.hooks,
    );
    setAgentStatus("calendar", "completed");
    displayAgentOutput("calendar", window.appState.results.calendar);

    // All complete!
    hideProgress();
    elements.exportBtn.disabled = false;
    alert("🎉 All 6 agents completed successfully!");
  } catch (error) {
    console.error("Run All error:", error);
    alert("Error running agents: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runAllBtn.disabled = false;
    // Re-enable completed agent buttons
    if (window.appState.results.personas)
      elements.runPersonaBtn.disabled = false;
    if (window.appState.results.impressions)
      elements.runImpersonatorBtn.disabled = false;
    if (window.appState.results.insights)
      elements.runInsightsBtn.disabled = false;
    if (window.appState.results.trends) elements.runTrendsBtn.disabled = false;
    if (window.appState.results.hooks) elements.runHooksBtn.disabled = false;
    if (window.appState.results.calendar)
      elements.runCalendarBtn.disabled = false;
  }
}

// Individual Agent Handlers

async function handleRunPersona() {
  if (window.appState.isRunning) return;
  if (!validateProduct()) return;

  window.appState.productData = getProductData();
  window.appState.isRunning = true;

  elements.runPersonaBtn.disabled = true;
  setAgentStatus("persona", "running");
  showProgress("Running Persona Agent...");

  try {
    // Check cache first
    if (window.appState.useCache) {
      const cached = getFromCache("personas");
      if (cached) {
        window.appState.results.personas = cached;
        showProgress("📦 Using cached Persona data...");
        await new Promise((r) => setTimeout(r, 500)); // Brief delay for visual feedback
        setAgentStatus("persona", "completed");
        displayAgentOutput("persona", window.appState.results.personas);
        unlockAgent("impersonator");
        hideProgress();
        window.appState.isRunning = false;
        elements.runPersonaBtn.disabled = false;
        return;
      }
    }

    // Make API call
    const personaAgent = new PersonaAgent(PERPLEXITY_CONFIG);
    window.appState.results.personas = await personaAgent.run(
      window.appState.productData,
    );

    // Save to cache
    saveToCache("personas", window.appState.results.personas);

    setAgentStatus("persona", "completed");
    displayAgentOutput("persona", window.appState.results.personas);

    // Unlock next agent
    unlockAgent("impersonator");
    hideProgress();
  } catch (error) {
    console.error("Persona agent error:", error);
    setAgentStatus("persona", "error");
    alert("Error running Persona Agent: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runPersonaBtn.disabled = false;
  }
}

async function handleRunImpersonator() {
  if (window.appState.isRunning) return;
  if (!window.appState.results.personas) {
    alert("Please run Persona Agent first!");
    return;
  }

  window.appState.isRunning = true;
  elements.runImpersonatorBtn.disabled = true;
  setAgentStatus("impersonator", "running");
  showProgress("Running Customer Impersonator...");

  try {
    // Check cache first
    if (window.appState.useCache) {
      const cached = getFromCache("impressions");
      if (cached) {
        window.appState.results.impressions = cached;
        showProgress("📦 Using cached Impersonator data...");
        await new Promise((r) => setTimeout(r, 500));
        setAgentStatus("impersonator", "completed");
        displayAgentOutput("impersonator", window.appState.results.impressions);
        unlockAgent("insights");
        hideProgress();
        window.appState.isRunning = false;
        elements.runImpersonatorBtn.disabled = false;
        return;
      }
    }

    const impersonatorAgent = new ImpersonatorAgent(PERPLEXITY_CONFIG);
    window.appState.results.impressions = await impersonatorAgent.run(
      window.appState.productData,
      window.appState.results.personas,
    );

    saveToCache("impressions", window.appState.results.impressions);

    setAgentStatus("impersonator", "completed");
    displayAgentOutput("impersonator", window.appState.results.impressions);

    // Unlock next agent
    unlockAgent("insights");
    hideProgress();
  } catch (error) {
    console.error("Impersonator agent error:", error);
    setAgentStatus("impersonator", "error");
    alert("Error running Customer Impersonator: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runImpersonatorBtn.disabled = false;
  }
}

async function handleRunInsights() {
  if (window.appState.isRunning) return;
  if (!window.appState.results.impressions) {
    alert("Please run Customer Impersonator first!");
    return;
  }

  window.appState.isRunning = true;
  elements.runInsightsBtn.disabled = true;
  setAgentStatus("insights", "running");
  showProgress("Running Insights Analyst...");

  try {
    // Check cache first
    if (window.appState.useCache) {
      const cached = getFromCache("insights");
      if (cached) {
        window.appState.results.insights = cached;
        showProgress("📦 Using cached Insights data...");
        await new Promise((r) => setTimeout(r, 500));
        setAgentStatus("insights", "completed");
        displayAgentOutput("insights", window.appState.results.insights);
        unlockAgent("trends");
        hideProgress();
        window.appState.isRunning = false;
        elements.runInsightsBtn.disabled = false;
        return;
      }
    }

    const insightsAgent = new InsightsAgent(PERPLEXITY_CONFIG);
    window.appState.results.insights = await insightsAgent.run(
      window.appState.productData,
      window.appState.results.personas,
      window.appState.results.impressions,
    );

    saveToCache("insights", window.appState.results.insights);

    setAgentStatus("insights", "completed");
    displayAgentOutput("insights", window.appState.results.insights);

    // Unlock next agent
    unlockAgent("trends");
    hideProgress();
  } catch (error) {
    console.error("Insights agent error:", error);
    setAgentStatus("insights", "error");
    alert("Error running Insights Analyst: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runInsightsBtn.disabled = false;
  }
}

async function handleRunTrends() {
  if (window.appState.isRunning) return;
  if (!window.appState.results.insights) {
    alert("Please run Insights Analyst first!");
    return;
  }

  window.appState.isRunning = true;
  elements.runTrendsBtn.disabled = true;
  setAgentStatus("trends", "running");
  showProgress("Running Trend Analyzer...");

  try {
    // Check cache first
    if (window.appState.useCache) {
      const cached = getFromCache("trends");
      if (cached) {
        window.appState.results.trends = cached;
        showProgress("📦 Using cached Trends data...");
        await new Promise((r) => setTimeout(r, 500));
        setAgentStatus("trends", "completed");
        displayAgentOutput("trends", window.appState.results.trends);
        unlockAgent("hooks");
        hideProgress();
        window.appState.isRunning = false;
        elements.runTrendsBtn.disabled = false;
        return;
      }
    }

    const trendAgent = new TrendAgent(PERPLEXITY_CONFIG);
    window.appState.results.trends = await trendAgent.run(
      window.appState.productData,
      window.appState.results.insights,
    );

    saveToCache("trends", window.appState.results.trends);

    setAgentStatus("trends", "completed");
    displayAgentOutput("trends", window.appState.results.trends);

    // Unlock next agent
    unlockAgent("hooks");
    hideProgress();
  } catch (error) {
    console.error("Trends agent error:", error);
    setAgentStatus("trends", "error");
    alert("Error running Trend Analyzer: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runTrendsBtn.disabled = false;
  }
}

async function handleRunHooks() {
  if (window.appState.isRunning) return;
  if (!window.appState.results.trends) {
    alert("Please run Trend Analyzer first!");
    return;
  }

  window.appState.isRunning = true;
  elements.runHooksBtn.disabled = true;
  setAgentStatus("hooks", "running");
  showProgress("Running Viral Hooks Creator...");

  try {
    // Check cache first
    if (window.appState.useCache) {
      const cached = getFromCache("hooks");
      if (cached) {
        window.appState.results.hooks = cached;
        showProgress("📦 Using cached Hooks data...");
        await new Promise((r) => setTimeout(r, 500));
        setAgentStatus("hooks", "completed");
        displayAgentOutput("hooks", window.appState.results.hooks);
        unlockAgent("calendar");
        hideProgress();
        window.appState.isRunning = false;
        elements.runHooksBtn.disabled = false;
        return;
      }
    }

    const hooksAgent = new HooksAgent(PERPLEXITY_CONFIG);
    window.appState.results.hooks = await hooksAgent.run(
      window.appState.productData,
      window.appState.results.insights,
      window.appState.results.trends,
    );
    saveToCache("hooks", window.appState.results.hooks);

    setAgentStatus("hooks", "completed");
    displayAgentOutput("hooks", window.appState.results.hooks);

    // Unlock next agent
    unlockAgent("calendar");
    hideProgress();
  } catch (error) {
    console.error("Hooks agent error:", error);
    setAgentStatus("hooks", "error");
    alert("Error running Viral Hooks Creator: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runHooksBtn.disabled = false;
  }
}

async function handleRunCalendar() {
  if (window.appState.isRunning) return;
  if (!window.appState.results.hooks) {
    alert("Please run Viral Hooks Creator first!");
    return;
  }

  window.appState.isRunning = true;
  elements.runCalendarBtn.disabled = true;
  setAgentStatus("calendar", "running");
  showProgress("📅 Building your content strategy... (this may take 30–60 seconds)");

  try {
    // Check cache first
    if (window.appState.useCache) {
      const cached = getFromCache("calendar");
      if (cached) {
        window.appState.results.calendar = cached;
        showProgress("📦 Using cached Calendar data...");
        await new Promise((r) => setTimeout(r, 500));
        setAgentStatus("calendar", "completed");
        displayAgentOutput("calendar", window.appState.results.calendar);
        elements.exportBtn.disabled = false;
        hideProgress();
        window.appState.isRunning = false;
        elements.runCalendarBtn.disabled = false;
        return;
      }
    }

    const calendarAgent = new CalendarAgent(PERPLEXITY_CONFIG);
    window.appState.results.calendar = await calendarAgent.run(
      window.appState.productData,
      window.appState.results.insights,
      window.appState.results.trends,
      window.appState.results.hooks,
    );

    saveToCache("calendar", window.appState.results.calendar);

    setAgentStatus("calendar", "completed");
    displayAgentOutput("calendar", window.appState.results.calendar);

    // Enable export
    elements.exportBtn.disabled = false;
    hideProgress();
  } catch (error) {
    console.error("Calendar agent error:", error);
    setAgentStatus("calendar", "error");
    alert("Error running Content Calendar: " + error.message);
  } finally {
    window.appState.isRunning = false;
    elements.runCalendarBtn.disabled = false;
  }
}

function unlockAgent(agentName) {
  const btnMap = {
    impersonator: elements.runImpersonatorBtn,
    insights: elements.runInsightsBtn,
    trends: elements.runTrendsBtn,
    hooks: elements.runHooksBtn,
    calendar: elements.runCalendarBtn,
  };

  const btn = btnMap[agentName];
  if (btn) {
    btn.disabled = false;
  }

  setAgentStatus(agentName, "ready");

  // Hide dependency notice for that agent
  const card = document.querySelector(`[data-agent="${agentName}"]`);
  const notice = card
    ?.closest(".tab-content")
    ?.querySelector(".dependency-notice");
  if (notice) {
    notice.style.display = "none";
  }

  // Update placeholder text
  const placeholder = document.querySelector(
    `[data-agent="${agentName}"] .output-placeholder p`,
  );
  if (placeholder) {
    placeholder.textContent = "Ready to generate...";
  }
}

function showProgress(text) {
  if (elements.agentProgress) {
    elements.agentProgress.style.display = "block";
    if (elements.agentProgressText) {
      elements.agentProgressText.textContent = text;
    }
  }
}

function hideProgress() {
  if (elements.agentProgress) {
    elements.agentProgress.style.display = "none";
  }
}

function resetAgentCards(agents) {
  agents.forEach((agent) => {
    const card = document.querySelector(`[data-agent="${agent}"]`);
    if (!card) return;

    card.classList.remove("active", "completed");
    setAgentStatus(agent, "ready");

    const placeholder = card.querySelector(".output-placeholder");
    const content = card.querySelector(".output-content");
    if (placeholder) placeholder.style.display = "flex";
    if (content) {
      content.style.display = "none";
      content.innerHTML = "";
    }
  });
}

function setAgentStatus(agent, status) {
  const card = document.querySelector(`[data-agent="${agent}"]`);
  if (!card) return;

  const statusEl = card.querySelector(".agent-status");
  if (statusEl) {
    statusEl.dataset.status = status;
    const labels = {
      ready: "Ready",
      running: "Running...",
      completed: "Complete",
      error: "Error",
      locked: "Locked",
    };
    statusEl.textContent = labels[status] || status;
  }

  if (status === "running") {
    card.classList.add("active");
    card.classList.remove("completed");
  } else if (status === "completed") {
    card.classList.remove("active");
    card.classList.add("completed");
  }
}

function displayAgentOutput(agent, content) {
  const card = document.querySelector(`[data-agent="${agent}"]`);
  if (!card) return;

  const placeholder = card.querySelector(".output-placeholder");
  const outputEl = card.querySelector(".output-content");

  if (placeholder) placeholder.style.display = "none";
  if (outputEl) {
    outputEl.style.display = "block";

    // Special handling for different agents
    if (agent === "calendar") {
      outputEl.innerHTML = renderCalendarView(content);
      setupCalendarEventListeners(outputEl);
    } else if (agent === "persona") {
      outputEl.innerHTML = renderPersonaCards(content);
    } else if (agent === "impersonator") {
      outputEl.innerHTML = renderImpersonatorCards(content);
    } else {
      outputEl.innerHTML = formatOutput(content);
    }
  }
}

// ... existing persona code ...

// Impersonator Cards Rendering
function renderImpersonatorCards(content) {
  const personaBlocks = splitIntoPersonas(content);

  if (personaBlocks.length === 0) {
    return formatOutput(content);
  }

  const colors = [
    {
      bg: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
      accent: "#60a5fa",
    },
    {
      bg: "linear-gradient(135deg, #1a4a4a 0%, #0f3333 100%)",
      accent: "#34d399",
    },
    {
      bg: "linear-gradient(135deg, #3d1a4a 0%, #2a0f33 100%)",
      accent: "#c084fc",
    },
    {
      bg: "linear-gradient(135deg, #4a3d1a 0%, #332a0f 100%)",
      accent: "#fbbf24",
    },
    {
      bg: "linear-gradient(135deg, #4a1a3d 0%, #330f2a 100%)",
      accent: "#f472b6",
    },
  ];

  const avatars = ["🎭", "🗣️", "💭", "🤔", "💬"];

  const cardsHtml = personaBlocks
    .map((block, index) => {
      const color = colors[index % colors.length];
      const avatar = avatars[index % avatars.length];
      const title = extractPersonaTitle(block, index + 1);
      const tagline = extractPersonaTagline(block) || "Authentic Feedback";
      const formattedContent = formatImpersonatorContent(block);

      return `
      <div class="persona-card" style="background: ${color.bg}">
        <div class="persona-card-header">
          <div class="persona-avatar" style="background: ${color.accent}20; border: 2px solid ${color.accent}">
            <span>${avatar}</span>
          </div>
          <div class="persona-header-text">
            <h3 class="persona-title" style="color: ${color.accent}">${title}</h3>
            <div class="persona-tagline">${tagline}</div>
          </div>
        </div>
        <div class="persona-full-content">
          ${formattedContent}
        </div>
      </div>
    `;
    })
    .join("");

  return `<div class="persona-cards-grid">${cardsHtml}</div>`;
}

function formatImpersonatorContent(block) {
  // Remove the header lines since we extracted them in the card title
  let html = block
    .replace(/^###?[^\n]+\n?/, "")
    .replace(/^\*\*[^\n]+\*\*\n?/, "")
    .replace(/^\d+\.[^\n]+\n?/, "")
    .replace(/^Persona \d+:\s*[^\n]+\n?/i, "")
    // Remove Identity block and fields
    .replace(/\*\*Identity:\*\*\s*\n?/i, "")
    .replace(/^\s*-\s*Name:.*$/gim, "")
    .replace(/^\s*-\s*Title:.*$/gim, "");

  // Format generic bold headers into subheads
  // Matches: **Title**, **1. Title**, **Title:**
  return html
    .replace(
      /(?:^|\n+)(?:\d+\.\s*)?\*\*([^\n*]+?):?\*\*(?:\s*[-:])?/g,
      (match, title) => {
        return `<h5 class="persona-subhead">${title.trim()}</h5>`;
      },
    )
    .split(/\n\n+/)
    .map((para) => {
      if (para.includes("<h5")) return para;
      return para.trim() ? `<p>${para.trim()}</p>` : "";
    })
    .join("");
}

// Persona Cards Rendering - Shows full content from API
function renderPersonaCards(content) {
  // Split content by persona markers
  const personaBlocks = splitIntoPersonas(content);

  if (personaBlocks.length === 0) {
    // Fallback to formatted output
    return formatOutput(content);
  }

  const colors = [
    {
      bg: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)",
      accent: "#60a5fa",
    },
    {
      bg: "linear-gradient(135deg, #1a4a4a 0%, #0f3333 100%)",
      accent: "#34d399",
    },
    {
      bg: "linear-gradient(135deg, #3d1a4a 0%, #2a0f33 100%)",
      accent: "#c084fc",
    },
    {
      bg: "linear-gradient(135deg, #4a3d1a 0%, #332a0f 100%)",
      accent: "#fbbf24",
    },
    {
      bg: "linear-gradient(135deg, #4a1a3d 0%, #330f2a 100%)",
      accent: "#f472b6",
    },
  ];

  const avatars = ["👩‍💼", "👨‍💻", "👩‍🎨", "👨‍💼", "👩‍🔬"];

  const cardsHtml = personaBlocks
    .map((block, index) => {
      const color = colors[index % colors.length];
      const avatar = avatars[index % avatars.length];
      const title = extractPersonaTitle(block, index + 1);
      const tagline = extractPersonaTagline(block);
      const formattedContent = formatPersonaContent(block);

      return `
      <div class="persona-card" style="background: ${color.bg}">
        <div class="persona-card-header">
          <div class="persona-avatar" style="background: ${color.accent}20; border: 2px solid ${color.accent}">
            <span>${avatar}</span>
          </div>
          <div class="persona-header-text">
            <h3 class="persona-title" style="color: ${color.accent}">${title}</h3>
            ${tagline ? `<div class="persona-tagline">${tagline}</div>` : ""}
          </div>
        </div>
        <div class="persona-full-content">
          ${formattedContent}
        </div>
      </div>
    `;
    })
    .join("");

  return `<div class="persona-cards-grid">${cardsHtml}</div>`;
}

function splitIntoPersonas(content) {
  // Try multiple patterns to split personas
  const patterns = [
    /(?=###?\s*(?:\d+\.|Persona\s*\d))/gi,
    /(?=\*\*(?:\d+\.|Persona\s*\d))/gi,
    /(?=(?:^|\n)\d+\.\s+\*\*)/gm,
    /(?=(?:^|\n)Persona\s+\d)/gim,
  ];

  for (const pattern of patterns) {
    const blocks = content.split(pattern).filter((b) => b.trim().length > 50);
    if (blocks.length >= 2) {
      return blocks.slice(0, 5);
    }
  }

  // If no splits found, treat whole content as one block
  return content.trim().length > 100 ? [content] : [];
}

function extractPersonaTitle(block, defaultNum) {
  // 1. Look for explicit "Name:" field first
  const nameMatch = block.match(/(?:Name|Persona Name)\s*[:|-]\s*([^\n]+)/i);
  if (nameMatch) {
    return nameMatch[1]
      .trim()
      .replace(/\*\*/g, "")
      .replace(/^[:.-]\s*/, "");
  }

  // 2. Look for the first markdown header (### Title)
  // cleans up "1. " or "Persona 1: " prefix
  const headerMatch = block.match(
    /^#{3,}\s*(?:(?:\d+\.|Persona\s*\d+)[\s:.-]*)?([^\n]+)/m,
  );
  if (headerMatch) {
    return headerMatch[1]
      .trim()
      .replace(/\*\*/g, "")
      .replace(/^[:.-]\s*/, "");
  }

  // 3. Look for bolded text at the very start (common structure: **Name**)
  const boldMatch = block.match(/^\s*(?:\d+\.\s*)?\*\*([^\n*]+)\*\*/m);
  if (boldMatch) {
    return boldMatch[1].trim();
  }

  return `Persona ${defaultNum}`;
}

function extractPersonaTagline(block) {
  // Look for Occupation, Role, or a short bio summary
  const patterns = [
    /(?:Occupation|Role|Title|Profession)\s*[:|-]\s*([^\n]+)/i,
    /(?:Age|Demographics)\s*[:|-]\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match) {
      // Clean up the match
      let tagline = match[1].trim().replace(/\*\*/g, "");
      // If it's too long, truncate it
      if (tagline.length > 50) tagline = tagline.substring(0, 50) + "...";
      return tagline;
    }
  }

  return "";
}

function formatPersonaContent(block) {
  // Convert markdown-style content to HTML
  let html = block
    // Remove the first heading line (already in title)
    .replace(/^###?[^\n]+\n?/, "")
    .replace(/^\*\*[^\n]+\*\*\n?/, "")
    .replace(/^\d+\.[^\n]+\n?/, "")
    // Remove Identity fields (Name, Title, Occupation) as they are in header
    .replace(/^[-•]\s*\*\*Name:\*\*[^\n]+\n?/gim, "")
    .replace(/^[-•]\s*\*\*Title:\*\*[^\n]+\n?/gim, "")
    .replace(/^[-•]\s*\*\*Occupation:\*\*[^\n]+\n?/gim, "")
    // Remove "Identity (REQUIRED FORMAT):" header if present
    .replace(/^(?:\d+\.\s*)?\*\*Identity.*:\*\*\s*\n?/im, "")
    // Convert headers
    .replace(/####\s*([^\n]+)/g, '<h5 class="persona-subhead">$1</h5>')
    .replace(/###\s*([^\n]+)/g, '<h4 class="persona-subhead">$1</h4>')
    // Convert bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Convert bullet lists
    .replace(/^[-•]\s*(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul class="persona-list">$&</ul>')
    // Convert line breaks to paragraphs
    .split(/\n\n+/)
    .map((para) => {
      if (
        para.includes("<ul>") ||
        para.includes("<h4>") ||
        para.includes("<h5>")
      ) {
        return para;
      }
      return para.trim() ? `<p>${para.trim()}</p>` : "";
    })
    .join("");

  return html;
}

// Calendar Rendering Functions
function renderCalendarView(data) {
  // Validate input — new agent returns a JSON object
  if (!data || typeof data !== "object" || !Array.isArray(data.calendar) || data.calendar.length === 0) {
    return `<div class="calendar-error"><p>⚠️ Calendar data could not be loaded. Please try again.</p></div>`;
  }

  const phaseSlug = (phase) => (phase || "").toLowerCase().replace(/\s+/g, "-");

  const themeBadges = (data.weekly_themes || []).map((theme, i) =>
    `<span class="weekly-theme-badge">Week ${i + 1}: ${theme}</span>`
  ).join("");

  const strategyHeader = `
    <div class="calendar-strategy-header">
      <p class="calendar-strategy-summary">${data.strategy_summary || ""}</p>
      <div class="calendar-weekly-themes">${themeBadges}</div>
    </div>
  `;

  const cards = data.calendar.map((day) => {
    if (day.is_flex_slot) {
      return `
        <div class="calendar-card calendar-card--flex">
          <div class="calendar-card-header">
            <span class="day-number">Day ${day.day}</span>
            <span class="flex-badge">⚡ Trending Opportunity</span>
          </div>
          <div class="calendar-card-body">
            <p class="flex-placeholder">Leave this slot open for real-time trending content.</p>
          </div>
        </div>
      `;
    }

    const hashtagsHtml = (day.hashtags || []).map(h =>
      `<span class="hashtag-tag">${h}</span>`
    ).join("");

    const repurposeHtml = (day.repurpose_as || []).map(r =>
      `<span class="repurpose-item">${r}</span>`
    ).join("");

    const imageHtml = day.generated_image_url
      ? `<img src="${day.generated_image_url}" alt="Day ${day.day} post visual" loading="lazy" />`
      : `<div class="image-prompt-placeholder">
           <span class="image-prompt-label">🎨 Image prompt ready</span>
           <p>${(day.image_prompt || "").substring(0, 120)}...</p>
         </div>`;

    const fullCaptionHtml = (day.full_caption || "").replace(/\n/g, "<br>");

    return `
      <div class="calendar-card">
        <div class="calendar-card-header">
          <span class="day-number">Day ${day.day} — ${day.date_offset || ""}</span>
          <span class="narrative-badge narrative-badge--${phaseSlug(day.narrative_phase)}">${day.narrative_phase || ""}</span>
          <span class="platform-tag">${day.platform || ""}</span>
          <span class="format-tag">${day.format || ""}</span>
          <span class="post-time">${day.post_time || ""}</span>
        </div>
        <div class="calendar-card-image">${imageHtml}</div>
        <div class="calendar-card-body">
          <p class="post-hook">${day.hook || ""}</p>
          <p class="caption-opener">${day.caption_opener || ""}</p>
          <details class="full-caption-toggle">
            <summary>Full Caption ▾</summary>
            <p class="full-caption">${fullCaptionHtml}</p>
          </details>
          <div class="hashtags-row">${hashtagsHtml}</div>
          <div class="engagement-row">
            <span class="engagement-goal">🎯 Goal: ${day.engagement_trigger || ""}</span>
            <span class="engagement-cta">📣 CTA: ${day.engagement_cta || ""}</span>
          </div>
          <div class="repurpose-row">
            <span class="repurpose-label">♻️ Repurpose as:</span>
            ${repurposeHtml}
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="calendar-output-wrapper">
      ${strategyHeader}
      <div class="calendar-cards-grid">${cards}</div>
    </div>
  `;
}

function setupCalendarEventListeners(outputEl) {
  // Full caption toggle is handled natively by <details> elements
}



function formatOutput(content) {
  if (!content) return "<p>No output generated.</p>";

  return content
    .replace(/^#### (.*$)/gim, "<h5>$1</h5>")
    .replace(/^### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^## (.*$)/gim, "<h4>$1</h4>")
    .replace(/^# (.*$)/gim, "<h4>$1</h4>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/(<li>.*<\/li>)+/gs, "<ul>$&</ul>");
}

function updateProgress(pipeline, percent, text) {
  const fill =
    pipeline === "research"
      ? elements.researchProgressFill
      : elements.socialProgressFill;
  const textEl =
    pipeline === "research"
      ? elements.researchProgressText
      : elements.socialProgressText;

  if (fill) fill.style.width = `${percent}%`;
  if (textEl) textEl.textContent = text;
}

function handleExport() {
  if (!window.appState.results.personas) {
    alert("No data to export. Run the agents first!");
    return;
  }

  const exportData = {
    product: window.appState.productData,
    generatedAt: new Date().toISOString(),
    marketResearch: {
      personas: window.appState.results.personas,
      impressions: window.appState.results.impressions,
      insights: window.appState.results.insights,
    },
    socialMediaMarketing: {
      trends: window.appState.results.trends,
      hooks: window.appState.results.hooks,
      calendar: window.appState.results.calendar,
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `marketing-suite-${window.appState.productData.name.toLowerCase().replace(/\s+/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", initApp);
