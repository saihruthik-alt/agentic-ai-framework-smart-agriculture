"use client";

import React, { useEffect, useState } from "react";

// Mock Agent logs representing real-time multi-agent cooperation
const INITIAL_AGENT_LOGS = [
  {
    time: "12:00:15",
    agent: "System",
    message: "Initializing smart farming multi-agent registry...",
    type: "system",
  },
  {
    time: "12:00:18",
    agent: "Weather Agent",
    message: "Fetching local microclimate forecasts. Heavy rain predicted in 18 hours (probability 85%).",
    type: "weather",
  },
  {
    time: "12:00:22",
    agent: "Irrigation Agent",
    message: "Querying Field A soil moisture level. Current moisture: 32% (under threshold of 35%).",
    type: "irrigation",
  },
  {
    time: "12:00:25",
    agent: "Irrigation Agent",
    message: "Precipitation forecast is high. Overriding standard watering scheduler. Irrigation deferred to conserve water.",
    type: "irrigation_ok",
  },
  {
    time: "12:00:30",
    agent: "Fertilizer Agent",
    message: "Field B Soil analysis: Nitrogen 18 mg/kg (Deficient). Phosphorus 24 mg/kg (Optimal).",
    type: "fertilizer",
  },
  {
    time: "12:00:35",
    agent: "Fertilizer Agent",
    message: "Action plan generated: Apply nitrogen-rich organic urea ahead of the incoming rain to optimize soil absorption.",
    type: "fertilizer_plan",
  },
];

interface ServiceHealth {
  status: string;
  database: string;
  redis: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [agentLogs, setAgentLogs] = useState(INITIAL_AGENT_LOGS);
  const [coreHealth, setCoreHealth] = useState<ServiceHealth | null>(null);
  const [aiHealth, setAiHealth] = useState<ServiceHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Fetch real-time health checks from backends
  const fetchHealthChecks = async () => {
    setLoadingHealth(true);
    try {
      const coreRes = await fetch("http://localhost:8080/api/v1/health");
      if (coreRes.ok) {
        setCoreHealth(await coreRes.json());
      } else {
        setCoreHealth({ status: "DOWN", database: "DOWN", redis: "DOWN" });
      }
    } catch {
      setCoreHealth({ status: "DOWN", database: "DOWN", redis: "DOWN" });
    }

    try {
      const aiRes = await fetch("http://localhost:8000/api/v1/health");
      if (aiRes.ok) {
        setAiHealth(await aiRes.json());
      } else {
        setAiHealth({ status: "DOWN", database: "DOWN", redis: "DOWN" });
      }
    } catch {
      setAiHealth({ status: "DOWN", database: "DOWN", redis: "DOWN" });
    }
    setLoadingHealth(false);
  };

  useEffect(() => {
    fetchHealthChecks();
    // Simulate real-time logs arriving every 12 seconds
    const interval = setInterval(() => {
      const randomLogs = [
        {
          time: new Date().toTimeString().split(" ")[0],
          agent: "Market Agent",
          message: "Tomato wholesale index jumped by +4.8% due to regional supply constraints. Advising harvest prep.",
          type: "market",
        },
        {
          time: new Date().toTimeString().split(" ")[0],
          agent: "Disease Agent",
          message: "Scanned Field A sensor camera stream. Leaf spots detected on Area-4. Initiating spot validation...",
          type: "disease",
        },
        {
          time: new Date().toTimeString().split(" ")[0],
          agent: "Inventory Agent",
          message: "Nitrogen fertilizers current stock: 45kg. Required for next plan: 40kg. Stock levels: SAFE.",
          type: "inventory",
        },
      ];
      const logToAdd = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setAgentLogs((prev) => [...prev.slice(-12), logToAdd]); // Keep last 12 logs
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07070a] text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-[#0c0c12] p-6 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              🌾
            </div>
            <div>
              <h1 className="font-bold text-md leading-none text-emerald-400">AGRI-AGENT</h1>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Precision Platform</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: "📊" },
              { id: "agents", label: "AI Agents", icon: "🤖" },
              { id: "crops", label: "Crop Management", icon: "🌱" },
              { id: "telemetry", label: "Sensor Feeds", icon: "📡" },
              { id: "market", label: "Market Analytics", icon: "📈" },
            ].map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]"
                    : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* System Diagnostics Box */}
        <div className="border border-zinc-800/80 rounded-2xl bg-[#0f0f18] p-4">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-xs font-semibold text-zinc-400">System Core Health</span>
            <button
              onClick={fetchHealthChecks}
              id="refresh-health-btn"
              className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Core Service:</span>
              <span
                id="health-core-status"
                className={`font-semibold ${
                  coreHealth?.status === "UP" ? "text-emerald-400" : "text-rose-500"
                }`}
              >
                {coreHealth ? coreHealth.status : "OFFLINE"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">AI Agent Engine:</span>
              <span
                id="health-ai-status"
                className={`font-semibold ${
                  aiHealth?.status === "UP" ? "text-emerald-400" : "text-rose-500"
                }`}
              >
                {aiHealth ? aiHealth.status : "OFFLINE"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-zinc-800/50">
              <span className="text-zinc-500">Database:</span>
              <span className="text-zinc-300">
                {coreHealth?.database === "UP" && aiHealth?.database === "UP" ? "Connected" : "Error"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 bg-[#09090f] px-8 flex items-center justify-between">
          <div>
            <h2 className="text-sm text-zinc-400">Welcome back, Chief Agronomist</h2>
            <p className="text-xs text-zinc-600">Active Location: GreenValley Farms (A-B Fields)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-zinc-800 bg-[#0d0d15] rounded-full py-1.5 px-3.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400">Agent Network Operational</span>
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Headline widgets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-emerald-800/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                💧
              </div>
              <span className="text-xs text-zinc-500 font-medium">Avg Soil Moisture</span>
              <h3 className="text-2xl font-bold mt-2 text-emerald-400">38.4%</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Water Levels Optimal</span>
              </div>
            </div>

            <div className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-blue-800/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                ☀️
              </div>
              <span className="text-xs text-zinc-500 font-medium">Air Temperature</span>
              <h3 className="text-2xl font-bold mt-2 text-sky-400">28.6°C</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                <span>Humidity: 62%</span>
              </div>
            </div>

            <div className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-amber-800/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                ⚠️
              </div>
              <span className="text-xs text-zinc-500 font-medium">Active Anomalies</span>
              <h3 className="text-2xl font-bold mt-2 text-amber-500">1 Warning</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400/80">
                <span>Field A leaf-spot detection scan pending</span>
              </div>
            </div>

            <div className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-purple-800/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                📈
              </div>
              <span className="text-xs text-zinc-500 font-medium">Market Price Projection</span>
              <h3 className="text-2xl font-bold mt-2 text-purple-400">+12.4%</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                <span>Tomatoes indices raising</span>
              </div>
            </div>
          </div>

          {/* Main workspace widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visual Crop field layout map */}
            <div className="lg:col-span-2 border border-zinc-800/60 rounded-2xl p-6 bg-[#0a0a10]/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">Interactive Farm Fields Map</h3>
                    <p className="text-xs text-zinc-500">Spatial telemetry and vegetation health map</p>
                  </div>
                  <span className="text-[10px] bg-zinc-800/60 border border-zinc-700/50 rounded px-2 py-0.5 text-zinc-400 uppercase">
                    Fields View
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 h-64">
                  <div className="border border-emerald-900/30 rounded-2xl bg-emerald-950/10 p-5 flex flex-col justify-between hover:bg-emerald-950/20 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase">Field Alpha</span>
                        <h4 className="text-lg font-bold text-zinc-200 mt-1">Sweet Corn</h4>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="text-xs space-y-1 text-zinc-400">
                      <div className="flex justify-between">
                        <span>Planted Date:</span> <span className="font-semibold text-zinc-300">2026-06-01</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soil Moisture:</span> <span className="font-semibold text-emerald-400">38%</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-purple-900/30 rounded-2xl bg-purple-950/10 p-5 flex flex-col justify-between hover:bg-purple-950/20 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">Field Beta</span>
                        <h4 className="text-lg font-bold text-zinc-200 mt-1">Wheat variety</h4>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="text-xs space-y-1 text-zinc-400">
                      <div className="flex justify-between">
                        <span>Planted Date:</span> <span className="font-semibold text-zinc-300">2026-05-15</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Soil Moisture:</span> <span className="font-semibold text-emerald-400">41%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/40 flex justify-between items-center text-xs text-zinc-500">
                <span>Vegetation Index: NDVI 0.72 (Excellent)</span>
                <span>Last satellite scan: 4 hours ago</span>
              </div>
            </div>

            {/* AI Agent reasoning stream console */}
            <div className="border border-zinc-800/60 rounded-2xl p-6 bg-[#090910] flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Agentic Action Center</h3>
                  <p className="text-xs text-zinc-500 font-medium">Collaboration stream (LangGraph)</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
              </div>

              {/* Console log display */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar text-xs font-mono">
                {agentLogs.map((log, index) => {
                  let agentColor = "text-zinc-400";
                  if (log.type.includes("weather")) agentColor = "text-sky-400";
                  if (log.type.includes("irrigation")) agentColor = "text-blue-400";
                  if (log.type.includes("fertilizer")) agentColor = "text-amber-400";
                  if (log.type.includes("market")) agentColor = "text-purple-400";
                  if (log.type.includes("disease")) agentColor = "text-rose-400";
                  
                  return (
                    <div key={index} className="border border-zinc-900 bg-zinc-950/40 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span className={`font-bold ${agentColor}`}>[{log.agent}]</span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed font-sans">{log.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
