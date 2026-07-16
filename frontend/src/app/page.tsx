"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

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

interface Farm {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  soilType: string;
  totalAreaHectares: number;
}

interface Crop {
  id?: string;
  name: string;
  variety: string;
  plantedAt: string;
  harvestPlannedAt: string;
  status: string;
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [agentLogs, setAgentLogs] = useState(INITIAL_AGENT_LOGS);
  const [coreHealth, setCoreHealth] = useState<ServiceHealth | null>(null);
  const [aiHealth, setAiHealth] = useState<ServiceHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  
  // Real databases records state
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [loadingCrops, setLoadingCrops] = useState(false);
  
  // Forms state
  const [showToken, setShowToken] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // New Farm form
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmSoil, setNewFarmSoil] = useState("Clay");
  const [newFarmArea, setNewFarmArea] = useState("12.5");
  const [farmError, setFarmError] = useState("");
  const [farmSuccess, setFarmSuccess] = useState("");

  // New Crop form
  const [newCropName, setNewCropName] = useState("");
  const [newCropVariety, setNewCropVariety] = useState("");
  const [newCropPlanted, setNewCropPlanted] = useState(new Date().toISOString().split("T")[0]);
  const [newCropHarvest, setNewCropHarvest] = useState("");
  const [cropError, setCropError] = useState("");
  const [cropSuccess, setCropSuccess] = useState("");

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

  // Fetch Farms owned by User
  const fetchFarms = async () => {
    if (!user) return;
    setLoadingFarms(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/farms", {
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFarms(data);
        if (data.length > 0 && !selectedFarm) {
          setSelectedFarm(data[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching farms", e);
    }
    setLoadingFarms(false);
  };

  // Fetch Crops for selected Farm
  const fetchCrops = async (farmId: string) => {
    if (!user) return;
    setLoadingCrops(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}/crops`, {
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCrops(data);
      }
    } catch (e) {
      console.error("Error fetching crops", e);
    }
    setLoadingCrops(false);
  };

  // Create Farm handler
  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFarmError("");
    setFarmSuccess("");

    try {
      const res = await fetch("http://localhost:8080/api/v1/farms", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newFarmName,
          soilType: newFarmSoil,
          totalAreaHectares: parseFloat(newFarmArea),
          latitude: 12.97,
          longitude: 77.59
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFarmSuccess("Farm created successfully!");
        setNewFarmName("");
        fetchFarms();
        setSelectedFarm(data);
      } else {
        setFarmError("Failed to create farm profile.");
      }
    } catch (err) {
      setFarmError("Connection error. Is backend online?");
    }
  };

  // Create Crop handler
  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFarm) return;
    setCropError("");
    setCropSuccess("");

    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/crops`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newCropName,
          variety: newCropVariety,
          plantedAt: newCropPlanted,
          harvestPlannedAt: newCropHarvest || null,
          status: "PLANTED"
        })
      });

      if (res.ok) {
        setCropSuccess("Crop planted and logged successfully!");
        setNewCropName("");
        setNewCropVariety("");
        setNewCropHarvest("");
        fetchCrops(selectedFarm.id);
      } else {
        setCropError("Failed to plant crop record.");
      }
    } catch (err) {
      setCropError("Connection error.");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchHealthChecks();
      fetchFarms();
    }
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
      setAgentLogs((prev) => [...prev.slice(-12), logToAdd]);
    }, 12000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (selectedFarm) {
      fetchCrops(selectedFarm.id);
    }
  }, [selectedFarm]);

  const copyTokenToClipboard = () => {
    if (user) {
      navigator.clipboard.writeText(user.token);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#07070a] text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs tracking-wider">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Agentic AI Framework</span>
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
              { id: "profile", label: "User Profile", icon: "👤" },
            ].map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]"
                    : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            
            <button
              onClick={logout}
              id="logout-btn"
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-rose-400/80 hover:bg-rose-950/20 hover:text-rose-300 border border-transparent transition-all duration-200 mt-4 cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
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
            <h2 className="text-sm text-zinc-400">Welcome back, {user.username}</h2>
            <p className="text-xs text-zinc-600">Role: {user.role} | Active Location: GreenValley Farms</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-zinc-800 bg-[#0d0d15] rounded-full py-1.5 px-3.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400">Agent Network Operational</span>
            </div>
          </div>
        </header>

        {/* Dynamic Views Rendering based on activeTab */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* TAB 1: MAIN DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
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
            </>
          )}

          {/* TAB 2: AI AGENTS */}
          {activeTab === "agents" && (
            <div className="space-y-6">
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-zinc-200 mb-2">🤖 Agentic AI Network Configuration</h3>
                <p className="text-sm text-zinc-500">
                  Multiple specialized agents run on FastAPI & LangGraph, state-syncing inside PostgreSQL and streaming logs via WebSockets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Weather Agent", role: "Microclimate Analysis", status: "Active", desc: "Monitors regional radar data, forecasts, and humidity logs. Recommends crop scheduling pivots.", icon: "☀️" },
                  { name: "Irrigation Agent", role: "Water Optimization", status: "Active", desc: "Queries live soil moisture sensors. Schedules sprinkler releases depending on rain metrics.", icon: "💧" },
                  { name: "Fertilizer Agent", role: "Nutrient Planner", status: "Active", desc: "Analyzes NPK soil compositions. Proposes fertilizer volumes per growth stage.", icon: "🌱" },
                  { name: "Disease Vision Agent", role: "CV Image Detection", status: "Idle", desc: "Validates leaf spot anomalies in uploaded photographs. Categorizes blight/rust types.", icon: "👁️" },
                  { name: "Inventory Agent", role: "Stock Watchdog", status: "Active", desc: "Tracks materials levels, triggers alerts when levels dip, and automatically structures requests.", icon: "📦" },
                  { name: "Market Analytics Agent", role: "Price Predictor", status: "Active", desc: "Scrapes global pricing index tickers, logs market sentiments, and projects sale profit peaks.", icon: "📈" },
                ].map((agent, i) => (
                  <div key={i} className="border border-zinc-800 bg-[#0c0c12]/40 rounded-2xl p-5 hover:border-emerald-800/40 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-2xl">{agent.icon}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        agent.status === "Active" ? "bg-emerald-950 text-emerald-400 border border-emerald-800/30" : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                    <h4 className="text-md font-bold text-zinc-200">{agent.name}</h4>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold block mt-0.5">{agent.role}</span>
                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">{agent.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CROP MANAGEMENT */}
          {activeTab === "crops" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: List Farms & Add Farm */}
              <div className="space-y-6">
                {/* Farms Selection card */}
                <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">Select Active Farm</h3>
                  {loadingFarms ? (
                    <div className="text-xs text-zinc-500">Loading farms...</div>
                  ) : farms.length === 0 ? (
                    <div className="text-xs text-zinc-500">No farms registered. Register one below.</div>
                  ) : (
                    <div className="space-y-2">
                      {farms.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFarm(f)}
                          className={`w-full flex justify-between items-center p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                            selectedFarm?.id === f.id
                              ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-400"
                          }`}
                        >
                          <span className="font-bold">{f.name}</span>
                          <span className="text-[9px] uppercase tracking-wider">{f.soilType} Soil</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Farm Form */}
                <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                  <h3 className="text-sm font-bold text-zinc-200 mb-4">Register New Farm Profile</h3>
                  
                  {farmError && <div className="text-xs text-rose-400 mb-3">{farmError}</div>}
                  {farmSuccess && <div className="text-xs text-emerald-400 mb-3">{farmSuccess}</div>}
                  
                  <form onSubmit={handleCreateFarm} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">FARM NAME</label>
                      <input
                        type="text"
                        required
                        value={newFarmName}
                        onChange={(e) => setNewFarmName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                        placeholder="Valley Heights"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">SOIL TYPE</label>
                        <select
                          value={newFarmSoil}
                          onChange={(e) => setNewFarmSoil(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="Clay">Clay</option>
                          <option value="Sandy">Sandy</option>
                          <option value="Silty">Silty</option>
                          <option value="Loamy">Loamy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">HECTARES</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={newFarmArea}
                          onChange={(e) => setNewFarmArea(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
                    >
                      Save Farm Profile
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Crops Table & Add Crop */}
              <div className="lg:col-span-2 space-y-6">
                {selectedFarm ? (
                  <>
                    {/* Planted Crops Table */}
                    <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-200">Active Crops - {selectedFarm.name}</h3>
                          <p className="text-[11px] text-zinc-500">Live fields directory synchronized with database</p>
                        </div>
                      </div>

                      {loadingCrops ? (
                        <div className="text-xs text-zinc-500">Loading crops list...</div>
                      ) : crops.length === 0 ? (
                        <div className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-xl">
                          No crops currently logged in this farm. Plant one below!
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-850">
                                <th className="pb-3">Crop Type</th>
                                <th className="pb-3">Variety</th>
                                <th className="pb-3">Planted At</th>
                                <th className="pb-3">Est. Harvest</th>
                                <th className="pb-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850">
                              {crops.map((c) => (
                                <tr key={c.id} className="text-zinc-300">
                                  <td className="py-3.5 font-bold text-zinc-100">{c.name}</td>
                                  <td className="py-3.5">{c.variety || "-"}</td>
                                  <td className="py-3.5">{c.plantedAt}</td>
                                  <td className="py-3.5">{c.harvestPlannedAt || "-"}</td>
                                  <td className="py-3.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
                                      {c.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Plant New Crop Form */}
                    <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-200 mb-4">Plant & Log New Crop inside {selectedFarm.name}</h3>
                      
                      {cropError && <div className="text-xs text-rose-400 mb-3">{cropError}</div>}
                      {cropSuccess && <div className="text-xs text-emerald-400 mb-3">{cropSuccess}</div>}
                      
                      <form onSubmit={handleCreateCrop} className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold mb-1">CROP NAME</label>
                          <input
                            type="text"
                            required
                            value={newCropName}
                            onChange={(e) => setNewCropName(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Tomato, Corn"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold mb-1">VARIETY</label>
                          <input
                            type="text"
                            required
                            value={newCropVariety}
                            onChange={(e) => setNewCropVariety(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                            placeholder="e.g. Roma, Sweet Sweet"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold mb-1">PLANTED DATE</label>
                          <input
                            type="date"
                            required
                            value={newCropPlanted}
                            onChange={(e) => setNewCropPlanted(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold mb-1">ESTIMATED HARVEST</label>
                          <input
                            type="date"
                            value={newCropHarvest}
                            onChange={(e) => setNewCropHarvest(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2 pt-2">
                          <button
                            type="submit"
                            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer"
                          >
                            Plant & Log Crop
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-3xl">
                    Register a Farm Profile in the left column first to unlock crop management.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SENSOR FEEDS */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-zinc-200 mb-2">📡 Real-Time Telemetry Node Logs</h3>
                <p className="text-sm text-zinc-500">
                  Simulating active field sensors measuring NPK soil values, moistures, and microclimate temperatures.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-5">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-3">Field Alpha Soil logs</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Moisture:</span> <span className="font-semibold text-emerald-400">38%</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Temperature:</span> <span className="font-semibold text-zinc-300">22.4°C</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Nitrogen (N):</span> <span className="font-semibold text-zinc-300">32 mg/kg</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Phosphorus (P):</span> <span className="font-semibold text-zinc-300">18 mg/kg</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Potassium (K):</span> <span className="font-semibold text-zinc-300">45 mg/kg</span></div>
                  </div>
                </div>

                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-5">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-3">Field Beta Soil logs</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Moisture:</span> <span className="font-semibold text-emerald-400">41%</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Temperature:</span> <span className="font-semibold text-zinc-300">21.8°C</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Nitrogen (N):</span> <span className="font-semibold text-rose-400 font-bold">18 mg/kg (Deficient)</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Phosphorus (P):</span> <span className="font-semibold text-zinc-300">24 mg/kg</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Potassium (K):</span> <span className="font-semibold text-zinc-300">42 mg/kg</span></div>
                  </div>
                </div>

                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 mb-2">Simulate Telemetry Event</h4>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Push sensor changes dynamically to trigger LangGraph weather & irrigation node rules.
                    </p>
                  </div>
                  <button className="w-full mt-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer">
                    Mock moisture drop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MARKET PRICE ANALYTICS */}
          {activeTab === "market" && (
            <div className="space-y-6">
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-zinc-200 mb-2">📈 AgriMarket price indices</h3>
                <p className="text-sm text-zinc-500">
                  Sentiment projection indices calculated by the Market agent using local supply datasets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-400">Tomatoes (Roma Index)</span>
                    <span className="text-xs font-bold text-emerald-400">+12.4%</span>
                  </div>
                  <h4 className="text-3xl font-extrabold text-zinc-100">$2.45 <span className="text-xs font-normal text-zinc-500">/ kg</span></h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Supply shortages in neighboring regions have spiked demand. The Market Agent recommends scheduling harvest within the next 5 days.
                  </p>
                </div>

                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-400">Sweet Corn (Corn Index)</span>
                    <span className="text-xs font-bold text-rose-400">-1.8%</span>
                  </div>
                  <h4 className="text-3xl font-extrabold text-zinc-100">$1.12 <span className="text-xs font-normal text-zinc-500">/ kg</span></h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Price index is stabilizing. Market supplies are healthy. No pivot suggested by prediction nodes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: USER PROFILE SECTION */}
          {activeTab === "profile" && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Profile Card */}
              <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
                <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl"></div>
                
                <div className="flex items-center gap-4 mb-6 border-b border-zinc-800/80 pb-6">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl">
                    👤
                  </div>
                  <div>
                    <h3 id="profile-username" className="text-xl font-bold text-zinc-100">{user.username}</h3>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-3 py-2 border-b border-zinc-850">
                    <span className="text-zinc-500 font-semibold">Security Role:</span>
                    <span id="profile-role" className="col-span-2 text-zinc-300 font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-zinc-850">
                    <span className="text-zinc-500 font-semibold">User ID:</span>
                    <span className="col-span-2 text-zinc-400 font-mono select-all">{user.userId}</span>
                  </div>
                  
                  {/* API JWT Token Display */}
                  <div className="space-y-2 pt-2">
                    <span className="text-zinc-500 font-semibold block">Authentication Token (JWT):</span>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 font-mono text-[10px] text-zinc-400 break-all select-all relative overflow-hidden max-h-20 overflow-y-auto">
                        {showToken ? user.token : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                      </div>
                      <div className="flex flex-col gap-1.5 justify-center">
                        <button
                          onClick={() => setShowToken(!showToken)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-[10px] text-zinc-300 font-bold transition-colors cursor-pointer"
                        >
                          {showToken ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={copyTokenToClipboard}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[10px] text-black font-bold transition-colors cursor-pointer"
                        >
                          {copySuccess ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-600 leading-normal block">
                      This token signs your REST requests. You can copy it to perform custom curl / Postman calls to secured endpoints.
                    </span>
                  </div>
                </div>
                
                {/* Logout Trigger Card */}
                <div className="mt-8 pt-6 border-t border-zinc-800/80 flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-medium">Terminate current session:</span>
                  <button
                    onClick={logout}
                    className="px-5 py-2.5 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Logout Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
