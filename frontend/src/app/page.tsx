"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

// Initial real-time action logs with realistic Indian farming inputs
const INITIAL_AGENT_LOGS = [
  {
    time: "12:00:15",
    agent: "System",
    message: "Initializing smart farming multi-agent telemetry registry...",
    type: "system",
  },
  {
    time: "12:00:18",
    agent: "Weather Agent",
    message: "Analyzing IMD radar feeds for Guntur region. Scattered light showers predicted in 24 hours (2.5mm precipitation).",
    type: "weather",
  },
  {
    time: "12:00:22",
    agent: "Irrigation Agent",
    message: "Soil moisture probe in Field 1 reports 32% (under threshold of 35%). Water stress detected.",
    type: "irrigation",
  },
  {
    time: "12:00:25",
    agent: "Irrigation Agent",
    message: "Overriding water schedule: Incoming showers are minor. Directing smart drip valves to release 10L/m for 15 minutes.",
    type: "irrigation_ok",
  },
  {
    time: "12:00:30",
    agent: "Fertilizer Agent",
    message: "Field 2 Soil check: Nitrogen is 14 mg/kg (Deficient). Phosphorus is 24 mg/kg (Optimal).",
    type: "fertilizer",
  },
  {
    time: "12:00:35",
    agent: "Fertilizer Agent",
    message: "Action plan generated: Apply nitrogen-rich urea (4kg/acre) to correct soil deficiency before rain arrival.",
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
  areaUnit?: string;
  locationName?: string;
}

interface Crop {
  id?: string;
  name: string;
  variety: string;
  plantedAt: string;
  harvestPlannedAt: string;
  status: string;
}

// Realistic locations in AP & Telangana with soil characteristics
const REALISTIC_LOCATIONS = [
  { name: "Guntur (Black Cotton Soil)", latitude: 16.3067, longitude: 80.4365, defaultSoil: "Black Cotton", tempRange: "30°C - 38°C", avgRainfall: "850mm" },
  { name: "Anantapur (Red Sandy Loam)", latitude: 14.6819, longitude: 77.6006, defaultSoil: "Sandy Loam", tempRange: "32°C - 42°C", avgRainfall: "550mm" },
  { name: "Chittoor (Red Loamy Soil)", latitude: 13.2172, longitude: 79.1003, defaultSoil: "Red Loamy", tempRange: "28°C - 36°C", avgRainfall: "900mm" },
  { name: "Karimnagar (Alluvial Rice Plains)", latitude: 18.4386, longitude: 79.1288, defaultSoil: "Alluvial Clay", tempRange: "29°C - 38°C", avgRainfall: "950mm" },
  { name: "Khammam (Cotton & Chilli Belt)", latitude: 17.2473, longitude: 80.1514, defaultSoil: "Clay Loam", tempRange: "30°C - 40°C", avgRainfall: "1050mm" }
];

// Available crops in English with Telugu translation in brackets
const AVAILABLE_CROPS = [
  { value: "Rice", label: "Rice (వరి - Vari)", varieties: ["BPT 5204 (Samba Masuri)", "Nellore Sannalu", "MTU 1010"] },
  { value: "Cotton", label: "Cotton (ప్రత్తి - Pratti)", varieties: ["Kaveri Jadoo", "Ajit 155", "BG II Hybrid"] },
  { value: "Chilli", label: "Chilli (మిరపకాయ - Mirapakaya)", varieties: ["Guntur Sannam S4", "Teja Chilli", "Byadagi"] },
  { value: "Groundnut", label: "Groundnut (వేరుశనగ - Verusenaga)", varieties: ["Kadiri 9", "K 6", "TAG 24"] },
  { value: "Maize", label: "Maize (మొక్కజొన్న - Mokkajonna)", varieties: ["Pioneer 3396", "DHM 117", "Dekalb 9108"] },
  { value: "Tomato", label: "Tomato (టమోటా - Tomato)", varieties: ["Arka Vikas", "Pusa Ruby", "PKM 1"] }
];

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
  const [locationIndex, setLocationIndex] = useState(0); // index for REALISTIC_LOCATIONS
  const [newFarmArea, setNewFarmArea] = useState("10.0");
  const [areaUnit, setAreaUnit] = useState("acres"); 
  const [farmError, setFarmError] = useState("");
  const [farmSuccess, setFarmSuccess] = useState("");

  // New Crop form
  const [newCropIndex, setNewCropIndex] = useState(0); // index for AVAILABLE_CROPS
  const [newCropVariety, setNewCropVariety] = useState(AVAILABLE_CROPS[0].varieties[0]);
  const [newCropPlanted, setNewCropPlanted] = useState(new Date().toISOString().split("T")[0]);
  const [newCropHarvest, setNewCropHarvest] = useState("");
  const [cropError, setCropError] = useState("");
  const [cropSuccess, setCropSuccess] = useState("");

  // Interactive Live States
  const [alphaMoisture, setAlphaMoisture] = useState(38);
  const [betaMoisture, setBetaMoisture] = useState(41);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [nitrogenLevel, setNitrogenLevel] = useState(14);
  const [phosphorusLevel, setPhosphorusLevel] = useState(24);
  
  // AI Agent chat interactive states
  const [selectedChatAgent, setSelectedChatAgent] = useState("Weather Agent");
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponses, setChatResponses] = useState<{ sender: string; text: string }[]>([
    { sender: "System", text: "Connected to Agent Reasoning Core. Choose an agent and type your query." }
  ]);
  const [sendingQuery, setSendingQuery] = useState(false);

  // Fetch health stats from backend
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

  // Fetch Farms
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
        const parsed = data.map((f: any) => {
          const locName = localStorage.getItem(`farm_loc_${f.id}`) || "Guntur (Black Cotton Soil)";
          const unit = localStorage.getItem(`farm_unit_${f.id}`) || "acres";
          return {
            ...f,
            areaUnit: unit,
            locationName: locName
          };
        });
        setFarms(parsed);
        if (parsed.length > 0 && !selectedFarm) {
          setSelectedFarm(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching farms", e);
    }
    setLoadingFarms(false);
  };

  // Fetch Crops
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

  // Create Farm
  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFarmError("");
    setFarmSuccess("");

    const targetLoc = REALISTIC_LOCATIONS[locationIndex];

    try {
      let hectares = parseFloat(newFarmArea);
      if (areaUnit === "acres") {
        hectares = hectares * 0.404686; // convert to hectares for the database
      }

      const res = await fetch("http://localhost:8080/api/v1/farms", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newFarmName,
          soilType: targetLoc.defaultSoil,
          totalAreaHectares: hectares,
          latitude: targetLoc.latitude,
          longitude: targetLoc.longitude
        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`farm_unit_${data.id}`, areaUnit);
        localStorage.setItem(`farm_loc_${data.id}`, targetLoc.name);
        
        setFarmSuccess("Farm profile registered successfully!");
        setNewFarmName("");
        fetchFarms();
        setSelectedFarm({ ...data, areaUnit, locationName: targetLoc.name });
      } else {
        setFarmError("Failed to register farm.");
      }
    } catch (err) {
      setFarmError("Connection error.");
    }
  };

  // Create Crop
  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFarm) return;
    setCropError("");
    setCropSuccess("");

    const targetCrop = AVAILABLE_CROPS[newCropIndex];

    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/crops`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: targetCrop.label, // English with Telugu in brackets (e.g. Tomato (టమోటా - Tomato))
          variety: newCropVariety,
          plantedAt: newCropPlanted,
          harvestPlannedAt: newCropHarvest || null,
          status: "PLANTED"
        })
      });

      if (res.ok) {
        setCropSuccess("Crop record added successfully!");
        setNewCropHarvest("");
        fetchCrops(selectedFarm.id);
      } else {
        setCropError("Failed to add crop record.");
      }
    } catch (err) {
      setCropError("Connection error.");
    }
  };

  // Trigger Mock Moisture drop
  const triggerMoistureDrop = () => {
    setAlphaMoisture(24);
    
    // Add logs
    const timestamp = new Date().toTimeString().split(" ")[0];
    const newLogs = [
      {
        time: timestamp,
        agent: "System",
        message: "ALERT: Live Soil moisture in Field Alpha dropped to 24% (CRITICAL threshold: 35%).",
        type: "disease",
      },
      {
        time: timestamp,
        agent: "Irrigation Agent",
        message: "Critical moisture trigger received. Checking local weather nodes... (No rain forecast for 6 hours).",
        type: "irrigation",
      },
      {
        time: timestamp,
        agent: "Irrigation Agent",
        message: "Action Executed: Triggering Field Alpha smart sprinklers. Water output: 15L/m.",
        type: "irrigation_ok",
      }
    ];

    setAgentLogs((prev) => [...prev, ...newLogs]);
    
    // Restore water levels after 10 seconds
    setTimeout(() => {
      setAlphaMoisture(38);
      const restoreTimestamp = new Date().toTimeString().split(" ")[0];
      setAgentLogs((prev) => [
        ...prev,
        {
          time: restoreTimestamp,
          agent: "System",
          message: "Field Alpha moisture levels restored to 38% (Optimal). Shutting off sprinklers.",
          type: "system"
        }
      ]);
    }, 10000);
  };

  // Trigger Mock Nitrogen drop
  const triggerNitrogenDrop = () => {
    setNitrogenLevel(8);
    const timestamp = new Date().toTimeString().split(" ")[0];
    const newLogs = [
      {
        time: timestamp,
        agent: "System",
        message: "Sensor Feed Warn: Field Beta Nitrogen content fell to 8 mg/kg (Deficient).",
        type: "disease"
      },
      {
        time: timestamp,
        agent: "Fertilizer Agent",
        message: "Fertilizer scheduler override triggered: Generating nitrogen dosage recommendations...",
        type: "fertilizer"
      }
    ];
    setAgentLogs((prev) => [...prev, ...newLogs]);
  };

  // Agent Chat Logic
  const handleAgentChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { sender: "You", text: chatMessage };
    setChatResponses((prev) => [...prev, userMsg]);
    setSendingQuery(true);
    const query = chatMessage;
    setChatMessage("");

    setTimeout(() => {
      let replyText = "";
      if (selectedChatAgent === "Weather Agent") {
        if (query.toLowerCase().includes("rain") || query.toLowerCase().includes("forecast")) {
          replyText = `Current forecast for ${selectedFarm?.locationName || "Guntur"}: Light local rain expected tomorrow. Precipitation: 2.5mm. Irrigation deferred to conserve water.`;
        } else {
          replyText = `The current temperature in ${selectedFarm?.locationName || "Guntur"} is optimal at 32°C. Humidity is 58%. Ideal conditions for vegetative crop development.`;
        }
      } else if (selectedChatAgent === "Irrigation Agent") {
        replyText = `Field Alpha moisture is ${alphaMoisture}%. Field Beta moisture is ${betaMoisture}%. Drip irrigation schedules are calculated using virtual soil profile models.`;
      } else if (selectedChatAgent === "Fertilizer Agent") {
        replyText = `Field B soil check: Nitrogen is deficient (${nitrogenLevel} mg/kg). Suggesting localized urea application (approx. 4.5kg per acre) to restore nitrogen levels.`;
      } else if (selectedChatAgent === "Market Agent") {
        replyText = "Wholesale Mandi Rates: Tomato (టమోటా) is trading high at ₹120/kg. Chilli (మిరపకాయ) is bullish at ₹210/kg. Selling is highly recommended.";
      } else {
        replyText = "Sensor networks are virtual simulation nodes and are fully synchronized with our agricultural database.";
      }

      setChatResponses((prev) => [...prev, { sender: selectedChatAgent, text: replyText }]);
      setSendingQuery(false);
    }, 1000);
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
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Smart Agriculture</span>
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
              className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
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
              <span className="text-zinc-300 font-bold text-emerald-400">
                {coreHealth?.database === "UP" ? "Connected" : "Offline"}
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
            <p className="text-xs text-zinc-600 font-medium">
              Active Location: {selectedFarm?.locationName || "Guntur (Black Cotton Soil)"} | Role: {user.role}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-zinc-800 bg-[#0d0d15] rounded-full py-1.5 px-3.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400">Agent Network Operational</span>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* TAB 1: MAIN DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Metric Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div
                  onClick={() => {
                    setSelectedField("alpha");
                    setActiveTab("telemetry");
                  }}
                  className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-emerald-800/50 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                    💧
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Field Alpha Moisture</span>
                  <h3 className="text-2xl font-bold mt-2 text-emerald-400">{alphaMoisture}%</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${alphaMoisture < 30 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`}></span>
                    <span>{alphaMoisture < 30 ? "Moisture CRITICAL" : "Moisture Optimal"}</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedField("beta");
                    setActiveTab("telemetry");
                  }}
                  className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-blue-800/50 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                    ☀️
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Field Beta Moisture</span>
                  <h3 className="text-2xl font-bold mt-2 text-sky-400">{betaMoisture}%</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span>Moisture Stable</span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedField("beta");
                    setActiveTab("telemetry");
                  }}
                  className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-amber-800/50 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                    ⚠️
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Soil Nitrogen Level</span>
                  <h3 className="text-2xl font-bold mt-2 text-amber-500">{nitrogenLevel} <span className="text-xs font-normal text-zinc-500">mg/kg</span></h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400/80">
                    <span>{nitrogenLevel < 10 ? "Nitrogen Level Deficient!" : "Soil Nutrition Optimal"}</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("market")}
                  className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-purple-800/50 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                    📈
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">Chilli Mandi Price</span>
                  <h3 className="text-2xl font-bold mt-2 text-purple-400">₹210 <span className="text-xs font-normal">/ kg</span></h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                    <span className="text-emerald-400 font-semibold">+14.2% Guntur Mandi Spurt</span>
                  </div>
                </div>
              </div>

              {/* Workable Dashboard Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Field Map Layout */}
                <div className="lg:col-span-2 border border-zinc-800/60 rounded-2xl p-6 bg-[#0a0a10]/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200">Interactive Farm Fields Map</h3>
                        <p className="text-xs text-zinc-500">Click on fields to inspect vegetative index and crop health stats</p>
                      </div>
                      <span className="text-[10px] bg-zinc-800/60 border border-zinc-700/50 rounded px-2 py-0.5 text-zinc-400 uppercase font-bold">
                        Interactive Map
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 h-64">
                      {/* Field Alpha */}
                      <div
                        onClick={() => setSelectedField(selectedField === "alpha" ? null : "alpha")}
                        className={`border rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
                          selectedField === "alpha"
                            ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-2 ring-emerald-500/30"
                            : "border-emerald-900/30 bg-emerald-950/10 hover:bg-emerald-950/20"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">Field A1 (Amaravati)</span>
                            <h4 className="text-lg font-bold text-zinc-200 mt-1">Chilli (మిరపకాయ)</h4>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${alphaMoisture < 30 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
                        </div>
                        <div className="text-xs space-y-1 text-zinc-400">
                          <div className="flex justify-between">
                            <span>Moisture level:</span>
                            <span className={`font-bold ${alphaMoisture < 30 ? "text-rose-400" : "text-emerald-400"}`}>
                              {alphaMoisture}% {alphaMoisture < 30 && "(Critical)"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mandi Value:</span>
                            <span className="font-semibold text-zinc-300">₹210.00 / kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Field Beta */}
                      <div
                        onClick={() => setSelectedField(selectedField === "beta" ? null : "beta")}
                        className={`border rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
                          selectedField === "beta"
                            ? "border-purple-500 bg-purple-950/20 text-purple-300 ring-2 ring-purple-500/30"
                            : "border-purple-900/30 bg-purple-950/10 hover:bg-purple-950/20"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-purple-400 font-bold tracking-wider uppercase">Field B4 (Karimnagar)</span>
                            <h4 className="text-lg font-bold text-zinc-200 mt-1">Rice (వరి - Vari)</h4>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${nitrogenLevel < 10 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
                        </div>
                        <div className="text-xs space-y-1 text-zinc-400">
                          <div className="flex justify-between">
                            <span>Moisture level:</span>
                            <span className="font-bold text-emerald-400">{betaMoisture}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nitrogen level:</span>
                            <span className={`font-bold ${nitrogenLevel < 10 ? "text-rose-400" : "text-zinc-300"}`}>
                              {nitrogenLevel} mg/kg {nitrogenLevel < 10 && "(Deficient)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800/40 flex justify-between items-center text-xs text-zinc-500">
                    <span>
                      {selectedField === "alpha" && "Selected: Field Alpha - Chilli (మిరపకాయ) in Guntur (Black Cotton Soil) coordinates."}
                      {selectedField === "beta" && "Selected: Field Beta - Rice (వరి) in Karimnagar alluvial soil belt."}
                      {!selectedField && "Click a field card to view vegetative status indicators"}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedField(null);
                        setActiveTab("crops");
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      Manage Crops →
                    </button>
                  </div>
                </div>

                {/* Agent Action Stream */}
                <div className="border border-zinc-800/60 rounded-2xl p-6 bg-[#090910] flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">Agentic Action Center</h3>
                      <p className="text-xs text-zinc-500 font-medium">Real-time decisions logs (LangGraph)</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping animate-duration-1000"></div>
                  </div>

                  {/* Log list */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar text-xs font-mono">
                    {agentLogs.map((log, index) => {
                      let agentColor = "text-zinc-400";
                      if (log.type.includes("weather")) agentColor = "text-sky-400";
                      if (log.type.includes("irrigation")) agentColor = "text-blue-400";
                      if (log.type.includes("fertilizer")) agentColor = "text-amber-400";
                      if (log.type.includes("market")) agentColor = "text-purple-400";
                      if (log.type.includes("disease")) agentColor = "text-rose-400";
                      
                      return (
                        <div key={index} className="border border-zinc-905 bg-zinc-950/40 rounded-xl p-3 space-y-1">
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
            <div className="space-y-8">
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-zinc-200 mb-2">🤖 Agentic AI Network Configuration</h3>
                <p className="text-sm text-zinc-500">
                  Select an agent card below, and ask questions directly in the live Agent Chat room below!
                </p>
              </div>

              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Weather Agent", role: "IMD Forecasts Node", status: "Active", desc: "Monitors regional forecasts and rainfall logs. Suggests targeted scheduling changes.", icon: "☀️" },
                  { name: "Irrigation Agent", role: "Virtual Drip Node", status: "Active", desc: "Reads virtual soil moisture data. Calculates sprinkler timings.", icon: "💧" },
                  { name: "Fertilizer Agent", role: "Soil Nutrition Node", status: "Active", desc: "Monitors nitrogen (N), phosphorus (P), and potassium (K) configurations.", icon: "🌱" },
                  { name: "Disease Vision Agent", role: "Leaf Spot Classification", status: "Idle", desc: "Analyzes uploaded crop pictures to categorize rust, blight, and fungal diseases.", icon: "👁️" },
                  { name: "Inventory Agent", role: "Seed & Fertilizers Tracker", status: "Active", desc: "Tracks material volumes. Requests replenishments automatically.", icon: "📦" },
                  { name: "Market Agent", role: "Mandi rate scraper", status: "Active", desc: "Monitors wholesale Mandi prices in Guntur and Hyderabad.", icon: "📈" },
                ].map((agent, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedChatAgent(agent.name)}
                    className={`border rounded-2xl p-5 transition-all cursor-pointer ${
                      selectedChatAgent === agent.name
                        ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-2 ring-emerald-500/20"
                        : "border-zinc-800 bg-[#0c0c12]/40 hover:border-zinc-700"
                    }`}
                  >
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

              {/* Chat room */}
              <div className="border border-zinc-850 bg-[#090910]/80 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">🗣️ Live Agent Chat Console</h3>
                    <p className="text-xs text-zinc-500">Active Query Target: <span className="text-emerald-400 font-bold">{selectedChatAgent}</span></p>
                  </div>
                  <select
                    value={selectedChatAgent}
                    onChange={(e) => setSelectedChatAgent(e.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Weather Agent">Weather Agent</option>
                    <option value="Irrigation Agent">Irrigation Agent</option>
                    <option value="Fertilizer Agent">Fertilizer Agent</option>
                    <option value="Market Agent">Market Agent</option>
                  </select>
                </div>

                {/* Messages Box */}
                <div className="h-48 overflow-y-auto border border-zinc-850 bg-zinc-950/40 rounded-2xl p-4 space-y-3 custom-scrollbar text-xs font-mono">
                  {chatResponses.map((msg, index) => (
                    <div key={index} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-zinc-500 mb-0.5">{msg.sender}</span>
                      <div className={`rounded-xl px-4 py-2 max-w-md ${
                        msg.sender === "You"
                          ? "bg-emerald-600 text-black font-semibold"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-300"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {sendingQuery && (
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px]">
                      <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Formulating plans...</span>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleAgentChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={`Ask ${selectedChatAgent} something (e.g. "What is the forecast?" or "Is nitrogen level low?")`}
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                  >
                    Ask Agent
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: CROP MANAGEMENT */}
          {activeTab === "crops" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Select Farm / Add Farm */}
              <div className="space-y-6">
                {/* Active Farms Directory */}
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
                          className={`w-full flex justify-between items-center p-3.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                            selectedFarm?.id === f.id
                              ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-400"
                          }`}
                        >
                          <span className="font-bold">{f.name}</span>
                          <span className="text-[9px] uppercase tracking-wider bg-zinc-850 px-2 py-0.5 rounded text-zinc-300 border border-zinc-800">
                            {f.totalAreaHectares.toFixed(1)} {f.areaUnit || "acres"}
                          </span>
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
                        placeholder="e.g. My Guntur Farm"
                      />
                    </div>
                    
                    {/* Location Selectable */}
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">SELECT REGIONAL LOCATION</label>
                      <select
                        value={locationIndex}
                        onChange={(e) => setLocationIndex(parseInt(e.target.value))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                      >
                        {REALISTIC_LOCATIONS.map((loc, i) => (
                          <option key={i} value={i}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">AREA UNIT</label>
                        <select
                          value={areaUnit}
                          onChange={(e) => setAreaUnit(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value="acres">Acres (ac)</option>
                          <option value="hectares">Hectares (ha)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">TOTAL AREA</label>
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
                    
                    {/* Auto-populated metrics warning */}
                    <div className="text-[10px] text-zinc-500 leading-relaxed bg-[#0c0c12] border border-zinc-850 p-3.5 rounded-xl">
                      <span>Coordinates: Lat {REALISTIC_LOCATIONS[locationIndex].latitude.toFixed(4)}, Long {REALISTIC_LOCATIONS[locationIndex].longitude.toFixed(4)}</span>
                      <br/>
                      <span>Soil profile: {REALISTIC_LOCATIONS[locationIndex].defaultSoil} | Temp: {REALISTIC_LOCATIONS[locationIndex].tempRange}</span>
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

              {/* Right Column: Crops Table & Forms */}
              <div className="lg:col-span-2 space-y-6">
                {selectedFarm ? (
                  <>
                    {/* Active Crops list */}
                    <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-200">Active Crops - {selectedFarm.name}</h3>
                        <p className="text-[11px] text-zinc-500 mb-6">Location: {selectedFarm.locationName}</p>
                      </div>

                      {loadingCrops ? (
                        <div className="text-xs text-zinc-500">Loading crops list...</div>
                      ) : crops.length === 0 ? (
                        <div className="text-xs text-zinc-500 py-6 text-center border border-dashed border-zinc-800 rounded-xl">
                          No crops currently logged. Plant one below!
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-850">
                                <th className="pb-3">Crop Name (English / Telugu)</th>
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

                    {/* Plant crop form with Telugu names */}
                    <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-200 mb-4">Plant & Log New Crop inside {selectedFarm.name}</h3>
                      
                      {cropError && <div className="text-xs text-rose-400 mb-3">{cropError}</div>}
                      {cropSuccess && <div className="text-xs text-emerald-400 mb-3">{cropSuccess}</div>}
                      
                      <form onSubmit={handleCreateCrop} className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold mb-1">CROP TYPE (TELUGU)</label>
                          <select
                            value={newCropIndex}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setNewCropIndex(val);
                              setNewCropVariety(AVAILABLE_CROPS[val].varieties[0]);
                            }}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                          >
                            {AVAILABLE_CROPS.map((crop, idx) => (
                              <option key={idx} value={idx}>
                                {crop.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-500 font-bold mb-1">VARIETY</label>
                          <select
                            value={newCropVariety}
                            onChange={(e) => setNewCropVariety(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                          >
                            {AVAILABLE_CROPS[newCropIndex].varieties.map((v, i) => (
                              <option key={i} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
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
                  <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-3xl">
                    Register a Farm Profile in the left column first to unlock crop management.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SENSOR FEEDS */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              
              {/* Virtual Telemetry Node Banner to address hardware clarification */}
              <div className="border border-emerald-800/40 rounded-2xl bg-emerald-950/20 p-4 border-l-4 border-l-emerald-500 text-xs text-emerald-300 leading-normal flex items-start gap-3">
                <span className="text-lg">🛠️</span>
                <div>
                  <span className="font-bold">Virtual Telemetry Engine Active:</span> Since this software prototype functions without physical IoT hardware probes, soil telemetry signals are generated using simulated microclimate algorithms mapping regional soil profiles.
                </div>
              </div>

              {/* Header info */}
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-zinc-200 mb-2">📡 Live Sensor Feeds (Simulated)</h3>
                  <p className="text-sm text-zinc-500">
                    Active measurements synced with location profiles. Click buttons inside cards to test warnings triggers.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAlphaMoisture(38);
                    setBetaMoisture(41);
                    setNitrogenLevel(14);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Telemetry
                </button>
              </div>

              {/* Grid data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Field Alpha Sensor Card */}
                <div className={`border rounded-2xl p-5 transition-all ${
                  selectedField === "alpha" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/5" : "border-zinc-850 bg-[#0c0c12]/40"
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Field 1 (Amaravati Chilli)</h4>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="space-y-3.5 text-xs font-mono">
                    <div className="flex justify-between border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500">Moisture:</span>
                      <span className={`font-bold ${alphaMoisture < 30 ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                        {alphaMoisture}% {alphaMoisture < 30 && "(Critical)"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Temperature:</span> <span className="font-semibold text-zinc-300">32.4°C</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Nitrogen (N):</span> <span className="font-semibold text-zinc-300">32 mg/kg</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Phosphorus (P):</span> <span className="font-semibold text-zinc-300">18 mg/kg</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Potassium (K):</span> <span className="font-semibold text-zinc-300">45 mg/kg</span></div>
                  </div>
                  <button
                    onClick={triggerMoistureDrop}
                    className="w-full mt-5 py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    Simulate Moisture Drop (Critical)
                  </button>
                </div>

                {/* Field Beta Sensor Card */}
                <div className={`border rounded-2xl p-5 transition-all ${
                  selectedField === "beta" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/5" : "border-zinc-850 bg-[#0c0c12]/40"
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Field 2 (Karimnagar Rice)</h4>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="space-y-3.5 text-xs font-mono">
                    <div className="flex justify-between border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500">Moisture:</span>
                      <span className="font-bold text-emerald-400">{betaMoisture}%</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Temperature:</span> <span className="font-semibold text-zinc-300">30.8°C</span></div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2">
                      <span className="text-zinc-500">Nitrogen (N):</span>
                      <span className={`font-bold ${nitrogenLevel < 10 ? "text-rose-400" : "text-zinc-300"}`}>
                        {nitrogenLevel} mg/kg {nitrogenLevel < 10 && "(Low)"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-2"><span className="text-zinc-500">Phosphorus (P):</span> <span className="font-semibold text-zinc-300">24 mg/kg</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Potassium (K):</span> <span className="font-semibold text-zinc-300">42 mg/kg</span></div>
                  </div>
                  <button
                    onClick={triggerNitrogenDrop}
                    className="w-full mt-5 py-2.5 rounded-xl bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/40 text-amber-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    Simulate Nitrogen Defect
                  </button>
                </div>

                {/* Info Guide */}
                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 mb-3">📡 Simulation Details</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      Telemetry values are modeled on realistic Indian regional soils (such as Guntur black soil and red chalky soils of Telangana). 
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Defects alert the FastAPI AI engine which returns detailed recovery advice.
                    </p>
                  </div>
                  <div className="text-[11px] text-zinc-600 bg-zinc-950/40 border border-zinc-900 rounded-xl p-3">
                    Active Coordinates: Guntur region (AP)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MARKET PRICE ANALYTICS */}
          {activeTab === "market" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-zinc-200 mb-2">📈 Mandi Rates Index (Rupees ₹)</h3>
                <p className="text-sm text-zinc-500">
                  Wholesale price indices scraped directly matching rates in Guntur, Hyderabad, and Warangal mandis.
                </p>
              </div>

              {/* Indian Mandi Price Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chilli */}
                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-6 space-y-4 hover:border-emerald-800/30 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chilli (Guntur Teja Mandi Rate)</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/30">+14.2% Spurt</span>
                  </div>
                  <h4 className="text-4xl font-extrabold text-zinc-100">₹210.00 <span className="text-xs font-normal text-zinc-500">/ kg</span></h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Heavy export demands has spiked wholesale bids. The Market Agent advises harvesting and processing Guntur Teja Chilli yields to secure peak margins.
                  </p>
                  <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-850">
                    <span>Average Cost: ₹185.00 / kg</span>
                    <span>Sentiment: **BULLISH**</span>
                  </div>
                </div>

                {/* Paddy / Rice */}
                <div className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-6 space-y-4 hover:border-zinc-800 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Rice (Samba Masuri Mandi Rate)</span>
                    <span className="text-xs font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/30">-1.8% Slide</span>
                  </div>
                  <h4 className="text-4xl font-extrabold text-zinc-100">₹45.00 <span className="text-xs font-normal text-zinc-500">/ kg</span></h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Samba Masuri supplies are steady in Warangal mandis. Pricing is expected to consolidate. The Market Agent suggests storing inventory in warehouses to avoid low margins.
                  </p>
                  <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-850">
                    <span>Average Cost: ₹48.00 / kg</span>
                    <span>Sentiment: **STABLE**</span>
                  </div>
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

                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-3 py-2 border-b border-zinc-850 font-sans">
                    <span className="text-zinc-500 font-semibold">Security Role:</span>
                    <span id="profile-role" className="col-span-2 text-zinc-300 font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-zinc-850">
                    <span className="text-zinc-500 font-semibold font-sans">User ID:</span>
                    <span className="col-span-2 text-zinc-400 select-all">{user.userId}</span>
                  </div>
                  
                  {/* Token Info */}
                  <div className="space-y-2 pt-2 font-sans">
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
                      This token authenticates your REST calls. You can copy it to perform custom curl commands.
                    </span>
                  </div>
                </div>
                
                {/* Logout */}
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
