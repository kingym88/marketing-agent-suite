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
  showProgress("Building Content Calendar...");

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
function renderCalendarView(content) {
  const calendarData = parseCalendarContent(content);

  return `
        <div class="calendar-container">
            <div class="calendar-header">
                <div class="calendar-title">
                    <h3>30-Day Content Calendar</h3>
                    <span class="calendar-month-badge">Starting Today</span>
                </div>
                <div class="view-toggle">
                    <button class="view-toggle-btn active" data-view="list">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        List
                    </button>
                    <button class="view-toggle-btn" data-view="grid">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Grid
                    </button>
                </div>
            </div>
            
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color value"></div>
                    <span>Value (35%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color authority"></div>
                    <span>Authority (20%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color engagement"></div>
                    <span>Engagement (25%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color cta"></div>
                    <span>CTA (20%)</span>
                </div>
            </div>
            
            <!-- List View (default) -->
            <div class="calendar-list-view active">
                ${renderListView(calendarData)}
            </div>
            
            <!-- Grid View -->
            <div class="calendar-grid-view hidden">
                <div class="calendar-grid">
                    <div class="calendar-week-header">
                        <div class="week-day-label">Sun</div>
                        <div class="week-day-label">Mon</div>
                        <div class="week-day-label">Tue</div>
                        <div class="week-day-label">Wed</div>
                        <div class="week-day-label">Thu</div>
                        <div class="week-day-label">Fri</div>
                        <div class="week-day-label">Sat</div>
                    </div>
                    ${renderGridView(calendarData)}
                </div>
            </div>
        </div>
        
        <!-- Day Detail Modal -->
        <div class="day-modal-overlay" id="dayModal">
            <div class="day-modal">
                <div class="modal-header">
                    <h3 id="modalTitle">Day 1</h3>
                    <button class="modal-close" id="closeModal">✕</button>
                </div>
                <div class="modal-body" id="modalBody">
                </div>
            </div>
        </div>
    `;
}

function parseCalendarContent(content) {
  const days = [];
  const contentTypes = ["value", "authority", "engagement", "cta"];
  const formats = [
    "Reel",
    "Carousel",
    "Story",
    "Thread",
    "Post",
    "Video",
    "Live",
  ];
  const platforms = [
    "Instagram",
    "TikTok",
    "Meta",
    "X",
    "Twitter",
    "Facebook",
    "LinkedIn",
  ];

  // Try to parse structured day information from the content
  const lines = content.split("\n");
  let currentDay = null;
  let dayCounter = 0;

  for (const line of lines) {
    // Look for day markers
    const dayMatch = line.match(/(?:day|#)\s*(\d+)/i);
    if (dayMatch && parseInt(dayMatch[1]) <= 30) {
      if (currentDay) {
        days.push(currentDay);
      }
      dayCounter = parseInt(dayMatch[1]);
      currentDay = {
        day: dayCounter,
        theme: "",
        description: "",
        platforms: [],
        format: "",
        time: "",
        hashtags: [],
        growthHack: "",
        contentType: contentTypes[dayCounter % 4],
      };
    }

    if (currentDay) {
      // Extract theme
      if (line.toLowerCase().includes("theme") || line.includes(":")) {
        const themeMatch = line.match(/theme[:\s]+(.+)/i);
        if (themeMatch) currentDay.theme = themeMatch[1].trim();
      }

      // Extract platforms
      for (const platform of platforms) {
        if (
          line.toLowerCase().includes(platform.toLowerCase()) &&
          !currentDay.platforms.includes(platform)
        ) {
          currentDay.platforms.push(platform);
        }
      }

      // Extract format
      for (const format of formats) {
        if (
          line.toLowerCase().includes(format.toLowerCase()) &&
          !currentDay.format
        ) {
          currentDay.format = format;
        }
      }

      // Extract time
      const timeMatch = line.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/);
      if (timeMatch && !currentDay.time) {
        currentDay.time = timeMatch[1];
      }

      // Extract hashtags
      const hashtagMatches = line.match(/#\w+/g);
      if (hashtagMatches) {
        currentDay.hashtags.push(...hashtagMatches.slice(0, 5));
      }

      // Extract description (content description)
      if (
        line.toLowerCase().includes("content") ||
        line.toLowerCase().includes("post") ||
        line.toLowerCase().includes("description")
      ) {
        const descMatch = line.match(/(?:content|post|description)[:\s]+(.+)/i);
        if (descMatch && descMatch[1].length > 10) {
          currentDay.description = descMatch[1].trim();
        }
      }

      // Extract growth hack
      if (
        line.toLowerCase().includes("growth") ||
        line.toLowerCase().includes("tip") ||
        line.toLowerCase().includes("hack")
      ) {
        const hackMatch = line.match(/(?:growth hack|tip|hack)[:\s]+(.+)/i);
        if (hackMatch) {
          currentDay.growthHack = hackMatch[1].trim();
        }
      }

      // Determine content type from keywords
      if (
        line.toLowerCase().includes("value") ||
        line.toLowerCase().includes("educational") ||
        line.toLowerCase().includes("tip")
      ) {
        currentDay.contentType = "value";
      } else if (
        line.toLowerCase().includes("authority") ||
        line.toLowerCase().includes("case study") ||
        line.toLowerCase().includes("expertise")
      ) {
        currentDay.contentType = "authority";
      } else if (
        line.toLowerCase().includes("engagement") ||
        line.toLowerCase().includes("poll") ||
        line.toLowerCase().includes("question")
      ) {
        currentDay.contentType = "engagement";
      } else if (
        line.toLowerCase().includes("cta") ||
        line.toLowerCase().includes("promotion") ||
        line.toLowerCase().includes("offer")
      ) {
        currentDay.contentType = "cta";
      }

      // Add description from content line if no specific description found
      if (
        !currentDay.description &&
        line.length > 30 &&
        !line.startsWith("#") &&
        !line.startsWith("*")
      ) {
        currentDay.description = line
          .replace(/^\d+\.\s*/, "")
          .replace(/\*\*/g, "")
          .trim();
      }
    }
  }

  // Push last day
  if (currentDay) {
    days.push(currentDay);
  }

  // If parsing didn't find structured days, generate placeholder days
  if (days.length < 30) {
    const existingDays = new Set(days.map((d) => d.day));
    for (let i = 1; i <= 30; i++) {
      if (!existingDays.has(i)) {
        days.push({
          day: i,
          theme: getDefaultTheme(i),
          description:
            extractDescriptionForDay(content, i) || "Content to be planned",
          platforms: getDefaultPlatforms(i),
          format: getDefaultFormat(i),
          time: getDefaultTime(i),
          hashtags: [],
          growthHack: "",
          contentType: contentTypes[(i - 1) % 4],
        });
      }
    }
  }

  // Sort by day number
  days.sort((a, b) => a.day - b.day);

  // Ensure we have exactly 30 days
  return days.slice(0, 30);
}

function extractDescriptionForDay(content, dayNum) {
  const patterns = [
    new RegExp(`day\\s*${dayNum}[^\\n]*\\n([^\\n]+)`, "i"),
    new RegExp(`#${dayNum}[^\\n]*\\n([^\\n]+)`, "i"),
    new RegExp(`${dayNum}\\.[^\\n]*\\n([^\\n]+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1].length > 10) {
      return match[1].replace(/\*\*/g, "").trim().substring(0, 100);
    }
  }
  return null;
}

function getDefaultTheme(day) {
  const themes = ["Value", "Authority", "Engagement", "CTA"];
  return themes[(day - 1) % 4];
}

function getDefaultPlatforms(day) {
  const platformSets = [
    ["Instagram", "TikTok"],
    ["X", "LinkedIn"],
    ["Instagram", "Meta"],
    ["TikTok", "X"],
  ];
  return platformSets[(day - 1) % 4];
}

function getDefaultFormat(day) {
  const formats = ["Reel", "Carousel", "Story", "Thread"];
  return formats[(day - 1) % 4];
}

function getDefaultTime(day) {
  const times = ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "8:00 PM"];
  return times[(day - 1) % 5];
}

function renderListView(calendarData) {
  // Group by weeks
  const weeks = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push({
      weekNum: Math.floor(i / 7) + 1,
      days: calendarData.slice(i, i + 7),
    });
  }

  const weekThemes = [
    "Foundation & Awareness",
    "Value & Education",
    "Engagement & Community",
    "Conversion & Growth",
    "Momentum & Scale",
  ];

  return weeks
    .map(
      (week, idx) => `
        <div class="week-group">
            <div class="week-group-header">
                <span class="week-number">Week ${week.weekNum}</span>
                <span class="week-theme">${weekThemes[idx] || "Strategic Growth"}</span>
            </div>
            ${week.days.map((day) => renderListDayCard(day)).join("")}
        </div>
    `,
    )
    .join("");
}

function renderListDayCard(day) {
  const platformIcons = {
    Instagram: "📸",
    TikTok: "🎵",
    Meta: "📘",
    X: "𝕏",
    Twitter: "𝕏",
    Facebook: "📘",
    LinkedIn: "💼",
  };

  return `
        <div class="list-day-card ${day.contentType}" data-day="${day.day}">
            <div class="list-day-number">
                <div class="day">${day.day}</div>
                <div class="label">Day</div>
            </div>
            <div class="list-day-content">
                <h4>${day.theme || getDefaultTheme(day.day)} Post</h4>
                <p>${day.description || "Strategic content aligned with daily theme"}</p>
                <div class="list-day-meta">
                    <span class="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${day.time || getDefaultTime(day.day)}
                    </span>
                    <span class="meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                        </svg>
                        ${day.format || getDefaultFormat(day.day)}
                    </span>
                    <span class="meta-item">
                        ${(day.platforms.length > 0 ? day.platforms : getDefaultPlatforms(day.day)).map((p) => platformIcons[p] || "📱").join(" ")}
                        ${(day.platforms.length > 0 ? day.platforms : getDefaultPlatforms(day.day)).join(", ")}
                    </span>
                </div>
                ${
                  day.hashtags.length > 0
                    ? `
                    <div class="hashtag-cloud">
                        ${day.hashtags
                          .slice(0, 5)
                          .map((tag) => `<span class="hashtag">${tag}</span>`)
                          .join("")}
                    </div>
                `
                    : ""
                }
                ${
                  day.growthHack
                    ? `
                    <div class="growth-hack">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                        </svg>
                        ${day.growthHack}
                    </div>
                `
                    : ""
                }
            </div>
            <div class="list-day-actions">
                <span class="content-type-badge ${day.contentType}">${day.contentType}</span>
                <span class="format-badge">${day.format || getDefaultFormat(day.day)}</span>
            </div>
        </div>
    `;
}

function renderGridView(calendarData) {
  // Get current day of week to start calendar appropriately
  const today = new Date();
  const startDayOfWeek = today.getDay(); // 0 = Sunday

  let html = "";

  // Add empty cells for days before start
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  // Render each day
  calendarData.forEach((day) => {
    html += renderGridDayCard(day);
  });

  // Add empty cells to complete the last week
  const totalCells = startDayOfWeek + calendarData.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    html += '<div class="calendar-day empty"></div>';
  }

  return html;
}

function renderGridDayCard(day) {
  const platformIcons = {
    Instagram: "📸",
    TikTok: "🎵",
    Meta: "📘",
    X: "𝕏",
    Twitter: "𝕏",
    Facebook: "📘",
    LinkedIn: "💼",
  };

  const platforms =
    day.platforms.length > 0 ? day.platforms : getDefaultPlatforms(day.day);

  return `
        <div class="calendar-day" data-day="${day.day}">
            <div class="day-header">
                <span class="day-number">${day.day}</span>
                <span class="content-type-badge ${day.contentType}">${day.contentType}</span>
            </div>
            <div class="day-content">
                <p class="day-description">${day.description || "Content aligned with theme"}</p>
                <div class="platform-icons">
                    ${platforms.map((p) => `<span class="platform-icon" title="${p}">${platformIcons[p] || "📱"}</span>`).join("")}
                </div>
            </div>
            <div class="day-footer">
                <span class="post-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${day.time || getDefaultTime(day.day)}
                </span>
                <span class="format-badge">${day.format || getDefaultFormat(day.day)}</span>
            </div>
        </div>
    `;
}

function setupCalendarEventListeners(container) {
  // View toggle
  const viewToggles = container.querySelectorAll(".view-toggle-btn");
  const listView = container.querySelector(".calendar-list-view");
  const gridView = container.querySelector(".calendar-grid-view");

  viewToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewToggles.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      if (btn.dataset.view === "list") {
        listView.classList.add("active");
        gridView.classList.add("hidden");
      } else {
        listView.classList.remove("active");
        gridView.classList.remove("hidden");
      }
    });
  });

  // Day click for modal
  const dayCards = container.querySelectorAll(
    ".calendar-day:not(.empty), .list-day-card",
  );
  const modal = container.querySelector("#dayModal");
  const closeBtn = container.querySelector("#closeModal");
  const modalTitle = container.querySelector("#modalTitle");
  const modalBody = container.querySelector("#modalBody");

  if (modal && closeBtn) {
    dayCards.forEach((card) => {
      card.addEventListener("click", () => {
        const dayNum = card.dataset.day;
        modalTitle.textContent = `Day ${dayNum} Details`;

        // Get the day data from the card
        const contentType = card.classList.contains("value")
          ? "Value"
          : card.classList.contains("authority")
            ? "Authority"
            : card.classList.contains("engagement")
              ? "Engagement"
              : "CTA";

        modalBody.innerHTML = `
                    <div class="modal-section">
                        <h4>Content Type</h4>
                        <p><span class="content-type-badge ${contentType.toLowerCase()}">${contentType}</span></p>
                    </div>
                    <div class="modal-section">
                        <h4>Description</h4>
                        <p>${card.querySelector(".day-description, .list-day-content p")?.textContent || "Strategic content for this day"}</p>
                    </div>
                    <div class="modal-section">
                        <h4>💡 Pro Tip</h4>
                        <p>Engage with your audience within the first hour of posting for maximum algorithm boost!</p>
                    </div>
                `;

        modal.classList.add("active");
      });
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
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
