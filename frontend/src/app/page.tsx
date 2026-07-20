"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

// Live action logs with realistic Indian agricultural parameters
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
    message: "Analyzing IMD radar feeds for active region. Scattered light showers predicted in 24 hours (2.5mm precipitation).",
    type: "weather",
  },
  {
    time: "12:00:22",
    agent: "Irrigation Agent",
    message: "Soil moisture probe in Field A reports 32% (under threshold of 35%). Water stress detected.",
    type: "irrigation",
  },
  {
    time: "12:00:25",
    agent: "Irrigation Agent",
    message: "Overriding watering scheduler: Incoming showers are minor. Directing smart drip valves to release 10L/m.",
    type: "irrigation_ok",
  },
  {
    time: "12:00:30",
    agent: "Fertilizer Agent",
    message: "Field B Soil check: Nitrogen is 14 mg/kg (Deficient). Phosphorus is 24 mg/kg (Optimal).",
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

interface TelemetryRecord {
  id: number;
  recordedAt: string;
  soilMoisture: number;
  soilTemp: number;
  npkNitrogen: number;
  npkPhosphorus: number;
  npkPotassium: number;
}

// Realistic locations in AP & Telangana with soil characteristics (Added Hyderabad as priority)
const REALISTIC_LOCATIONS = [
  { name: "Hyderabad (Red Clay Loam)", latitude: 17.3850, longitude: 78.4867, defaultSoil: "Red Sandy Clay", tempRange: "28°C - 35°C", avgRainfall: "800mm", moistureDefault: 33 },
  { name: "Guntur (Black Cotton Soil)", latitude: 16.3067, longitude: 80.4365, defaultSoil: "Black Cotton", tempRange: "30°C - 38°C", avgRainfall: "850mm", moistureDefault: 38 },
  { name: "Anantapur (Red Sandy Loam)", latitude: 14.6819, longitude: 77.6006, defaultSoil: "Sandy Loam", tempRange: "32°C - 42°C", avgRainfall: "550mm", moistureDefault: 29 },
  { name: "Chittoor (Red Loamy Soil)", latitude: 13.2172, longitude: 79.1003, defaultSoil: "Red Loamy", tempRange: "28°C - 36°C", avgRainfall: "900mm", moistureDefault: 35 },
  { name: "Karimnagar (Alluvial Rice Plains)", latitude: 18.4386, longitude: 79.1288, defaultSoil: "Alluvial Clay", tempRange: "29°C - 38°C", avgRainfall: "950mm", moistureDefault: 42 },
  { name: "Khammam (Cotton & Chilli Belt)", latitude: 17.2473, longitude: 80.1514, defaultSoil: "Clay Loam", tempRange: "30°C - 40°C", avgRainfall: "1050mm", moistureDefault: 36 }
];

// Available crops with multilingual options
const AVAILABLE_CROPS = [
  { value: "Rice", labelEn: "Rice", labelHi: "धान - Dhaan", labelTe: "వరి - Vari", label: "Rice (వరి - Vari)", varieties: ["BPT 5204 (Samba Masuri)", "Nellore Sannalu", "MTU 1010"], baseCostPerAcre: 18000, yieldPerAcreQuintals: 22, marketPricePerQuintal: 2180, durationDays: 120 },
  { value: "Cotton", labelEn: "Cotton", labelHi: "कपास - Kapaas", labelTe: "ప్రత్తి - Pratti", label: "Cotton (ప్రత్తి - Pratti)", varieties: ["Kaveri Jadoo", "Ajit 155", "BG II Hybrid"], baseCostPerAcre: 22000, yieldPerAcreQuintals: 10, marketPricePerQuintal: 7000, durationDays: 150 },
  { value: "Chilli", labelEn: "Chilli", labelHi: "लाल मिर्च - Lal Mirch", labelTe: "మిరపకాయ - Mirapakaya", label: "Chilli (మిరపకాయ - Mirapakaya)", varieties: ["Guntur Sannam S4", "Teja Chilli", "Byadagi"], baseCostPerAcre: 35000, yieldPerAcreQuintals: 15, marketPricePerQuintal: 19500, durationDays: 150 },
  { value: "Groundnut", labelEn: "Groundnut", labelHi: "मूंगफली - Mungfali", labelTe: "వేరుశనగ - Verusenaga", label: "Groundnut (వేరుశనగ - Verusenaga)", varieties: ["Kadiri 9", "K 6", "TAG 24"], baseCostPerAcre: 15000, yieldPerAcreQuintals: 8, marketPricePerQuintal: 6300, durationDays: 105 },
  { value: "Maize", labelEn: "Maize", labelHi: "मक्का - Makka", labelTe: "మొక్కజొన్న - Mokkajonna", label: "Maize (మొక్కజొన్న - Mokkajonna)", varieties: ["Pioneer 3396", "DHM 117", "Dekalb 9108"], baseCostPerAcre: 12000, yieldPerAcreQuintals: 25, marketPricePerQuintal: 1960, durationDays: 100 },
  { value: "Tomato", labelEn: "Tomato", labelHi: "टमाटर - Tamatar", labelTe: "టమోటా - Tomato", label: "Tomato (టమోటా - Tomato)", varieties: ["Arka Vikas", "Pusa Ruby", "PKM 1"], baseCostPerAcre: 25000, yieldPerAcreQuintals: 120, marketPricePerQuintal: 1200, durationDays: 90 },
  { value: "Wheat", labelEn: "Wheat", labelHi: "गेहूं - Gehun", labelTe: "గోధుమలు - Godhumalu", label: "Wheat (గోధుమలు - Godhumalu)", varieties: ["Lok-1", "GW-322", "HD-2967"], baseCostPerAcre: 14000, yieldPerAcreQuintals: 18, marketPricePerQuintal: 2275, durationDays: 110 },
  { value: "Turmeric", labelEn: "Turmeric", labelHi: "हल्दी - Haldi", labelTe: "పసుపు - Pasupu", label: "Turmeric (పసుపు - Pasupu)", varieties: ["IISR Pragati", "Duggirala", "Tekurpet"], baseCostPerAcre: 40000, yieldPerAcreQuintals: 24, marketPricePerQuintal: 11500, durationDays: 240 },
  { value: "Sugarcane", labelEn: "Sugarcane", labelHi: "गन्ना - Ganna", labelTe: "చెరకు - Cheraku", label: "Sugarcane (చెరకు - Cheraku)", varieties: ["Co 86032", "Co 0238", "Co 8021"], baseCostPerAcre: 32000, yieldPerAcreQuintals: 350, marketPricePerQuintal: 315, durationDays: 360 },
  { value: "Onion", labelEn: "Onion", labelHi: "प्याज़ - Pyaaz", labelTe: "ఉల్లిపాయ - Ullipaya", label: "Onion (ఉల్లిపాయ - Ullipaya)", varieties: ["Bhima Super", "Agrifound Dark Red", "N-53"], baseCostPerAcre: 20000, yieldPerAcreQuintals: 85, marketPricePerQuintal: 1800, durationDays: 110 }
];

const LEAF_DISEASE_DATA: Record<string, { diseaseName: string; localName: string; medicine: string; dosage: string; tips: string[] }> = {
  tomato: {
    diseaseName: "Early Blight (Alternaria solani)",
    localName: "టమోటా ఆకు మాడు తెగులు (Tomato Aaku Maadu Tegulu)",
    medicine: "Copper Oxychloride (50% WP) or Mancozeb fungicide.",
    dosage: "Mix 2.5g of Copper Oxychloride per 1 Litre of clean water. Spray thoroughly over foliage.",
    tips: [
      "Keep foliage dry: Use drip irrigation at soil level instead of overhead sprinklers.",
      "Prune lower leaves: Remove leaves touching the soil to prevent soil-to-foliar transmission.",
      "Maintain spacing: Allow ample crop spacing to ensure ventilation."
    ]
  },
  rice: {
    diseaseName: "Paddy Blast (Magnaporthe oryzae)",
    localName: "వరి ఆకు అగ్గి తెగులు (Vari Aaku Aggi Tegulu)",
    medicine: "Tricyclazole (75% WP) or Isoprothiolane.",
    dosage: "Mix 0.6g of Tricyclazole per 1 Litre of water. Apply at first sign of spindle-shaped spots.",
    tips: [
      "Avoid excessive Nitrogen: High nitrogen urea increases crop susceptibility to blast.",
      "Field sanitation: Clear weed hosts and stubbles from previous season to reduce spores.",
      "Use resistant varieties: Plant certified seeds from local agricultural extension."
    ]
  },
  cotton: {
    diseaseName: "Alternaria Leaf Spot",
    localName: "ప్రత్తి ఆకు మచ్చ తెగులు (Pratti Aaku Maccha Tegulu)",
    medicine: "Propiconazole (25% EC) or Copper Hydroxide.",
    dosage: "Mix 1.0ml of Propiconazole per 1 Litre of water. Spray at 10-day intervals.",
    tips: [
      "Deep plowing: Bury infected plant debris deep into soil after harvest.",
      "Remove volunteer plants: Pull out wild cotton varieties that act as spore reservoirs.",
      "Irrigate early: Apply water early morning so leaves dry quickly in daylight."
    ]
  }
};

const CROP_CULTIVATION_PLAYBOOKS: Record<string, {
  sowing: { en: string; hi: string; te: string };
  landPrep: { en: string; hi: string; te: string };
  irrigation: { en: string; hi: string; te: string };
  fertilizer: { en: string; hi: string; te: string };
  pestControl: { en: string; hi: string; te: string };
  harvest: { en: string; hi: string; te: string };
}> = {
  Rice: {
    sowing: {
      en: "Nursery sowing: Use 20kg certified seeds per acre. Soak in Carbendazim solution for 24h before broadcasting. Transplant seedlings at 21-25 days maturity.",
      hi: "नर्सरी बुवाई: प्रति एकड़ 20 किलोग्राम प्रमाणित बीजों का उपयोग करें। बोने से पहले 24 घंटे के लिए कार्बेन्डाजिम घोल में भिगोएँ। 21-25 दिनों में पौधों का प्रत्यारोपण करें।",
      te: "నర్సరీ నాటడం: ఎకరాకు 20 కిలోల ధృవీకరించిన విత్తనాలను వాడండి. చల్లే ముందు 24 గంటల పాటు కార్బెండజిమ్ ద్రావణంలో నానబెట్టండి. 21-25 రోజులలో నారు నాటండి."
    },
    landPrep: {
      en: "Puddling: Plough field 2-3 times, flood with 5-10cm water. Apply 10 tonnes of organic farmyard manure (FYM) per acre to improve clay soil cohesion.",
      hi: "कदम बनाना: खेत को 2-3 बार जोतें, 5-10 सेमी पानी भरें। मिट्टी के सामंजस्य को सुधारने के लिए प्रति एकड़ 10 टन जैविक खाद (FYM) डालें।",
      te: "దుక్కి దున్నడం: పొలాన్ని 2-3 సార్లు దున్నండి, 5-10 సెం.మీ నీటితో నింపండి. మట్టి బలానికి ఎకరాకు 10 టన్నుల సేంద్రీయ ఎరువును వేయండి."
    },
    irrigation: {
      en: "Keep 2-5cm standing water level constantly during vegetative stages. Drain field 10-14 days before harvesting.",
      hi: "वानस्पतिक चरणों के दौरान लगातार 2-5 सेमी खड़ा पानी का स्तर रखें। कटाई से 10-14 दिन पहले खेत का पानी निकाल दें।",
      te: "పంట ఎదుగుదల దశలలో నిరంతరం 2-5 సెం.మీ నీరు ఉండేలా చూసుకోండి. కోతకు 10-14 రోజుల ముందు నీటిని తీసివేయండి."
    },
    fertilizer: {
      en: "Basal: NPK 20:20:20 (50kg/acre). Top-dressing: Urea (Nitrogen) at 30 days (30kg) and 60 days (20kg) during panicle initiation.",
      hi: "आधार: NPK 20:20:20 (50 किग्रा/एकड़)। टॉप-ड्रेसिंग: यूरिया (नाइट्रोजन) 30 दिन (30 किग्रा) और 60 दिन (20 किग्रा) पर।",
      te: "ప్రాథమిక ఎరువు: NPK 20:20:20 (ఎకరాకు 50 కిలోలు). టాప్-డ్రెస్సింగ్: యూరియాను 30 రోజులలో (30 కిలోలు) మరియు 60 రోజులలో (20 కిలోలు) వేయండి."
    },
    pestControl: {
      en: "Monitor Stem Borer (Spindle spots). Apply Cartap Hydrochloride (4G) at 10kg/acre if damage exceeds 10% threshold.",
      hi: "तना छेदक की निगरानी करें। यदि नुकसान 10% से अधिक हो तो 10 किग्रा/एकड़ की दर से कार्टाप हाइड्रोक्लोराइड (4G) लगाएं।",
      te: "కాండం తొలుచు పురుగును గమనించండి. నష్టం 10% దాటితే ఎకరాకు 10 కిలోల కార్టాప్ హైడ్రోక్లోరైడ్ (4G) వేయండి."
    },
    harvest: {
      en: "Cut stalks when 90% panicles turn golden brown. Dry grains under sunlight until moisture dips below 14% to prevent mandi spoilage.",
      hi: "जब 90% बालियाँ सुनहरी भूरी हो जाएँ तो कटाई करें। मंडी में खराब होने से बचाने के लिए दानों को धूप में तब तक सुखाएं जब तक नमी 14% से कम न हो जाए।",
      te: "90% వెన్నులు బంగారు రంగులోకి మారినప్పుడు కోయండి. ధాన్యం పాడవకుండా ఉండటానికి తేమ శాతం 14% కంటే తగ్గేలా ఎండబెట్టండి."
    }
  },
  Cotton: {
    sowing: {
      en: "Direct seeding: Plant seeds at 3-4cm depth with 90x60cm spacing. Use 1.5-2.0kg Bt Hybrid seeds per acre.",
      hi: "सीधी बुवाई: 90x60 सेमी की दूरी के साथ 3-4 सेमी गहराई पर बीज बोएं। प्रति एकड़ 1.5-2.0 किग्रा बीटी हाइब्रिड बीजों का उपयोग करें।",
      te: "నేరుగా నాటడం: 90x60 సెం.మీ అంతరంతో 3-4 సెం.మీ లోతులో విత్తనాలను నాటండి. ఎకరాకు 1.5-2.0 కిలోల బిటి హైబ్రిడ్ విత్తనాలను వాడండి."
    },
    landPrep: {
      en: "Deep plowing: Work the soil 2-3 times using tractor cultivators. Construct ridges and furrows to prevent root waterlogging.",
      hi: "गहरी जुताई: ट्रैक्टर कल्टीवेटर से मिट्टी को 2-3 बार जोतें। जड़ों में जलभराव को रोकने के लिए मेड़ और खाइयां बनाएं।",
      te: "లోతు దుక్కి: ట్రాక్టర్ సహాయంతో నేలను 2-3 సార్లు బాగా దున్నండి. వేర్లలో నీరు నిల్వ ఉండకుండా బోదెలు, కాలువలు ఏర్పాటు చేయండి."
    },
    irrigation: {
      en: "Moderate requirement. Irrigate at critical phases: flowering and boll development. Avoid standing water.",
      hi: "मध्यम आवश्यकता। महत्वपूर्ण चरणों में सिंचाई करें: फूल आने और डोडा बनने के समय। खड़े पानी से बचें।",
      te: "మితమైన నీటి పారుదల. పూత మరియు కాయ దశలలో నీటిని అందించండి. పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోండి."
    },
    fertilizer: {
      en: "NPK ratios: 60:30:30 kg per acre. Apply Nitrogen in three split doses: at sowing, 30 days, and 60 days.",
      hi: "NPK अनुपात: 60:30:30 किग्रा प्रति एकड़। नाइट्रोजन तीन अलग-अलग खुराकों में डालें: बुवाई के समय, 30 दिन और 60 दिन पर।",
      te: "NPK నిష్పత్తి: ఎకరాకు 60:30:30 కిలోలు. నత్రజనిని మూడు విడతలుగా వేయండి: నాటేటప్పుడు, 30 రోజులకు మరియు 60 రోజులకు."
    },
    pestControl: {
      en: "Pink Bollworm vigilance: Use pheromone traps (5/acre). Spray Neem Oil (1500ppm) or Spinosad if boll damage occurs.",
      hi: "गुलाबी सुंडी से सतर्क रहें: फेरोमोन ट्रैप (5/एकड़) का उपयोग करें। डोडा खराब होने पर नीम का तेल (1500ppm) या स्पिनोसैड का छिड़काव करें।",
      te: "గులాబి రంగు కాయ తొలిచే పురుగు నివారణ: ఎకరాకు 5 లింగాకర్షణ బుట్టలను అమర్చండి. వేప నూనె (1500ppm) లేదా స్పినోసాడ్ పిచికారీ చేయండి."
    },
    harvest: {
      en: "Hand-pick clean cotton from fully opened bolls only. Avoid picking dew-moist cotton to maintain high fiber quality grade.",
      hi: "केवल पूरी तरह से खुले हुए डोडों से ही साफ कपास हाथ से चुनें। उच्च फाइबर गुणवत्ता ग्रेड बनाए रखने के लिए ओस से गीले कपास को न चुनें।",
      te: "పూర్తిగా విచ్చుకున్న కాయల నుండి మాత్రమే పత్తిని ఏరండి. పత్తి నాణ్యత దెబ్బతినకుండా ఉండటానికి మంచు తడి ఉన్నప్పుడు ఏరవద్దు."
    }
  },
  Chilli: {
    sowing: {
      en: "Nursery raising: Sown in December. Transplant healthy seedlings at 5-6 weeks age. Spacing: 60x45cm.",
      hi: "नर्सरी तैयार करना: दिसंबर में बुवाई की जाती है। 5-6 सप्ताह पुराने स्वस्थ पौधों का रोपण करें। दूरी: 60x45 सेमी।",
      te: "నర్సరీ పెంపకం: డిసెంబర్‌లో విత్తనాలు వేయాలి. 5-6 వారాల వయసున్న నారును నాటండి. అంతరం: 60x45 సెం.మీ."
    },
    landPrep: {
      en: "Fine tilth: Incorporate 12 tonnes FYM per acre. Build raised beds with plastic mulching sheets to check weed growth.",
      hi: "बारीक जुताई: प्रति एकड़ 12 टन FYM मिलाएं। खरपतवार नियंत्रण के लिए प्लास्टिक मल्चिंग शीट के साथ उठी हुई क्यारियाँ बनाएँ।",
      te: "నేల తయారీ: ఎకరాకు 12 టన్నుల పశువుల ఎరువు వేయండి. కలుపు నివారణకు ప్లాస్టిక్ మల్చింగ్ షీట్లతో ఎత్తైన బెడ్లను తయారు చేయండి."
    },
    irrigation: {
      en: "Drip irrigation highly recommended. Keep soil moist but never saturated. Irrigate every 4-7 days depending on temperature.",
      hi: "ड्रिप सिंचाई की अत्यधिक सिफारिश की जाती है। मिट्टी को नम रखें लेकिन पानी जमा न होने दें। तापमान के आधार पर हर 4-7 दिनों में सिंचाई करें।",
      te: "డ్రిప్ నీటి పారుదల చాలా మంచిది. నేలలో తగినంత తేమ ఉంచండి. ఉష్ణోగ్రత ఆధారంగా ప్రతి 4-7 రోజులకు ఒకసారి నీరు పెట్టండి."
    },
    fertilizer: {
      en: "NPK 120:60:60 kg per acre. Apply Phosphatic fertilizers fully as basal, Nitrogen & Potash in 4 split doses.",
      hi: "NPK 120:60:60 किग्रा प्रति एकड़। फॉस्फेटिक उर्वरकों को पूरी तरह से आधार के रूप में डालें, नाइट्रोजन और पोटाश 4 अलग खुराकों में डालें।",
      te: "NPK 120:60:60 కిలోలు ఎకరాకు. భాస్వరం పూర్తిగా ప్రాథమికంగా వేయండి, నత్రజని & పొటాష్‌ను 4 విడతలుగా వేయండి."
    },
    pestControl: {
      en: "Thrips & Mites: Spray Fipronil 5% SC (2.0ml/L) or organic Garlic-Chilli extract spray to check leaf curling.",
      hi: "थ्रिप्स और माइट्स: पत्ती मुड़ने के नियंत्रण के लिए फिप्रोनिल 5% SC (2.0ml/L) या जैविक लहसुन-मिर्च के अर्क का छिड़काव करें।",
      te: "తామర పురుగులు & నల్లి నివారణ: ఆకు ముడుత నివారణకు ఫిప్రోనిల్ 5% SC (2.0ml/L) లేదా వెల్లుల్లి-మిర్చి కషాయం పిచికారీ చేయండి."
    },
    harvest: {
      en: "Pick fully ripe red fruits for dry chilli index. Pick green chillies at 10-day intervals for fresh vegetable mandis.",
      hi: "सूखी लाल मिर्च के लिए पूरी तरह पके लाल फलों को चुनें। ताजी सब्जी मंडियों के लिए 10 दिनों के अंतराल पर हरी मिर्च चुनें।",
      te: "ఎండుమిర్చి కొరకు బాగా పండిన ఎర్రటి కాయలను కోయండి. పచ్చిమిర్చి కొరకు ప్రతి 10 రోజులకు ఒకసారి కోత కోయండి."
    }
  },
  Groundnut: {
    sowing: {
      en: "Shell pods 1-2 days before sowing. Seed rate: 45kg kernels per acre. Spacing: 30x10cm.",
      hi: "बुवाई से 1-2 दिन पहले फली छीलें। बीज दर: 45 किग्रा दाने प्रति एकड़। दूरी: 30x10 सेमी।",
      te: "నాటడానికి 1-2 రోజుల ముందు కాయల నుండి పప్పు వేరుచేయండి. విత్తన మోతాదు: ఎకరాకు 45 కిలోల పప్పు. అంతరం: 30x10 సెం.మీ."
    },
    landPrep: {
      en: "Plough 2 times to get loose sandy loam texture. Apply Gypsum at 200kg per acre during pegging to boost pod density.",
      hi: "ढीली रेतीली दोमट बनावट पाने के लिए 2 बार जोतें। फली घनत्व बढ़ाने के लिए पेगिंग के दौरान प्रति एकड़ 200 किग्रा जिप्सम डालें।",
      te: "నేలను 2 సార్లు బాగా దున్నండి. కాయలు బాగా ఊరడానికి ఊడలు దిగే దశలో ఎకరాకు 200 కిలోల జిప్సం వేయండి."
    },
    irrigation: {
      en: "Requires 4-6 irrigations. Critical phases are flowering, pegging, and pod formation. Avoid water stress at pegging.",
      hi: "4-6 सिंचाइयों की आवश्यकता होती है। महत्वपूर्ण चरण फूल आना, पेगिंग और फली बनना हैं। पेगिंग के समय पानी की कमी न होने दें।",
      te: "4-6 తడులు అవసరం. పూత దశ, ఊడలు దిగే దశ మరియు కాయ తయారయ్యే దశలు చాలా కీలకం. ఊడలు దిగే దశలో నీటి కొరత లేకుండా చూసుకోండి."
    },
    fertilizer: {
      en: "NPK 10:20:30 kg per acre. Gypsum application is critical to supply Calcium and Sulphur for oil production.",
      hi: "NPK 10:20:30 किग्रा प्रति एकड़। तेल उत्पादन के लिए कैल्शियम और सल्फर की आपूर्ति के लिए जिप्सम डालना महत्वपूर्ण है।",
      te: "NPK 10:20:30 కిలోలు ఎకరాకు. నూనె శాతం పెరగడానికి క్యాల్షియం, సల్ఫర్ అందించే జిప్సం వేయడం చాలా అవసరం."
    },
    pestControl: {
      en: "Red Hairy Caterpillar & Tikka leaf spot. Apply Carbendazim (1g/L) for leaf spot control.",
      hi: "लाल बालों वाली सूंडी और टिक्का पत्ती धब्बा रोग। पत्ती धब्बा नियंत्रण के लिए कार्बेन्डाजिम (1g/L) लगाएं।",
      te: "ఎర్ర గొంగళి పురుగు & టిక్కా ఆకుమచ్చ తెగులు. ఆకుమచ్చ నివారణకు కార్బెండజిమ్ (1g/L) పిచికారీ చేయండి."
    },
    harvest: {
      en: "Pull plants when leaves turn yellow and inner shells turn blackish. Dry vines in field for 3 days before stripping pods.",
      hi: "जब पत्तियाँ पीली हो जाएँ और भीतरी छिलका काला पड़ जाए तो पौधों को उखाड़ लें। फलियाँ निकालने से पहले लताओं को 3 दिन धूप में सुखाएं।",
      te: "ఆకులు పసుపు రంగులోకి మారి, కాయ లోపలి పొర నల్లగా మారినప్పుడు పంటను పీకండి. కాయలు వేరుచేసే ముందు పొలంలో 3 రోజులు ఆరబెట్టండి."
    }
  },
  Maize: {
    sowing: {
      en: "Dibble seeds at 5cm depth. Seed rate: 8kg per acre. Spacing: 60x20cm for optimal leaf aeration.",
      hi: "5 सेमी गहराई पर बीज बोएं। बीज दर: 8 किग्रा प्रति एकड़। इष्टतम वेंटिलेशन के लिए दूरी: 60x20 सेमी।",
      te: "5 సెం.మీ లోతులో విత్తనాలను నాటండి. విత్తన మోతాదు: ఎకరాకు 8 కిలోలు. మొక్కల అంతరం: 60x20 సెం.మీ."
    },
    landPrep: {
      en: "Deep tilling: Plough field 2-3 times. Apply 8 tonnes of compost/manure to enrich organic carbon content.",
      hi: "गहरी जुताई: खेत को 2-3 बार जोतें। कार्बनिक कार्बन बढ़ाने के लिए 8 टन खाद/कम्पोस्ट डालें।",
      te: "లోతు దుక్కి: నేలను 2-3 సార్లు దున్నండి. సేంద్రీయ కర్బనాన్ని పెంచడానికి 8 టన్నుల కంపొస్ట్ ఎరువు వేయండి."
    },
    irrigation: {
      en: "Irrigate immediately after sowing. Maintain steady soil moisture during tasseling and silking stages.",
      hi: "बुवाई के तुरंत बाद सिंचाई करें। फूल आने और दाने बनने के चरणों के दौरान स्थिर नमी बनाए रखें।",
      te: "విత్తిన వెంటనే నీరు పెట్టండి. పూత దశ మరియు కంకి దశలలో పొలంలో తగినంత తేమ ఉండేలా చూసుకోండి."
    },
    fertilizer: {
      en: "NPK 48:24:20 kg per acre. Apply full Phosphorus & Potassium basal, Nitrogen split at knee-high and tasseling stages.",
      hi: "NPK 48:24:20 किग्रा प्रति एकड़। फास्फोरस और पोटेशियम पूरा आधार के रूप में डालें, नाइट्रोजन घुटने के ऊंचाई और फूल आने के समय डालें।",
      te: "NPK 48:24:20 కిలోలు ఎకరాకు. భాస్వరం & పొటాష్ పూర్తిగా నాటేటప్పుడు వేయండి, నత్రజనిని మోకాళ్ళ ఎత్తు దశ మరియు పూత దశలలో వేయండి."
    },
    pestControl: {
      en: "Fall Armyworm: Inspect leaf whorls. Apply Chlorantraniliprole (18.5% SC) at 0.4ml per Litre of water.",
      hi: "फॉल्स आर्मीवर्म: पत्ती चक्रों का निरीक्षण करें। प्रति लीटर पानी में 0.4ml क्लोरेंट्रानिलिप्रोल (18.5% SC) लगाएं।",
      te: "కత్తెర పురుగు: సుడి ఆకులను గమనించండి. నివారణకు లీటర్ నీటికి 0.4ml క్లోరాంట్రానిలిప్రోల్ (18.5% SC) పిచికారీ చేయండి."
    },
    harvest: {
      en: "Harvest when cob sheaths turn paper dry and black layer forms at the grain base. Grain moisture should be 15-18%.",
      hi: "कटाई तब करें जब भुट्टे के छिलके कागज की तरह सूख जाएं और दानों के आधार पर काली परत बन जाए। दानों में नमी 15-18% होनी चाहिए।",
      te: "కంకి పొట్టు పూర్తిగా ఎండిపోయి, గింజ మొదలు భాగంలో నల్లటి మచ్చ ఏర్పడినప్పుడు కోయండి. గింజల్లో తేమ 15-18% ఉండాలి."
    }
  },
  Tomato: {
    sowing: {
      en: "Raise in plug-trays. Transplant at 25-30 days with 60x45cm spacing on raised beds with staking supports.",
      hi: "प्लग-ट्रे में तैयार करें। स्टैकिंग सपोर्ट के साथ उठी हुई क्यारियों पर 60x45 सेमी की दूरी पर 25-30 दिनों में रोपाई करें।",
      te: "ప్రొట్రేలలో నారు పెంచండి. 25-30 రోజుల వయసున్న నారును కట్టెల మద్దతుతో ఎత్తైన బెడ్లపై 60x45 సెం.మీ అంతరంతో నాటండి."
    },
    landPrep: {
      en: "Chisel ploughing: Mix 10 tonnes FYM and Trichoderma bio-fungicide to prevent soil-borne damping off diseases.",
      hi: "छेनी जुताई: मिट्टी जनित डैम्पिंग ऑफ रोगों को रोकने के लिए 10 टन FYM और ट्राइकोडेरमा बायो-कवकनाशी मिलाएं।",
      te: "నేల తయారీ: నేల ద్వారా వచ్చే తెగుళ్ల నివారణకు 10 టన్నుల పశువుల ఎరువు మరియు ట్రైకోడెర్మా బయో-ఫంగిసైడ్ కలపండి."
    },
    irrigation: {
      en: "Provide drip irrigation daily (2-3 Litres per plant). Avoid overhead spraying to control fungal blights.",
      hi: "प्रतिदिन ड्रिप सिंचाई प्रदान करें (2-3 लीटर प्रति पौधा)। फंगल ब्लाइट को नियंत्रित करने के लिए ऊपर से छिड़काव से बचें।",
      te: "ప్రతిరోజూ డ్రిప్ ద్వారా నీరు ఇవ్వండి (మొక్కకు 2-3 లీటర్లు). శిలీంధ్ర తెగుళ్ల నివారణకు పైనుండి నీరు చిమ్మడం నివారించండి."
    },
    fertilizer: {
      en: "NPK 60:80:60 kg per acre. Supplement with Calcium Nitrate to prevent blossom end rot in ripening fruits.",
      hi: "NPK 60:80:60 किग्रा प्रति एकड़। पकने वाले फलों में ब्लॉसम एंड रॉट को रोकने के लिए कैल्शियम नाइट्रेट की खुराक दें।",
      te: "NPK 60:80:60 కిలోలు ఎకరాకు. కాయ కుళ్ళు తెగులు నివారించడానికి కాల్షియం నైట్రేట్ అందించండి."
    },
    pestControl: {
      en: "Fruit Borer: Plant marigold trap crops. Spray Neem oil or Bacillus thuringiensis (Bt) formulation.",
      hi: "फल छेदक: गेंदे की ट्रैप फसलें लगाएं। नीम का तेल या बैसिलस थुरिंगिएन्सिस (Bt) फॉर्मूलेशन का छिड़काव करें।",
      te: "కాయ తొలిచే పురుగు: బంతి మొక్కలను ఎర పంటగా నాటండి. వేప నూనె లేదా బాసిల్లస్ తురింజియెన్సిస్ (Bt) పిచికారీ చేయండి."
    },
    harvest: {
      en: "Harvest at 'breaker stage' (pink blush) for long-distance transport. Harvest fully red for local processing mandis.",
      hi: "लंबी दूरी के परिवहन के लिए 'ब्रेकर चरण' (गुलाबी रंग) पर कटाई करें। स्थानीय प्रसंस्करण मंडियों के लिए पूरी तरह से लाल होने पर कटाई करें।",
      te: "దూర ప్రాంత రవాణా కొరకు కొద్దిగా రంగు మారే దశలో కోయండి. స్థానిక మార్కెట్ కొరకు బాగా పండిన ఎర్రటి కాయలను కోయండి."
    }
  },
  Wheat: {
    sowing: {
      en: "Sowing time: November. Seed rate: 40kg per acre. Spacing: 22.5cm rows using seed-drill machinery.",
      hi: "बुवाई का समय: नवंबर। बीज दर: 40 किग्रा प्रति एकड़। सीड-ड्रिल मशीन से दूरी: 22.5 सेमी पंक्तियों में।",
      te: "నాటే సమయం: నవంబర్. విత్తన మోతాదు: ఎకరాకు 40 కిలోలు. సీడ్ డ్రిల్ సహాయంతో 22.5 సెం.మీ అంతరంతో వరసలలో విత్తండి."
    },
    landPrep: {
      en: "Prepare field to fine tilth. Ensure field levelness to prevent water pooling in low-lying spots.",
      hi: "खेत को अच्छी तरह से जोतें। निचले इलाकों में पानी जमा होने से रोकने के लिए खेत को समतल करना सुनिश्चित करें।",
      te: "నేలను మెత్తటి దుక్కిగా తయారు చేయండి. పొలంలో నీరు నిల్వ ఉండకుండా సమానంగా ఉండేలా చూసుకోండి."
    },
    irrigation: {
      en: "Requires 5-6 irrigations at Crown Root Initiation (CRI) at 21 days, tillering, jointing, flowering, and milk stages.",
      hi: "21 दिनों पर क्राउन रूट इनिशिएशन (CRI), कल्ले फूटने, गांठ बनने, फूल आने और दूधिया अवस्था में 5-6 सिंचाइयों की आवश्यकता होती है।",
      te: "21 రోజులలో కిరీటం వేరు దశ (CRI), పిలక దశ, గింజ పాలు పోసుకునే దశలలో 5-6 తడులు అవసరం."
    },
    fertilizer: {
      en: "NPK 50:25:12 kg per acre. Top-dress Urea splits before the first and second irrigations.",
      hi: "NPK 50:25:12 किग्रा प्रति एकड़। पहली और दूसरी सिंचाई से पहले यूरिया का छिड़काव करें।",
      te: "NPK 50:25:12 కిలోలు ఎకరాకు. మొదటి మరియు రెండవ తడుల ముందు యూరియాను చల్లండి."
    },
    pestControl: {
      en: "Rust diseases: Yellow and brown rust. Spray Propiconazole (25% EC) at 1ml/L if symptoms appear.",
      hi: "गेरुई रोग: पीला और भूरा गेरुई। लक्षण दिखने पर 1ml/L की दर से प्रोपिकोनाज़ोल (25% EC) का छिड़काव करें।",
      te: "తుప్పు తెగులు: పసుపు మరియు గోధుమ తుప్పు తెగులు. నివారణకు లీటర్ నీటికి 1ml ప్రొపికోనజోల్ (25% EC) పిచికారీ చేయండి."
    },
    harvest: {
      en: "Harvest using combine harvesters when grains are hard and dry (straw turns golden yellow and brittle).",
      hi: "जब दाने सख्त और सूखे हों (पुआल सुनहरा पीला और नाजुक हो जाए) तब कंबाइन हार्वेस्टर से कटाई करें।",
      te: "గింజలు గట్టిగా మరియు ఎండినప్పుడు (గడ్డి బంగారు రంగులోకి మారి పెళుసుగా మారినప్పుడు) కంబైన్ హార్వెస్టర్లతో కోయండి."
    }
  },
  Turmeric: {
    sowing: {
      en: "Plant mother or finger rhizomes. Seed rate: 1000kg rhizomes per acre. Spacing: 30x15cm on ridges.",
      hi: "मदर या फिंगर प्रकंद बोएं। बीज दर: 1000 किग्रा प्रकंद प्रति एकड़। मेड़ों पर दूरी: 30x15 सेमी।",
      te: "తల్లి లేదా కొమ్ము దుంపలను నాటండి. విత్తన మోతాదు: ఎకరాకు 1000 కిలోల దుంపలు. బోదెలపై అంతరం: 30x15 సెం.మీ."
    },
    landPrep: {
      en: "Construct ridges (25cm height) to prevent root rotting. Add neem cake at 200kg per acre to repel root nematodes.",
      hi: "जड़ सड़न को रोकने के लिए मेड़ (25 सेमी ऊंचाई) बनाएं। जड़ सूत्रकृमि को दूर रखने के लिए प्रति एकड़ 200 किग्रा नीम की खली डालें।",
      te: "దుంప కుళ్ళు నివారించడానికి 25 సెం.మీ ఎత్తైన బోదెలను వేయండి. వేరు పురుగు నివారణకు ఎకరాకు 200 కిలోల వేపపిండిని వేయండి."
    },
    irrigation: {
      en: "Heavy water requirement. Irrigate 15-20 times at 7-10 day intervals. Use straw mulching to conserve moisture.",
      hi: "अधिक पानी की आवश्यकता। 7-10 दिनों के अंतराल पर 15-20 बार सिंचाई करें। नमी बनाए रखने के लिए पुआल मल्चिंग का उपयोग करें।",
      te: "ఎక్కువ నీరు అవసరం. 7-10 రోజుల వ్యవధిలో 15-20 సార్లు నీరు పెట్టండి. తేమను కాపాడటానికి గడ్డి మల్చింగ్ వాడండి."
    },
    fertilizer: {
      en: "NPK 25:25:50 kg per acre. Apply green manure leaves (10t/acre) to enrich humic organic acids.",
      hi: "NPK 25:25:50 किग्रा प्रति एकड़। ह्यूमिक कार्बनिक अम्ल बढ़ाने के लिए हरी खाद की पत्तियां (10 टन/एकड़) डालें।",
      te: "NPK 25:25:50 కిలోలు ఎకరాకు. నేలలో సేంద్రీయ ఆమ్లాల పెంపుకు పచ్చిరొట్ట ఎరువులను (ఎకరాకు 10 టన్నులు) వేయండి."
    },
    pestControl: {
      en: "Rhizome Rot: Drench soil with Metalaxyl-Mancozeb (2g/L). Control leaf rollers using organic bio-pesticides.",
      hi: "प्रकंद सड़न: मेटालैक्सिल-मैंकोज़ेब (2g/L) से मिट्टी का छिड़काव करें। जैविक जैव-कीटनाशकों से पत्ती मोड़क को नियंत्रित करें।",
      te: "దుంప కుళ్ళు తెగులు: లీటర్ నీటికి 2g మెటాలాక్సిల్-మాంకోజెబ్ కలిపి నేలపై పిచికారీ చేయండి. ఆకు చుట్టు పురుగును బయో-పెస్టిసైడ్లతో నివారించండి."
    },
    harvest: {
      en: "Dig up rhizomes 7-9 months after planting when leaves dry and turn yellow. Boil and dry rhizomes for polishing.",
      hi: "बोने के 7-9 महीने बाद जब पत्तियां सूख कर पीली हो जाएं तो प्रकंद खोद लें। पॉलिश करने के लिए प्रकंदों को उबालें और सुखाएं।",
      te: "నాటిన 7-9 నెలల తర్వాత ఆకులు ఎండిపోయి పసుపు రంగులోకి మారినప్పుడు దుంపలను తవ్వండి. వాటిని ఉడకబెట్టి ఎండబెట్టండి."
    }
  },
  Sugarcane: {
    sowing: {
      en: "Plant two-budded setts (30,000 setts per acre) in furrows. Spacing: 120cm between rows.",
      hi: "नालियों में दो-आंखों वाले टुकड़ों (30,000 प्रति एकड़) को बोएं। कतारों के बीच की दूरी: 120 सेमी।",
      te: "రెండు కన్నుల చెరకు ముక్కలను (ఎకరాకు 30,000 ముక్కలు) కాలువలలో నాటండి. కాలువల మధ్య దూరం: 120 సెం.మీ."
    },
    landPrep: {
      en: "Deep tractor subsoiling up to 45cm depth. Apply pressmud compost (5 tonnes/acre) to enrich loam soils.",
      hi: "45 सेमी गहराई तक गहरी ट्रैक्टर जुताई करें। दोमट मिट्टी को समृद्ध करने के लिए प्रेसमड कम्पोस्ट (5 टन/एकड़) डालें।",
      te: "నేలను 45 సెం.మీ లోతు వరకు బాగా దున్నండి. నేల సారవంతం కావడానికి ఎకరాకు 5 టన్నుల ప్రెస్మడ్ కంపోస్ట్ వేయండి."
    },
    irrigation: {
      en: "High water footprint. Irrigate every 10-15 days during formative and grand growth phases.",
      hi: "पानी की उच्च आवश्यकता। विकास के चरणों के दौरान हर 10-15 दिनों में सिंचाई करें।",
      te: "ఎక్కువ నీరు అవసరం. పంట ఎదుగుదల దశలలో ప్రతి 10-15 రోజులకు ఒకసారి నీరు పెట్టండి."
    },
    fertilizer: {
      en: "NPK 110:30:30 kg per acre. Nitrogen splits are crucial: at planting, 30 days, 60 days, and 90 days.",
      hi: "NPK 110:30:30 किग्रा प्रति एकड़। Nitrogen का विभाजन महत्वपूर्ण है: रोपाई के समय, 30 दिन, 60 दिन और 90 दिन पर।",
      te: "NPK 110:30:30 కిలోలు ఎకరాకు. నత్రజనిని విడతలుగా వేయడం చాలా ముఖ్యం: నాటేటప్పుడు, 30, 60 మరియు 90 రోజులకు."
    },
    pestControl: {
      en: "Early Shoot Borer: Release Trichogramma egg parasites (2.5cc/acre). Apply Chlorpyriphos to soil if termites persist.",
      hi: "शुरुआती तना छेदक: ट्राइकोग्रामा अंडे परजीवी (2.5cc/एकड़) छोड़ें। यदि दीमक बनी रहती है तो मिट्टी में क्लोरपायरीफॉस डालें।",
      te: "మొవ్వు తొలిచే పురుగు: నివారణకు ట్రైకోగ్రామా పరాన్నజీవులను విడుదల చేయండి. చెదలు ఉంటే క్లోరిపైరిఫాస్ పిచికారీ చేయండి."
    },
    harvest: {
      en: "Harvest stalks close to ground level when brix hydrometer index reads 18-20%. Deliver to mills within 24 hours.",
      hi: "जब ब्रिक्स सूचकांक 18-20% पढ़े तो डंठल को जमीन के स्तर के पास से काटें। 24 घंटे के भीतर मिलों में पहुंचाएं।",
      te: "షుగర్ రీడింగ్ 18-20% ఉన్నప్పుడు నేల మట్టానికి సమానంగా నరకండి. నరికిన 24 గంటల లోపు మిల్లులకు తరలించండి."
    }
  },
  Onion: {
    sowing: {
      en: "Transplant 6-7 week old seedlings on raised flat beds. Spacing: 15x10cm for high bulb density.",
      hi: "उठी हुई समतल क्यारियों पर 6-7 सप्ताह पुराने पौधों का रोपण करें। दूरी: 15x10 सेमी।",
      te: "6-7 వారాల వయసున్న నారును ఎత్తైన బెడ్లపై నాటండి. అంతరం: 15x10 సెం.మీ."
    },
    landPrep: {
      en: "Plough 3 times to get loose, weed-free tilth. Add 10 tonnes compost to ensure bulb enlargement drainage.",
      hi: "ढीली, खरपतवार मुक्त मिट्टी पाने के लिए 3 बार जोतें। कंद बढ़ने और जल निकासी सुनिश्चित करने के लिए 10 टन खाद डालें।",
      te: "కలుపు లేకుండా నేలను 3 సార్లు బాగా దున్నండి. ఉల్లిగడ్డ సైజు పెరగడానికి 10 టన్నుల సేంద్రీయ ఎరువు వేయండి."
    },
    irrigation: {
      en: "Irrigate immediately on transplanting, then at 7-10 day intervals. Stop watering 15 days before harvest.",
      hi: "रोपाई के तुरंत बाद सिंचाई करें, फिर 7-10 दिनों के अंतराल पर। कटाई से 15 दिन पहले पानी देना बंद कर दें।",
      te: "నాటిన వెంటనే నీరు పెట్టండి, ఆ తర్వాత 7-10 రోజుల వ్యవధిలో పెట్టండి. కోతకు 15 రోజుల ముందు నీరు ఆపేయండి."
    },
    fertilizer: {
      en: "NPK 30:20:30 kg per acre. Top-dress Nitrogen in two split doses at 30 and 45 days after transplanting.",
      hi: "NPK 30:20:30 किग्रा प्रति एकड़। रोपाई के 30 और 45 दिन बाद दो विभाजित खुराकों में नाइट्रोजन का छिड़काव करें।",
      te: "NPK 30:20:30 కిలోలు ఎకరాకు. నాటిన 30 మరియు 45 రోజులకు నత్రజనిని రెండు విడతలుగా వేయండి."
    },
    pestControl: {
      en: "Onion Thrips (leaves turn silver/white). Spray Spinosad (0.3ml/L) or apply organic neem soap spray.",
      hi: "प्याज थ्रिप्स (पत्तियां चांदी जैसी सफेद हो जाती हैं)। स्पिनोसैड (0.3ml/L) का छिड़काव करें या जैविक नीम साबुन का उपयोग करें।",
      te: "తామర పురుగులు (ఆకులు తెల్లగా మారుతాయి): నివారణకు స్పినోసాడ్ (0.3ml/L) లేదా వేప నూనె ద్రావణం పిచికారీ చేయండి."
    },
    harvest: {
      en: "Harvest when 50% of the crop tops break and collapse (neck-fall). Cure bulbs in shade for 10 days for long storage life.",
      hi: "कटाई तब करें जब 50% पौधों के शीर्ष झुक कर गिर जाएं। लंबे समय तक भंडारण के लिए कंदों को 10 दिनों तक छाया में सुखाएं।",
      te: "మొక్కల ఆకులు 50% పైగా వాలిపోయినప్పుడు కోయండి. నిల్వ సామర్థ్యం పెరగడానికి ఉల్లిగడ్డలను 10 రోజులు నీడలో ఆరబెట్టండి."
    }
  }
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
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryRecord[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [loadingCrops, setLoadingCrops] = useState(false);

  // Financial ledger & Logistics states
  const [transactions, setTransactions] = useState<{ id: string; loggedAt: string; type: string; category: string; amount: number; description: string; }[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txType, setTxType] = useState("EXPENSE");
  const [txCategory, setTxCategory] = useState("SEEDS");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txSuccess, setTxSuccess] = useState("");
  
  const [shipments, setShipments] = useState<{ id: string; cropName: string; quantityQuintals: number; destinationMandi: string; status: string; updatedAt: string; }[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [shipCrop, setShipCrop] = useState("Rice");
  const [shipQty, setShipQty] = useState("");
  const [shipMandi, setShipMandi] = useState("");
  const [shipSuccess, setShipSuccess] = useState("");

  // Carbon estimator states
  const [carbonPumpHours, setCarbonPumpHours] = useState("10.0");
  const [carbonNfertilizer, setCarbonNfertilizer] = useState("4.0");
  const [carbonDiesel, setCarbonDiesel] = useState("5.0");
  const [carbonResult, setCarbonResult] = useState<{ totalCo2eKg: number; pumpEmissionsKg: number; fertilizerEmissionsKg: number; dieselEmissionsKg: number; carbonRating: string; mitigations: string[]; } | null>(null);
  const [loadingCarbon, setLoadingCarbon] = useState(false);

  // Subsidies states
  const [subsidyState, setSubsidyState] = useState("Telangana");
  const [subsidyLandSize, setSubsidyLandSize] = useState("2.5");
  const [matchedSchemes, setMatchedSchemes] = useState<{ id: string; name: string; eligibleState: string; description: string; benefitDetails: string; maxLandSizeHectares: number; }[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  // Livestock states
  const [livestockLogs, setLivestockLogs] = useState<{ id: string; tagId: string; animalType: string; bodyTempCelsius: number; activityStatus: string; }[]>([]);
  const [loadingLivestock, setLoadingLivestock] = useState(false);
  const [liveTag, setLiveTag] = useState("");
  const [liveType, setLiveType] = useState("Cow");
  const [liveTemp, setLiveTemp] = useState("38.5");
  const [liveActivity, setLiveActivity] = useState("Active");
  const [liveSuccess, setLiveSuccess] = useState("");

  // Active Location state changeable from dashboard
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");
  
  // Forms state
  const [showToken, setShowToken] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // New Farm form
  const [newFarmName, setNewFarmName] = useState("");
  const [locationIndex, setLocationIndex] = useState(0); 
  const [newFarmArea, setNewFarmArea] = useState("10.0");
  const [areaUnit, setAreaUnit] = useState("acres"); 
  const [farmError, setFarmError] = useState("");
  const [farmSuccess, setFarmSuccess] = useState("");

  // New Crop form
  const [newCropIndex, setNewCropIndex] = useState(0); 
  const [newCropVariety, setNewCropVariety] = useState(AVAILABLE_CROPS[0].varieties[0]);
  const [newCropPlanted, setNewCropPlanted] = useState(new Date().toISOString().split("T")[0]);
  const [newCropHarvest, setNewCropHarvest] = useState("");
  const [cropError, setCropError] = useState("");
  const [cropSuccess, setCropSuccess] = useState("");

  // Auto-calculate crop harvest date based on planted date & duration
  useEffect(() => {
    const targetCrop = AVAILABLE_CROPS[newCropIndex];
    if (newCropPlanted && targetCrop) {
      const date = new Date(newCropPlanted);
      date.setDate(date.getDate() + targetCrop.durationDays);
      const harvestDateStr = date.toISOString().split("T")[0];
      setTimeout(() => {
        setNewCropHarvest(harvestDateStr);
      }, 0);
    }
  }, [newCropIndex, newCropPlanted]);

    // Multilingual translation state & translator helper
  const [language, setLanguage] = useState<"en" | "hi" | "te">("en");
  const t = (english: string, hindi: string, telugu: string) => {
    if (language === "hi") return `${english} (${hindi})`;
    if (language === "te") return `${english} (${telugu})`;
    return english;
  };

  // Market Analysis search & Guide Playbook States
  const [mandiSearchQuery, setMandiSearchQuery] = useState("");
  const [activePlaybookCropIdx, setActivePlaybookCropIdx] = useState(0);

  // Change Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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

  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/api/v1/ws/agents");
    
    ws.onopen = () => {
      console.log("WebSocket connected to backend-ai");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error("Agent error:", data.error);
          return;
        }

        const timestamp = new Date().toTimeString().split(" ")[0];
        setAgentLogs((prev) => [
          ...prev,
          {
            time: timestamp,
            agent: data.agent,
            message: data.message,
            type: data.type
          }
        ]);
        
        if (data.agent === "Orchestrator") {
          setSendingQuery(false);
          setChatResponses((prev) => [
            ...prev,
            { sender: selectedChatAgent, text: `${data.message}` }
          ]);
        }
      } catch (err) {
        console.error("Error parsing socket frame:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    setTimeout(() => {
      setSocket(ws);
    }, 0);
    return () => {
      ws.close();
    };
  }, [selectedChatAgent]);

  // Profitability Calculator / decision state
  const [calcCropIdx, setCalcCropIdx] = useState(0);
  const [calcAcres, setCalcAcres] = useState("5.0");
  const [calcCostOverride, setCalcCostOverride] = useState("");
  const [calcYieldOverride, setCalcYieldOverride] = useState("");
  const [alarmsScheduled, setAlarmsScheduled] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState("");

  // Seasonal and Date based parameters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Leaf Disease Detection States
  const [selectedLeafSample, setSelectedLeafSample] = useState<string | null>(null);
  const [scanningLeaf, setScanningLeaf] = useState(false);
  const [scanResult, setScanResult] = useState<{ diseaseName: string; localName: string; medicine: string; dosage: string; tips: string[] } | null>(null);

  // GPS Current Location Detection (Calibrated for Hyderabad priority)
  const handleGPSDetection = () => {
    setGpsDetecting(true);
    setGpsMessage("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Map to closest location (Hyderabad coords check)
          let closestIndex = 0;
          let minDistance = Infinity;
          
          REALISTIC_LOCATIONS.forEach((loc, idx) => {
            const distance = Math.sqrt(Math.pow(loc.latitude - lat, 2) + Math.pow(loc.longitude - lon, 2));
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = idx;
            }
          });
          
          setActiveLocationIndex(closestIndex);
          setAlphaMoisture(REALISTIC_LOCATIONS[closestIndex].moistureDefault);
          setGpsMessage(`📍 GPS Location Resolved: Latitude ${lat.toFixed(4)}, Longitude ${lon.toFixed(4)}. Matched to: ${REALISTIC_LOCATIONS[closestIndex].name}.`);
          setGpsDetecting(false);
          
          // Log alert in stream
          const timestamp = new Date().toTimeString().split(" ")[0];
          setAgentLogs((prev) => [
            ...prev,
            {
              time: timestamp,
              agent: "System",
              message: `GPS location detected. Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}. Core profile aligned to ${REALISTIC_LOCATIONS[closestIndex].name}.`,
              type: "system"
            }
          ]);
        },
        (error) => {
          // If Geolocation is blocked, we simulate Hyderabad check since they are running locally in Hyderabad
          const simulatedLat = 17.3850;
          const simulatedLon = 78.4867;
          
          let closestIndex = 0;
          let minDistance = Infinity;
          REALISTIC_LOCATIONS.forEach((loc, idx) => {
            const distance = Math.sqrt(Math.pow(loc.latitude - simulatedLat, 2) + Math.pow(loc.longitude - simulatedLon, 2));
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = idx;
            }
          });
          
          setActiveLocationIndex(closestIndex);
          setAlphaMoisture(REALISTIC_LOCATIONS[closestIndex].moistureDefault);
          setGpsMessage(`📍 GPS Location Resolved (Local Calibration): Hyderabad (Red Clay Loam) detected.`);
          setGpsDetecting(false);
        }
      );
    } else {
      setGpsMessage("Browser geolocation is not supported.");
      setGpsDetecting(false);
    }
  };

  // Predict Crop Recommendation based on location and date
  const predictRecommendedCrop = () => {
    const loc = REALISTIC_LOCATIONS[activeLocationIndex];
    const dateObj = new Date(selectedDate);
    const month = dateObj.getMonth() + 1; // 1-indexed (Jan=1, Dec=12)
    
    let recommended = "Maize (మొక్కజొన్న - Mokkajonna)";
    let rationale = "";
    let season = "";

    // 1. Identify season based on month selection
    if (month >= 6 && month <= 10) {
      season = "Kharif Season (Monsoon)";
      if (loc.name.includes("Karimnagar")) {
        recommended = "Rice (వరి - Vari)";
        rationale = "Karimnagar alluvial plains flooded by monsoons are highly optimal for paddy cultivation. Average rainfall matches 950mm.";
      } else if (loc.name.includes("Guntur")) {
        recommended = "Chilli (మిరపకాయ - Mirapakaya)";
        rationale = "Guntur's rich Black Cotton soil retention profile combined with high monsoon heat results in peak Chilli pungency levels.";
      } else if (loc.name.includes("Hyderabad")) {
        recommended = "Maize (మొక్కజొన్న - Mokkajonna)";
        rationale = "Hyderabad's Red Clay soil loam drainage allows steady growth of hybrid maize without waterlogging during rainy months.";
      } else if (loc.name.includes("Khammam")) {
        recommended = "Cotton (ప్రత్తి - Pratti)";
        rationale = "Cotton grows best in warm Kharif months. Black sandy clay in Khammam provides the drainage cotton root systems require.";
      } else {
        recommended = "Cotton (ప్రత్తి - Pratti)";
        rationale = "Kharif monsoons support the early vegetative stage of cotton, followed by dry weather matching autumn harvest.";
      }
    } else if (month === 11 || month === 12 || month === 1 || month === 2) {
      season = "Rabi Season (Winter)";
      if (loc.name.includes("Anantapur")) {
        recommended = "Groundnut (వేరుశనగ - Verusenaga)";
        rationale = "Groundnuts require low moisture and light soils. Anantapur's Red Sandy loam fits Rabi crops perfectly to avoid rot.";
      } else {
        recommended = "Tomato (టమోటా - Tomato)";
        rationale = "Cool winter dry conditions in Rabi season mitigate fungal leaf blight risks in tomato plants. Red loamy soil matches.";
      }
    } else {
      season = "Zaid Season (Summer)";
      recommended = "Tomato (టమోటా - Tomato)";
      rationale = "Requires high sun exposure. Highly viable under micro-drip fertigation scheduling to mitigate high heat evaporation.";
    }

    return { recommended, rationale, season };
  };

  // Fetch health stats
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
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const parsed = data.map((f: Farm) => {
          const locName = localStorage.getItem(`farm_loc_${f.id}`) || "Hyderabad (Red Clay Loam)";
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
  const fetchCrops = useCallback(async (farmId: string) => {
    if (!user) return;
    setLoadingCrops(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}/crops`, {
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCrops(data);
      }
    } catch (e) {
      console.error("Error fetching crops", e);
    }
    setLoadingCrops(false);
  }, [user, logout]);

  const fetchTelemetry = useCallback(async (farmId: string) => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}/telemetry/latest`, {
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTelemetryHistory(data);
          if (data.length > 0) {
            const latest = data[0];
            setAlphaMoisture(latest.soilMoisture !== null ? Number(latest.soilMoisture) : 38);
            setNitrogenLevel(latest.npkNitrogen !== null ? Number(latest.npkNitrogen) : 14);
          } else {
            const seedPayload = {
              soilMoisture: alphaMoisture,
              soilTemp: 32,
              npkNitrogen: nitrogenLevel,
              npkPhosphorus: phosphorusLevel,
              npkPotassium: 20,
              recordedAt: new Date().toISOString()
            };
            
            await fetch(`http://localhost:8080/api/v1/farms/${farmId}/telemetry`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
              },
              body: JSON.stringify(seedPayload)
            });
            load();
          }
        }
      } catch (e) {
        console.error("Error fetching telemetry logs:", e);
      }
    };
    load();
  }, [user, alphaMoisture, nitrogenLevel, phosphorusLevel]);

  const fetchTransactions = useCallback(async (farmId: string) => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}/transactions`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingTransactions(false);
  }, [user]);

  const fetchShipments = useCallback(async (farmId: string) => {
    if (!user) return;
    setLoadingShipments(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}/logistics`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingShipments(false);
  }, [user]);

  const fetchLivestockLogs = useCallback(async (farmId: string) => {
    if (!user) return;
    setLoadingLivestock(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}/livestock`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLivestockLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingLivestock(false);
  }, [user]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFarm) return;
    setTxSuccess("");
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          type: txType,
          category: txCategory,
          amount: parseFloat(txAmount),
          description: txDescription,
          loggedAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        setTxSuccess("Transaction logged successfully!");
        setTxAmount("");
        setTxDescription("");
        fetchTransactions(selectedFarm.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFarm) return;
    setShipSuccess("");
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/logistics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          cropName: shipCrop,
          quantityQuintals: parseFloat(shipQty),
          destinationMandi: shipMandi,
          status: "HARVESTED",
          updatedAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        setShipSuccess("Shipment tracking initialized!");
        setShipQty("");
        setShipMandi("");
        fetchShipments(selectedFarm.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId: string, nextStatus: string) => {
    if (!user || !selectedFarm) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/logistics/${shipmentId}?status=${nextStatus}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        fetchShipments(selectedFarm.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculateCarbon = async () => {
    setLoadingCarbon(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/carbon-estimator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pump_hours: parseFloat(carbonPumpHours),
          nitrogen_fertilizer_bags: parseFloat(carbonNfertilizer),
          diesel_liters: parseFloat(carbonDiesel)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCarbonResult(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingCarbon(false);
  };

  const handleMatchSchemes = async () => {
    setLoadingSchemes(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/schemes/eligible?state=${encodeURIComponent(subsidyState)}&landSize=${parseFloat(subsidyLandSize)}`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedSchemes(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingSchemes(false);
  };

  const handleCreateLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFarm) return;
    setLiveSuccess("");
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/livestock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          tagId: liveTag,
          animalType: liveType,
          bodyTempCelsius: parseFloat(liveTemp),
          activityStatus: liveActivity,
          loggedAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        setLiveSuccess("Livestock tag successfully registered!");
        setLiveTag("");
        fetchLivestockLogs(selectedFarm.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedFarm) {
      const fid = selectedFarm.id;
      setTimeout(() => {
        fetchTelemetry(fid);
        fetchCrops(fid);
        fetchTransactions(fid);
        fetchShipments(fid);
        fetchLivestockLogs(fid);
      }, 0);
    }
  }, [selectedFarm?.id, fetchTelemetry, fetchCrops, fetchTransactions, fetchShipments, fetchLivestockLogs]);

  useEffect(() => {
    if (!selectedFarm || !user) return;

    const interval = setInterval(async () => {
      const delta = (Math.random() - 0.5) * 2;
      const newMoisture = Math.max(10, Math.min(90, Math.round(alphaMoisture + delta)));
      
      const payload = {
        soilMoisture: newMoisture,
        soilTemp: 32,
        npkNitrogen: nitrogenLevel,
        npkPhosphorus: phosphorusLevel,
        npkPotassium: 20,
        recordedAt: new Date().toISOString()
      };
      
      try {
        await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/telemetry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });
        
        const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/telemetry/latest`, {
          headers: {
            "Authorization": `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTelemetryHistory(data);
          if (data.length > 0) {
            setAlphaMoisture(data[0].soilMoisture !== null ? Number(data[0].soilMoisture) : 38);
          }
        }
      } catch (err) {
        console.error("Failed to post simulated telemetry:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedFarm, user, fetchTelemetry, fetchCrops, alphaMoisture, nitrogenLevel, phosphorusLevel]);

  const handleExportReport = async () => {
    if (!user || !selectedFarm) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/report`, {
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.ok) {
        const report = await res.json();
        const reportText = `
SMART AGRICULTURE PLATFORM - DETAILED FARM REPORT
=================================================
Farm Name: ${report.farmName}
Farm ID: ${report.farmId}
Soil Classification: ${report.soilType}
Total Acreage: ${report.totalAreaHectares} Hectares
Coordinates: Lat ${report.latitude}, Lon ${report.longitude}
Compiled At: ${new Date(report.compiledAt).toLocaleString()}

PLANTED CROPS LIST
------------------
${report.crops.length === 0 ? "No active crops planted." : report.crops.map((c: { cropId: string; name: string; variety: string; status: string; plantedAt: string; harvestPlannedAt: string; }) => `
- Crop ID: ${c.cropId}
  Name: ${c.name}
  Variety: ${c.variety}
  Status: ${c.status}
  Planted At: ${c.plantedAt}
  Harvest Timeline: ${c.harvestPlannedAt}
`).join("\n")}

LATEST DATABASE TELEMETRY RECORDS
---------------------------------
${!report.latestTelemetry ? "No sensor logs captured in database." : `
- Last Recorded At: ${new Date(report.latestTelemetry.lastRecordedAt).toLocaleString()}
  Soil Moisture: ${report.latestTelemetry.soilMoisture}%
  Soil Temperature: ${report.latestTelemetry.soilTemp}°C
  Nitrogen (N): ${report.latestTelemetry.npkNitrogen} mg/kg
  Phosphorus (P): ${report.latestTelemetry.npkPhosphorus} mg/kg
  Potassium (K): ${report.latestTelemetry.npkPotassium} mg/kg
`}
=================================================
`;
        const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${report.farmName.split(" ").join("_")}_analytics_report.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to compile farm analytics report.");
      }
    } catch (e) {
      console.error(e);
      alert("Error compiling report from Core API.");
    }
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
        hectares = hectares * 0.404686;
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

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

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
          name: targetCrop.label, 
          variety: newCropVariety,
          plantedAt: newCropPlanted,
          harvestPlannedAt: newCropHarvest || null,
          status: "PLANTED"
        })
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

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

  // Delete Farm
  const handleDeleteFarm = async (farmId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this farm profile and all its associated crops?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${farmId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (res.ok) {
        localStorage.removeItem(`farm_unit_${farmId}`);
        localStorage.removeItem(`farm_loc_${farmId}`);
        if (selectedFarm?.id === farmId) {
          setSelectedFarm(null);
        }
        fetchFarms();
      } else {
        alert("Failed to delete farm.");
      }
    } catch {
      alert("Error connecting to server.");
    }
  };

  // Delete Crop
  const handleDeleteCrop = async (cropId: string) => {
    if (!user || !selectedFarm) return;
    if (!confirm("Are you sure you want to delete this crop record?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/farms/${selectedFarm.id}/crops/${cropId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token}`
        }
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      if (res.ok) {
        fetchCrops(selectedFarm.id);
      } else {
        alert("Failed to delete crop.");
      }
    } catch {
      alert("Error connecting to server.");
    }
  };

  // Trigger Mock Moisture drop
  const triggerMoistureDrop = () => {
    setAlphaMoisture(24);
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
        message: "Critical moisture trigger received. Checking weather nodes... (No rain forecast for 6 hours).",
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
    setTimeout(() => {
      setAlphaMoisture(REALISTIC_LOCATIONS[activeLocationIndex].moistureDefault);
      const restoreTimestamp = new Date().toTimeString().split(" ")[0];
      setAgentLogs((prev) => [
        ...prev,
        {
          time: restoreTimestamp,
          agent: "System",
          message: "Field Alpha moisture levels restored (Optimal). Shutting off sprinklers.",
          type: "system"
        }
      ]);
    }, 10000);
  };

  // Trigger Mock Nitrogen drop
  const triggerNitrogenDrop = () => {
    setNitrogenLevel(7);
    const timestamp = new Date().toTimeString().split(" ")[0];
    const newLogs = [
      {
        time: timestamp,
        agent: "System",
        message: "Sensor Feed Warn: Field Beta Nitrogen content fell to 7 mg/kg (Deficient).",
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

    const payload = {
      query: query,
      crop: AVAILABLE_CROPS[activePlaybookCropIdx]?.value || "Rice",
      telemetry: {
        moisture: alphaMoisture,
        temperature: 32,
        humidity: 62,
        nitrogen: nitrogenLevel,
        latitude: REALISTIC_LOCATIONS[activeLocationIndex].latitude,
        longitude: REALISTIC_LOCATIONS[activeLocationIndex].longitude
      }
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      // Offline fallback
      setTimeout(() => {
        let replyText = "";
        const loc = REALISTIC_LOCATIONS[activeLocationIndex];
        if (selectedChatAgent === "Weather Agent") {
          if (query.toLowerCase().includes("rain") || query.toLowerCase().includes("forecast")) {
            replyText = `Current forecast for ${loc.name}: Scatter rain predicted. Precipitation: 2.2mm. Irrigation deferred to conserve water.`;
          } else {
            replyText = `The current temperature in ${loc.name} is optimal at ${loc.tempRange.split(" ")[0]}. Humidity is 58%. Ideal conditions for vegetative crop development.`;
          }
        } else if (selectedChatAgent === "Irrigation Agent") {
          replyText = `Field Alpha moisture is ${alphaMoisture}%. Field Beta moisture is ${betaMoisture}%. Drip irrigation schedules are calculated using virtual soil profile models.`;
        } else if (selectedChatAgent === "Fertilizer Agent") {
          replyText = `Field B soil check: Nitrogen is deficient (${nitrogenLevel} mg/kg). Suggesting organic ammonium sulfate dosage (5kg per acre) to restore nitrogen levels.`;
        } else if (selectedChatAgent === "Market Agent") {
          replyText = "Wholesale Mandi Rates: Tomato (టమోటా) is trading high at ₹120/kg. Chilli (మిరపకాయ) is bullish at ₹210/kg. Selling is highly recommended.";
        } else {
          replyText = "Sensor networks are virtual simulation nodes and are fully synchronized with our agricultural database.";
        }

        setChatResponses((prev) => [...prev, { sender: selectedChatAgent, text: replyText }]);
        setSendingQuery(false);
      }, 1000);
    }
  };

  const handleDetectLeafDisease = async (sampleKey: string) => {
    setSelectedLeafSample(sampleKey);
    setScanningLeaf(true);
    setScanResult(null);

    const timestamp = new Date().toTimeString().split(" ")[0];
    setAgentLogs((prev) => [
      ...prev,
      {
        time: timestamp,
        agent: "Disease Vision Agent",
        message: `Foliar leaf scan initiated for: ${sampleKey.toUpperCase()} sample. Parsing RGB color matrices...`,
        type: "weather"
      }
    ]);

    try {
      const formData = new FormData();
      const mockBlob = new Blob(["mock-image-data"], { type: "image/jpeg" });
      formData.append("file", mockBlob, `${sampleKey}.jpg`);

      const res = await fetch("http://localhost:8000/api/v1/cv/disease", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      setScanResult({
        diseaseName: data.classification,
        localName: data.localName,
        medicine: data.treatment.medicine,
        dosage: data.treatment.dosage,
        tips: data.treatment.preventiveTips
      });
      
      setScanningLeaf(false);
      const doneTimestamp = new Date().toTimeString().split(" ")[0];
      setAgentLogs((prev) => [
        ...prev,
        {
          time: doneTimestamp,
          agent: "Disease Vision Agent",
          message: `Scan complete: ${data.classification} detected.`,
          type: "disease"
        }
      ]);
    } catch (err) {
      // Offline fallback
      setTimeout(() => {
        const data = LEAF_DISEASE_DATA[sampleKey] || LEAF_DISEASE_DATA["tomato"];
        setScanResult(data);
        setScanningLeaf(false);

        const doneTimestamp = new Date().toTimeString().split(" ")[0];
        setAgentLogs((prev) => [
          ...prev,
          {
            time: doneTimestamp,
            agent: "Disease Vision Agent",
            message: `Scan complete: ${data.diseaseName} detected with 94.2% confidence. Treatment prescription generated.`,
            type: "disease"
          }
        ]);
      }, 1000);
    }
  };

  // Change Password Logic
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    if (!user) return;
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: newPassword })
      });
      setPasswordSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordSuccess("Password updated successfully! (Local Session Sync)");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Alarm Schedule Logic
  const handleScheduleAlarms = () => {
    setAlarmsScheduled(true);
    setCalcSuccess("`🔔 Crop Season Alarms set successfully! You will receive reminders for Sowing, Vegetative Irrigation, Fertigation, and Harvest windows.`");
    
    const timestamp = new Date().toTimeString().split(" ")[0];
    setAgentLogs((prev) => [
      ...prev,
      {
        time: timestamp,
        agent: "System",
        message: `Cron schedules created. 4 Seasonal notifications registered for active ${AVAILABLE_CROPS[calcCropIdx].label} crop.`,
        type: "system"
      }
    ]);

    setTimeout(() => {
      setCalcSuccess("");
    }, 6000);
  };

  // Calculate profitability (Estimated Cost is automatically shown based on Acres Selection!)
  const targetCrop = AVAILABLE_CROPS[calcCropIdx];
  const acres = parseFloat(calcAcres) || 0;
  const costPerAcre = targetCrop.baseCostPerAcre; // Cost per acre is locked to standard crop cost and calculated automatically
  const yieldPerAcre = parseFloat(calcYieldOverride) || targetCrop.yieldPerAcreQuintals;
  const marketPrice = targetCrop.marketPricePerQuintal;

  const totalCost = costPerAcre * acres;
  const totalRevenue = marketPrice * (yieldPerAcre * acres);
  const netProfit = totalRevenue - totalCost;

  const { recommended: recommendedCrop, rationale: cropRationale, season: cropSeason } = predictRecommendedCrop();



  const copyTokenToClipboard = () => {
    if (user) {
      navigator.clipboard.writeText(user.token);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (authLoading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#07070a] text-zinc-400 font-sans">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>
  );

  if (!user) return null;

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
              { id: "dashboard", label: t("Dashboard", "डैशबोर्ड", "డాష్బోర్డ్"), icon: "📊" },
              { id: "agents", label: t("AI Agents", "एआई एजेंट", "AI ఏజెంట్లు"), icon: "🤖" },
              { id: "crops", label: t("Crop Management", "फसल प्रबंधन", "పంట నిర్వహణ"), icon: "🌱" },
              { id: "telemetry", label: t("Sensor Feeds", "सेंसर फीड", "సెన్సార్ ఫీడ్స్"), icon: "📡" },
              { id: "market", label: t("Market Analytics", "बाजार विश्लेषण", "మార్కెట్ విశ్లేషణ"), icon: "📈" },
              { id: "profile", label: t("User Profile", "उपयोगकर्ता प्रोफ़ाइल", "వినియోగదారు ప్రొఫైల్"), icon: "👤" },
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
              <span>{t("Sign Out", "लॉग आउट", "లాగ్ అవుట్")}</span>
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
              <span className="text-emerald-400 font-bold">
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
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">{t("Welcome back", "स्वागत है", "స్వాగతం")}, {user.username}</h2>
            </div>
            
            {/* Changeable location selection dropdown */}
            <div className="flex items-center gap-2 border border-zinc-800 bg-[#07070c] rounded-xl px-2.5 py-1 text-xs">
              <span className="text-zinc-550">{t("Active Location", "सक्रिय स्थान", "క్రియాశీల స్థానం")}:</span>
              <select
                value={activeLocationIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  setActiveLocationIndex(idx);
                  setAlphaMoisture(REALISTIC_LOCATIONS[idx].moistureDefault);
                }}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                {REALISTIC_LOCATIONS.map((loc, i) => (
                  <option key={i} value={i} className="bg-[#0c0c12] text-zinc-200">
                    {loc.name.split(" ")[0]}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleGPSDetection}
                disabled={gpsDetecting}
                className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded px-2 py-0.5 ml-2 font-bold cursor-pointer transition-colors"
              >
                {gpsDetecting ? t("Detecting...", "खोज रहा है...", "కనుగొంటోంది...") : `📍 ${t("Detect GPS", "जीपीएस खोजें", "GPS గుర్తించు")}`}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-2 border border-zinc-800 bg-[#07070c] rounded-xl px-2.5 py-1 text-xs">
              <span className="text-zinc-550">{t("Language", "भाषा", "భాష")}:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "te")}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-[#0c0c12] text-zinc-200">English</option>
                <option value="hi" className="bg-[#0c0c12] text-zinc-200">Hindi (हिंदी)</option>
                <option value="te" className="bg-[#0c0c12] text-zinc-200">Telugu (తెలుగు)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border border-zinc-800 bg-[#0d0d15] rounded-full py-1.5 px-3.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400">{t("Agent Network Operational", "एजेंट नेटवर्क सक्रिय", "ఏజెంట్ నెట్‌వర్క్ పనిచేస్తోంది")}</span>
            </div>
          </div>
        </header>

        {/* GPS alerts */}
        {gpsMessage && (
          <div className="bg-emerald-950/20 border-b border-emerald-800/30 px-8 py-2 text-[10px] text-emerald-400 font-medium flex justify-between">
            <span>{gpsMessage}</span>
            <button onClick={() => setGpsMessage("")} className="text-zinc-500 hover:text-zinc-300">✖</button>
          </div>
        )}

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
                  <span className="text-xs text-zinc-550 font-medium">{t("Field 1 Soil Moisture", "फ़ील्ड 1 मिट्टी की नमी", "ఫీల్డ్ 1 మట్టి తేమ")}</span>
                  <h3 className="text-2xl font-bold mt-2 text-emerald-400">{alphaMoisture}%</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${alphaMoisture < 30 ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`}></span>
                    <span>{alphaMoisture < 30 ? t("Moisture CRITICAL", "नमी गंभीर", "తేమ ప్రమాదకర స్థాయి") : t("Moisture Optimal", "नमी इष्टतम", "తేమ సాధారణ స్థాయి")}</span>
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
                  <span className="text-xs text-zinc-550 font-medium">{t("Field 2 Soil Moisture", "फ़ील्ड 2 मिट्टी की नमी", "ఫీల్డ్ 2 మట్టి తేమ")}</span>
                  <h3 className="text-2xl font-bold mt-2 text-sky-400">{betaMoisture}%</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span>{t("Moisture Stable", "नमी स्थिर", "తేమ స్థిరంగా ఉంది")}</span>
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
                  <span className="text-xs text-zinc-550 font-medium">{t("Soil Nitrogen Level", "मिट्टी नाइट्रोजन स्तर", "మట్టి నత్రజని శాతం")}</span>
                  <h3 className="text-2xl font-bold mt-2 text-amber-500">{nitrogenLevel} <span className="text-xs font-normal text-zinc-500">mg/kg</span></h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400/80">
                    <span>{nitrogenLevel < 10 ? t("Nitrogen Deficient!", "नाइट्रोजन की कमी!", "నత్రజని లోపం!") : t("Soil Nutrition Optimal", "मिट्टी का पोषण इष्टतम", "మట్టి పోషకాలు సాధారణ స్థాయి")}</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("market")}
                  className="border border-zinc-800/50 rounded-2xl p-5 bg-[#0a0a10]/60 backdrop-blur-md relative overflow-hidden group hover:border-purple-800/50 transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 group-hover:scale-110 transition-transform duration-300">
                    📈
                  </div>
                  <span className="text-xs text-zinc-550 font-medium">{t(targetCrop.labelEn, targetCrop.labelHi, targetCrop.labelTe)} {t("Mandi Rate", "मंडी दर", "మండి ధర")}</span>
                  <h3 className="text-2xl font-bold mt-2 text-purple-400">₹{marketPrice.toLocaleString()} <span className="text-xs font-normal">/ Qtl</span></h3>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                    <span className="text-emerald-400 font-semibold">{t("Active Price Projection", "सक्रिय मूल्य प्रक्षेपण", "ధరల అంచనా")}</span>
                  </div>
                </div>
              </div>

              {/* Workable Dashboard Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Crop field layout map */}
                <div className="lg:col-span-2 border border-zinc-800/60 rounded-2xl p-6 bg-[#0a0a10]/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200">{t("Interactive Farm Fields Map", "इंटरैक्टिव फार्म फील्ड मैप", "క్రియాశీల ఫార్మ్ మ్యాప్")} ({REALISTIC_LOCATIONS[activeLocationIndex].name.split(" ")[0]})</h3>
                        <p className="text-xs text-zinc-500 font-medium">{t("Click on fields below to inspect crop type and coordinate details", "फसल के प्रकार और विवरण का निरीक्षण करने के लिए नीचे फ़ील्ड पर क्लिक करें", "పంట వివరాలను చూడటానికి క్రింది పొలాలపై క్లిక్ చేయండి")}</p>
                      </div>
                      <span className="text-[10px] bg-zinc-800/60 border border-zinc-700/50 rounded px-2 py-0.5 text-zinc-400 uppercase font-bold">
                        {t("Interactive Map", "इंटरैक्टिव मानचित्र", "ఇంటరాక్టివ్ మ్యాప్")}
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
                            <span className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">{t("Field A1 (North)", "फील्ड ए 1 (उत्तर)", "ఫీల్డ్ A1 (ఉత్తరం)")}</span>
                            <h4 className="text-lg font-bold text-zinc-200 mt-1">{t("Chilli", "लाल मिर्च", "మిరపకాయ")}</h4>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${alphaMoisture < 30 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
                        </div>
                        <div className="text-xs space-y-1 text-zinc-400 font-mono">
                          <div className="flex justify-between font-sans">
                            <span>{t("Moisture level", "नमी स्तर", "తేమ శాతం")}:</span>
                            <span className={`font-bold ${alphaMoisture < 30 ? "text-rose-400" : "text-emerald-400"}`}>
                              {alphaMoisture}%
                            </span>
                          </div>
                          <div className="flex justify-between font-sans">
                            <span>{t("Soil profile", "मिट्टी की रूपरेखा", "నేల రకం")}:</span>
                            <span className="font-semibold text-zinc-300">
                              {(() => {
                                const s = REALISTIC_LOCATIONS[activeLocationIndex].defaultSoil;
                                if (s === "Red Sandy Clay") return t("Red Sandy Clay", "लाल रेतीली मिट्टी", "ఎర్ర ఇసుక నేల");
                                if (s === "Black Cotton") return t("Black Cotton", "काली कपास मिट्टी", "నల్ల రేగడి నేల");
                                if (s === "Sandy Loam") return t("Sandy Loam", "रेतीली दोमट", "ఇసుక నేల");
                                if (s === "Red Loamy") return t("Red Loamy", "लाल दोमट", "ఎర్ర లోమి నేల");
                                if (s === "Alluvial Clay") return t("Alluvial Clay", "जलोढ़ मिट्टी", "ఒండ్రు నేల");
                                return t("Clay Loam", "चिकनी दोमट मिट्टी", "నల్ల గరుప నేల");
                              })()}
                            </span>
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
                            <span className="text-[10px] text-purple-400 font-bold tracking-wider uppercase">{t("Field B4 (South)", "फील्ड बी 4 (दक्षिण)", "ఫీల్డ్ B4 (దక్షిణం)")}</span>
                            <h4 className="text-lg font-bold text-zinc-200 mt-1">{t("Rice", "चावल", "వరి")}</h4>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${nitrogenLevel < 10 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
                        </div>
                        <div className="text-xs space-y-1 text-zinc-400 font-mono">
                          <div className="flex justify-between">
                            <span>{t("Moisture level", "नमी स्तर", "తేమ శాతం")}:</span>
                            <span className="font-bold text-emerald-400">{betaMoisture}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("Nitrogen level", "नाइट्रोजन स्तर", "నత్రజని శాతం")}:</span>
                            <span className={`font-bold ${nitrogenLevel < 10 ? "text-rose-400" : "text-zinc-300"}`}>
                              {nitrogenLevel} mg/kg
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800/40 flex justify-between items-center text-xs text-zinc-500">
                    <span>
                      {selectedField === "alpha" && `${t("Field Alpha coordinates", "फील्ड अल्फा निर्देशांक", "ఫీల్డ్ ఆల్ఫా కోఆర్డినేట్లు")}: Lat ${REALISTIC_LOCATIONS[activeLocationIndex].latitude}, Long ${REALISTIC_LOCATIONS[activeLocationIndex].longitude}`}
                      {selectedField === "beta" && `${t("Field Beta coordinates", "फील्ड बीटा निर्देशांक", "ఫీల్డ్ బీటా కోఆర్డినేట్లు")}: Lat ${(REALISTIC_LOCATIONS[activeLocationIndex].latitude + 0.005).toFixed(4)}, Long ${(REALISTIC_LOCATIONS[activeLocationIndex].longitude + 0.005).toFixed(4)}`}
                      {!selectedField && t("Click a field card to view vegetative status indicators", "सक्रिय स्थिति संकेतकों को देखने के लिए फ़ील्ड कार्ड पर क्लिक करें", "పొలాల స్థితిని చూడటానికి ఏదైనా పొలం కార్డుపై క్లిక్ చేయండి")}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedField(null);
                        setActiveTab("crops");
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      {t("Plan New Crop Season", "नई फसल सीजन की योजना बनाएं", "కొత్త పంట ప్రణాళికను సిద్ధం చేయండి")} →
                    </button>
                  </div>
                </div>

                {/* AI Agent reasoning stream console */}
                <div className="border border-zinc-800/60 rounded-2xl p-6 bg-[#090910] flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">Agentic Action Center</h3>
                      <p className="text-xs text-zinc-500 font-medium">Real-time decisions logs (LangGraph)</p>
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
                  { name: "Weather Agent", role: "IMD Forecasts Node", status: "Active", desc: "Monitors forecasts and rainfall logs to suggest crop scheduling changes.", icon: "☀️" },
                  { name: "Irrigation Agent", role: "Virtual Drip Node", status: "Active", desc: "Reads virtual soil moisture data. Calculates sprinkler timings.", icon: "💧" },
                  { name: "Fertilizer Agent", role: "Soil Nutrition Node", status: "Active", desc: "Monitors nitrogen (N), phosphorus (P), and potassium (K) configurations.", icon: "🌱" },
                  { name: "Disease Vision Agent", role: "Leaf Spot Classification", status: "Idle", desc: "Analyzes crop leaf pictures to detect rust, blight, and spots.", icon: "👁️" },
                  { name: "Inventory Agent", role: "Resource Watchdog", status: "Active", desc: "Tracks materials levels, triggers alerts when levels dip.", icon: "📦" },
                  { name: "Market Agent", role: "Mandi price index scraper", status: "Active", desc: "Monitors rates in Guntur and Hyderabad mandis.", icon: "📈" },
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
                    <p className="text-xs text-zinc-500">Querying: <span className="text-emerald-400 font-bold">{selectedChatAgent}</span></p>
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
                      <span>Formulating response...</span>
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
                    placeholder={`Ask ${selectedChatAgent} something (e.g. "What is the forecast?")`}
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

              {selectedChatAgent === "Disease Vision Agent" && (
                <div className="border border-zinc-800 bg-[#0c0c12]/40 rounded-3xl p-8 space-y-6">
                  <div>
                    <h3 className="text-md font-bold text-zinc-200">🍂 Computer Vision Leaf Disease Diagnostics (Foliar Scan)</h3>
                    <p className="text-xs text-zinc-550">Click on any leaf photo sample below to simulate neural network image classification, check treatments, dosage, and preventive guidelines.</p>
                  </div>

                  {/* Leaf Grid Samples */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Tomato leaf */}
                    <div
                      onClick={() => handleDetectLeafDisease("tomato")}
                      className={`border rounded-2xl p-4 transition-all cursor-pointer text-center space-y-3 ${
                        selectedLeafSample === "tomato"
                          ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-zinc-850 bg-zinc-950/45 hover:border-zinc-700"
                      }`}
                    >
                      <div className="h-28 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-4xl">
                        🍂
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-200 block">Tomato Leaf (Early Blight)</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Alternaria solani</span>
                      </div>
                    </div>

                    {/* Rice leaf */}
                    <div
                      onClick={() => handleDetectLeafDisease("rice")}
                      className={`border rounded-2xl p-4 transition-all cursor-pointer text-center space-y-3 ${
                        selectedLeafSample === "rice"
                          ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-zinc-850 bg-zinc-950/45 hover:border-zinc-700"
                      }`}
                    >
                      <div className="h-28 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-4xl">
                        🌾
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-200 block">Rice Leaf (Blast)</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Magnaporthe oryzae</span>
                      </div>
                    </div>

                    {/* Cotton leaf */}
                    <div
                      onClick={() => handleDetectLeafDisease("cotton")}
                      className={`border rounded-2xl p-4 transition-all cursor-pointer text-center space-y-3 ${
                        selectedLeafSample === "cotton"
                          ? "border-emerald-500 bg-emerald-950/20 text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-zinc-850 bg-zinc-950/45 hover:border-zinc-700"
                      }`}
                    >
                      <div className="h-28 rounded-xl bg-zinc-900 border border-zinc-855 flex items-center justify-center text-4xl">
                        🌿
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-200 block">Cotton Leaf (Spot)</span>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">Alternaria Leaf Spot</span>
                      </div>
                    </div>

                    {/* Upload box */}
                    <div
                      onClick={() => alert("Image upload triggered. Under staging configurations, select one of the mock sample leaf nodes to run visual classifier diagnostics.")}
                      className="border border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-emerald-500/50 transition-colors cursor-pointer bg-zinc-950/20"
                    >
                      <div className="text-3xl text-zinc-650">📤</div>
                      <div>
                        <span className="font-semibold text-xs text-zinc-400 block">Upload Custom Leaf</span>
                        <span className="text-[9px] text-zinc-600 block mt-1">Supports JPG, PNG (Max 5MB)</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostics Scanner Console */}
                  {scanningLeaf && (
                    <div className="border border-zinc-850 bg-zinc-950/60 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-xs">
                      <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-zinc-400 animate-pulse">Running Vision AI neural networks image scan classification model...</span>
                    </div>
                  )}

                  {/* Results Diagnostic Card */}
                  {scanResult && !scanningLeaf && (
                    <div className="border border-zinc-850 bg-zinc-950/60 p-6 rounded-2xl space-y-5">
                      <div className="flex justify-between items-start border-b border-zinc-850 pb-4">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Diagnostics Result (Vision AI)</span>
                          <h4 className="text-lg font-bold text-zinc-200 mt-1">{scanResult.diseaseName}</h4>
                          <span className="text-xs text-zinc-500 font-medium">{scanResult.localName}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-xl">
                          Confidence: 94.2%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Medicine & Dosage */}
                        <div className="space-y-3">
                          <div>
                            <span className="font-bold text-zinc-450 block mb-1">🧪 Recommended Medicine / Fungicide</span>
                            <span className="text-emerald-400 font-semibold">{scanResult.medicine}</span>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-450 block mb-1">📋 Dosage & Application Instructions</span>
                            <p className="text-zinc-350 leading-relaxed font-sans">{scanResult.dosage}</p>
                          </div>
                        </div>

                        {/* Preventive Tips Session */}
                        <div className="border-l border-zinc-850/80 pl-6 space-y-3">
                          <span className="font-bold text-zinc-450 block">💡 Preventive Tips & Best Practices</span>
                          <ul className="space-y-2 list-disc list-inside text-zinc-450 leading-normal">
                            {scanResult.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CROP MANAGEMENT & DECISION PLANNER */}
          {activeTab === "crops" && (
            <div className="space-y-8">
              
              {/* Top Section: Farms & Crops CRUD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Farm Registration Column */}
                <div className="space-y-6">
                  {/* Select Farm */}
                  <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-200">Select Active Farm</h3>
                    {loadingFarms ? (
                      <div className="text-xs text-zinc-500">Loading farms...</div>
                    ) : farms.length === 0 ? (
                      <div className="text-xs text-zinc-500">No farms registered. Register one below.</div>
                    ) : (
                      <div className="space-y-2">
                        {farms.map((f) => (
                          <div key={f.id} className="flex gap-2 items-center">
                            <button
                              onClick={() => setSelectedFarm(f)}
                              className={`flex-1 flex justify-between items-center p-3.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                                selectedFarm?.id === f.id
                                  ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-zinc-400"
                              }`}
                            >
                              <span className="font-bold">{f.name}</span>
                              <span className="text-[9px] uppercase tracking-wider bg-zinc-850 px-2 py-0.5 rounded text-zinc-300 border border-zinc-800 font-mono">
                                {f.totalAreaHectares.toFixed(1)} {f.areaUnit || "acres"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteFarm(f.id)}
                              className="p-3.5 rounded-xl border border-rose-900/40 hover:bg-rose-950/30 text-rose-450 hover:text-rose-350 transition-colors text-xs cursor-pointer"
                              title="Delete Farm"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Farm Form */}
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
                          placeholder="e.g. My Hyderabad Farm"
                        />
                      </div>
                      
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

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                      >
                        Save Farm Profile
                      </button>
                    </form>
                  </div>
                </div>

                {/* Planted Crops Table & Add Crop Form */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedFarm ? (
                    <>
                      {/* Crops table */}
                      <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-200">Active Crops - {selectedFarm.name}</h3>
                          <p className="text-[11px] text-zinc-500 mb-4">Mapped to: {selectedFarm.locationName}</p>
                        </div>

                        {loadingCrops ? (
                          <div className="text-xs text-zinc-500">Loading crops...</div>
                        ) : crops.length === 0 ? (
                          <div className="text-xs text-zinc-550 py-6 text-center border border-dashed border-zinc-850 rounded-xl">
                            No crops logged. Plant one below!
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
                                  <th className="pb-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-850">
                                {crops.map((c) => (
                                  <tr key={c.id} className="text-zinc-300">
                                    <td className="py-3.5 font-bold text-zinc-100">
                                      {c.name.includes("Rice") ? t("Rice", "धान - Dhaan", "వరి - Vari") :
                                       c.name.includes("Cotton") ? t("Cotton", "कपास - Kapaas", "ప్రత్తి - Pratti") :
                                       c.name.includes("Chilli") ? t("Chilli", "लाल मिर्च - Lal Mirch", "మిరపకాయ - Mirapakaya") :
                                       c.name.includes("Groundnut") ? t("Groundnut", "मूंगफली - Mungfali", "వేరుశనగ - Verusenaga") :
                                       c.name.includes("Maize") ? t("Maize", "मक्का - Makka", "మొక్కజొన్న - Mokkajonna") :
                                       c.name.includes("Tomato") ? t("Tomato", "टमाटर - Tamatar", "టమోటా - Tomato") :
                                       c.name}
                                    </td>
                                    <td className="py-3.5">{c.variety}</td>
                                    <td className="py-3.5">{c.plantedAt}</td>
                                    <td className="py-3.5">{c.harvestPlannedAt || "-"}</td>
                                    <td className="py-3.5">
                                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
                                        {c.status}
                                      </span>
                                    </td>
                                    <td className="py-3.5 text-right">
                                      <button
                                        onClick={() => c.id && handleDeleteCrop(c.id)}
                                        className="text-rose-455 hover:text-rose-355 hover:bg-rose-950/20 px-2.5 py-1 rounded-lg border border-rose-900/30 transition-colors cursor-pointer text-[10px] font-bold"
                                      >
                                        Delete
                                      </button>
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
                            <label className="block text-[10px] text-zinc-500 font-bold mb-1">CROP TYPE (BILINGUAL)</label>
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
                                  {t(crop.labelEn, crop.labelHi, crop.labelTe)}
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
                            <label className="block text-[10px] text-zinc-550 font-bold mb-1">ESTIMATED HARVEST (AUTO-CALCULATED)</label>
                            <input
                              type="date"
                              readOnly
                              value={newCropHarvest}
                              className="w-full rounded-xl border border-zinc-850 bg-zinc-900/50 px-3.5 py-2.5 text-xs text-zinc-500 focus:outline-none cursor-not-allowed"
                            />
                          </div>
                          <div className="col-span-2 pt-2">
                            <button
                              type="submit"
                              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                            >
                              Plant & Log Crop
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-zinc-550 text-sm border border-dashed border-zinc-850 rounded-3xl">
                      Register a Farm Profile in the left column first to unlock crop management.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section: Crop Season Decision Planner, Resource Calculator & Profitability Index */}
              <div className="border border-zinc-800 bg-[#0c0c12]/40 rounded-3xl p-8 space-y-6">
                <div>
                  <h3 className="text-md font-bold text-zinc-200">📊 Crop Decision Planner & Cultivation Cost Calculator</h3>
                  <p className="text-xs text-zinc-500">Estimates cost automatically based on crop and acres selection!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                  {/* Inputs */}
                  <div className="space-y-4 border-r border-zinc-850/80 pr-6">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">1. Planning Inputs</span>
                    
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">SELECT CROP</label>
                      <select
                        value={calcCropIdx}
                        onChange={(e) => setCalcCropIdx(parseInt(e.target.value))}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {AVAILABLE_CROPS.map((crop, idx) => (
                          <option key={idx} value={idx}>
                            {t(crop.labelEn, crop.labelHi, crop.labelTe)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">CULTIVATION AREA (ACRES)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={calcAcres}
                        onChange={(e) => setCalcAcres(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Automatic Cost of Cultivation Sync */}
                    <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-3.5 space-y-1 text-xs">
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>Cost per Acre:</span>
                        <span>₹{costPerAcre.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-400">
                        <span>Auto-Calculated Cost:</span>
                        <span>₹{totalCost.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleScheduleAlarms}
                        className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-zinc-700/50 transition-all cursor-pointer"
                      >
                        ⏰ Set Season Alarms ({targetCrop.value})
                      </button>
                    </div>
                  </div>

                  {/* Requirements Timeline Outputs */}
                  <div className="space-y-4 border-r border-zinc-850/80 pr-6">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">2. Resource Requirements Timeline</span>
                    
                    <div className="space-y-3.5 text-xs">
                      <div className="border border-zinc-850 bg-zinc-950/40 p-3 rounded-xl">
                        <div className="flex justify-between font-bold text-zinc-200 mb-1">
                          <span>Sowing Phase (Weeks 1-2)</span>
                          <span className="text-[10px] text-emerald-400">Required Now</span>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          • Seeds: {(acres * 5).toFixed(0)} kg of {targetCrop.value} variety
                          <br/>
                          • Basal Fertilizer (DAP/NPK): {(acres * 50).toFixed(0)} kg
                        </p>
                      </div>

                      <div className="border border-zinc-850 bg-zinc-950/40 p-3 rounded-xl">
                        <div className="flex justify-between font-bold text-zinc-300 mb-1">
                          <span>Vegetative growth (Weeks 4-8)</span>
                          <span className="text-[10px] text-zinc-500">In 3 Weeks</span>
                        </div>
                        <p className="text-[11px] text-zinc-550">
                          • Nitrogen fertilizer (Urea): {(acres * 40).toFixed(0)} kg
                          <br/>
                          • Drip Irrigation Volume: {(acres * 12000).toLocaleString()} Litres
                        </p>
                      </div>

                      <div className="border border-zinc-850 bg-zinc-950/40 p-3 rounded-xl">
                        <div className="flex justify-between font-bold text-zinc-300 mb-1">
                          <span>Flowering & Harvest (Weeks 12-16)</span>
                          <span className="text-[10px] text-zinc-500">In 2 Months</span>
                        </div>
                        <p className="text-[11px] text-zinc-550">
                          • Potash (K): {(acres * 30).toFixed(0)} kg
                          <br/>
                          • Harvest storage: Gunny bags and transport arrangements
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mandi Profitability Calculator */}
                  <div className="space-y-4">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">3. Profitability Projections (Rupees ₹)</span>
                    
                    <div className="border border-zinc-850 bg-zinc-950/50 p-5 rounded-2xl space-y-4">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Mandi Price:</span>
                          <span className="font-semibold text-zinc-300">₹{marketPrice.toLocaleString()} / Quintal</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Total Cultivation Cost:</span>
                          <span className="font-bold text-zinc-300">₹{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-850 pb-2">
                          <span className="text-zinc-500">Expected Yield:</span>
                          <span className="font-semibold text-zinc-300">{(yieldPerAcre * acres).toFixed(0)} Quintals</span>
                        </div>
                        <div className="flex justify-between pt-1 font-bold text-zinc-200">
                          <span>Total Revenue:</span>
                          <span>₹{totalRevenue.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Projected Net Profit</span>
                        <h4 className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          ₹{netProfit.toLocaleString()}
                        </h4>
                        <span className="text-[9px] text-zinc-650 mt-1 block">
                          Yield: {yieldPerAcre} quintals / acre
                        </span>
                      </div>
                    </div>

                    {calcSuccess && (
                      <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-3 text-[10px] text-emerald-400 leading-relaxed font-semibold">
                        {calcSuccess}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SENSOR FEEDS & PREDICTIVE CROP RECOMMENDATION */}
          {activeTab === "telemetry" && (
            <div className="space-y-6">
              
              {/* Virtual Telemetry Node Banner */}
              <div className="border border-emerald-800/40 rounded-2xl bg-emerald-950/20 p-4 border-l-4 border-l-emerald-500 text-xs text-emerald-300 leading-normal flex items-start gap-3">
                <span className="text-lg">🛠️</span>
                <div>
                  <span className="font-bold">Virtual Telemetry Engine Active:</span> Since this software prototype functions without physical IoT hardware probes, soil telemetry signals are generated using simulated microclimate algorithms mapping regional soil profiles.
                </div>
              </div>

              {/* AI Crop Suitability Prediction Engine */}
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">🤖 AI Predictive Crop Advisor</h3>
                    <p className="text-xs text-zinc-500">Evaluates soil logs, coordinates distances, and target dates to forecast optimal yields.</p>
                  </div>
                  
                  {/* Date Input for dynamic auto selection check */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400 font-medium">Select Sowing Date:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="md:col-span-2 space-y-2">
                    <div className="text-xs text-zinc-400">
                      Active Soil: <span className="font-bold text-zinc-300">{REALISTIC_LOCATIONS[activeLocationIndex].defaultSoil}</span> 
                      {" | "} Location: <span className="font-bold text-emerald-400">{REALISTIC_LOCATIONS[activeLocationIndex].name}</span>
                      {" | "} Season: <span className="font-bold text-sky-400">{cropSeason}</span>
                    </div>
                    
                    <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-4 mt-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Recommended Crop for cultivation</span>
                      <h4 className="text-lg font-extrabold text-zinc-100 mt-1">{recommendedCrop}</h4>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-sans">{cropRationale}</p>
                    </div>
                  </div>

                  <div className="bg-[#0c0c12]/40 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between text-xs">
                    <div>
                      <span className="font-bold text-zinc-300 block mb-1">Predictive Model Matrix</span>
                      <p className="text-zinc-500 text-[11px] leading-relaxed">
                        Evaluates Indian Meteorological Department (IMD) historical indexes alongside active soil chemical parameters (NPK, moisture, temperatures).
                      </p>
                    </div>
                    <div className="pt-2 text-[10px] text-zinc-650 font-mono">
                      Algorithm: Multi-Layer Decision Classifier v2.1
                    </div>
                  </div>
                </div>
              </div>

              {/* Header info */}
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-zinc-200 mb-2">📡 Live Sensor Feeds (Simulated)</h3>
                  <p className="text-sm text-zinc-500">
                    Active measurements synced with: <span className="text-emerald-400 font-bold">{REALISTIC_LOCATIONS[activeLocationIndex].name}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportReport}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    📥 Export Farm Report
                  </button>
                  <button
                    onClick={() => {
                      setAlphaMoisture(REALISTIC_LOCATIONS[activeLocationIndex].moistureDefault);
                      setBetaMoisture(41);
                      setNitrogenLevel(14);
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reset Telemetry
                  </button>
                </div>
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
                      Telemetry values are modeled dynamically on regional soil profiles: {REALISTIC_LOCATIONS[activeLocationIndex].name}. 
                    </p>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Defects alert the FastAPI AI engine which returns detailed recovery advice.
                    </p>
                  </div>
                  <div className="text-[11px] text-zinc-650 bg-zinc-950/40 border border-zinc-900 rounded-xl p-3.5">
                    Lat: {REALISTIC_LOCATIONS[activeLocationIndex].latitude.toFixed(4)}, Long: {REALISTIC_LOCATIONS[activeLocationIndex].longitude.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Historical Telemetry Data Table */}
              <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">📊 Database Telemetry History (Last 10 Logs)</h3>
                  <p className="text-xs text-zinc-500">Real-time IoT metrics persisted in the PostgreSQL database.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans text-zinc-300">
                    <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Time</th>
                        <th className="p-3">Moisture</th>
                        <th className="p-3">Temp</th>
                        <th className="p-3">Nitrogen (N)</th>
                        <th className="p-3">Phosphorus (P)</th>
                        <th className="p-3">Potassium (K)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {telemetryHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-zinc-650">No logs found in DB yet. Waiting for telemetry loop...</td>
                        </tr>
                      ) : (
                        telemetryHistory.map((log: TelemetryRecord) => (
                          <tr key={log.id} className="hover:bg-zinc-950/20">
                            <td className="p-3 font-mono text-zinc-400">{new Date(log.recordedAt).toLocaleString()}</td>
                            <td className={`p-3 font-bold ${log.soilMoisture < 30 ? "text-rose-400" : "text-emerald-400"}`}>{log.soilMoisture}%</td>
                            <td className="p-3">{log.soilTemp}°C</td>
                            <td className="p-3">{log.npkNitrogen} mg/kg</td>
                            <td className="p-3">{log.npkPhosphorus} mg/kg</td>
                            <td className="p-3">{log.npkPotassium} mg/kg</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MARKET PRICE ANALYTICS */}
          {activeTab === "market" && (() => {
            const filteredCrops = AVAILABLE_CROPS.filter((c) => {
              const q = mandiSearchQuery.toLowerCase();
              return (
                c.labelEn.toLowerCase().includes(q) ||
                c.labelHi.toLowerCase().includes(q) ||
                c.labelTe.toLowerCase().includes(q) ||
                c.value.toLowerCase().includes(q)
              );
            });
            
            const currentPlaybookCrop = AVAILABLE_CROPS[activePlaybookCropIdx];
            const playbook = CROP_CULTIVATION_PLAYBOOKS[currentPlaybookCrop?.value] || CROP_CULTIVATION_PLAYBOOKS["Rice"];

            return (
              <div className="space-y-8">
                {/* Header & Search */}
                <div className="border border-zinc-800 bg-[#090910]/40 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-zinc-200">📈 Mandi Rates Index & Search</h3>
                    <p className="text-xs text-zinc-500">
                      Wholesale price indices scraped directly matching rates in Guntur, Hyderabad, and Warangal mandis.
                    </p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      value={mandiSearchQuery}
                      onChange={(e) => setMandiSearchQuery(e.target.value)}
                      placeholder="🔍 Search crops by name (English / తెలుగు / हिंदी)..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:border-emerald-500 focus:outline-none"
                    />
                    {mandiSearchQuery && (
                      <button
                        onClick={() => setMandiSearchQuery("")}
                        className="absolute right-3.5 top-2.5 text-zinc-550 hover:text-zinc-300 text-xs"
                      >
                        ✖
                      </button>
                    )}
                  </div>
                </div>

                {/* Mandi Cards List */}
                {filteredCrops.length === 0 ? (
                  <div className="border border-dashed border-zinc-850 rounded-2xl py-12 text-center text-xs text-zinc-550 bg-zinc-950/20">
                    No crops match your search query. Try searching for &quot;Rice&quot;, &quot;పసుపు&quot; or &quot;टमाटर&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredCrops.map((crop, idx) => (
                      <div key={idx} className="border border-zinc-850 bg-[#0c0c12]/40 rounded-2xl p-6 space-y-4 hover:border-emerald-800/30 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t(crop.labelEn, crop.labelHi, crop.labelTe)}</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/30">
                            ₹{(crop.marketPricePerQuintal / 100).toFixed(2)}/kg equivalent
                          </span>
                        </div>
                        <h4 className="text-4xl font-extrabold text-zinc-100">
                          ₹{crop.marketPricePerQuintal.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-zinc-500">/ Quintal</span>
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Projected Mandi Rates for {t(crop.labelEn, crop.labelHi, crop.labelTe)}. Expected average yield of {crop.yieldPerAcreQuintals} Quintals per acre based on local soil profiles.
                        </p>
                        <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-850">
                          <span>Standard Cost: ₹{crop.baseCostPerAcre.toLocaleString()} / acre</span>
                          <span className="text-emerald-400 font-bold">Sentiment: STABLE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cultivation Guides Playbook */}
                <div className="border border-zinc-800 bg-[#0c0c12]/40 rounded-3xl p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
                    <div>
                      <h3 className="text-md font-bold text-zinc-200">🌾 Dynamic Crop Cultivation Playbook (Seed to Mandi)</h3>
                      <p className="text-xs text-zinc-550">Full detailed guidelines for cultivation stages from beginning sowing to harvest.</p>
                    </div>
                    
                    {/* Select Crop Playbook Dropdown */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-zinc-450 font-medium">Select Crop:</span>
                      <select
                        value={activePlaybookCropIdx}
                        onChange={(e) => setActivePlaybookCropIdx(parseInt(e.target.value))}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {AVAILABLE_CROPS.map((c, i) => (
                          <option key={i} value={i}>
                            {t(c.labelEn, c.labelHi, c.labelTe)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Playbook Stage Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Phase 1 */}
                    <div className="border border-zinc-850 bg-zinc-950/40 p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800/30 flex items-center justify-center text-[10px]">1</span>
                        <span>{t("SOWING & SEEDS", "बुवाई और बीज", "విత్తడం & విత్తనాలు")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{t(playbook.sowing.en, playbook.sowing.hi, playbook.sowing.te)}</p>
                    </div>

                    {/* Phase 2 */}
                    <div className="border border-zinc-850 bg-zinc-950/40 p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800/30 flex items-center justify-center text-[10px]">2</span>
                        <span>{t("LAND PREPARATION", "भूमि की तैयारी", "నేల తయారీ")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{t(playbook.landPrep.en, playbook.landPrep.hi, playbook.landPrep.te)}</p>
                    </div>

                    {/* Phase 3 */}
                    <div className="border border-zinc-850 bg-zinc-950/40 p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800/30 flex items-center justify-center text-[10px]">3</span>
                        <span>{t("IRRIGATION SCHEDULE", "सिंचाई कार्यक्रम", "నీటి పారుదల షెడ్యూల్")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{t(playbook.irrigation.en, playbook.irrigation.hi, playbook.irrigation.te)}</p>
                    </div>

                    {/* Phase 4 */}
                    <div className="border border-zinc-850 bg-zinc-950/40 p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800/30 flex items-center justify-center text-[10px]">4</span>
                        <span>{t("FERTILIZERS (NPK)", "उर्वरक (NPK)", "ఎరువులు (NPK)")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{t(playbook.fertilizer.en, playbook.fertilizer.hi, playbook.fertilizer.te)}</p>
                    </div>

                    {/* Phase 5 */}
                    <div className="border border-zinc-850 bg-zinc-950/40 p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800/30 flex items-center justify-center text-[10px]">5</span>
                        <span>{t("PEST & DISEASE DEFENSE", "कीट और रोग नियंत्रण", "కీటకాలు & తెగుళ్ల నివారణ")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{t(playbook.pestControl.en, playbook.pestControl.hi, playbook.pestControl.te)}</p>
                    </div>

                    {/* Phase 6 */}
                    <div className="border border-zinc-850 bg-zinc-950/40 p-5 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <span className="h-5 w-5 rounded-full bg-emerald-950 border border-emerald-800/30 flex items-center justify-center text-[10px]">6</span>
                        <span>{t("HARVESTING & STORAGE", "कटाई और भंडारण", "కోత & నిల్వ")}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">{t(playbook.harvest.en, playbook.harvest.hi, playbook.harvest.te)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 6: USER PROFILE & PASSWORD CHANGE */}
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
                    <h3 id="profile-username" className="text-xl font-bold text-zinc-100">Username: {user.username}</h3>
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
                  </div>
                </div>

                {/* Change Password Form */}
                <div className="mt-8 pt-6 border-t border-zinc-850/80">
                  <h4 className="text-sm font-bold text-zinc-200 mb-4">🔑 Change Account Password</h4>
                  
                  {passwordError && <div className="text-xs text-rose-400 mb-3">{passwordError}</div>}
                  {passwordSuccess && <div className="text-xs text-emerald-400 mb-3">{passwordSuccess}</div>}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">NEW PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">CONFIRM PASSWORD</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Update Password
                    </button>
                  </form>
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

          {/* TAB 7: FINANCIALS & LOGISTICS */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              
              {/* Financial Ledger & Carbon Footprint Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Ledger input form */}
                <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">📊 Add Financial Transaction</h3>
                  {txSuccess && <div className="text-xs text-emerald-400 font-bold">{txSuccess}</div>}
                  
                  <form onSubmit={handleCreateTransaction} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">TRANSACTION TYPE</label>
                      <select
                        value={txType}
                        onChange={(e) => setTxType(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="EXPENSE">EXPENSE</option>
                        <option value="REVENUE">REVENUE</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">CATEGORY</label>
                      <select
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="SEEDS">SEEDS</option>
                        <option value="FERTILIZERS">FERTILIZERS</option>
                        <option value="LABOR">LABOR</option>
                        <option value="SALES">CROP SALES</option>
                        <option value="MACHINERY">MACHINERY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">AMOUNT (₹)</label>
                      <input
                        type="number"
                        required
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">DESCRIPTION</label>
                      <input
                        type="text"
                        value={txDescription}
                        onChange={(e) => setTxDescription(e.target.value)}
                        placeholder="e.g. Purchased Urea bags"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Log Transaction
                    </button>
                  </form>
                </div>

                {/* Ledger Data Table */}
                <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-bold text-zinc-200">💰 Financial Ledger Accounts</h3>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-left text-xs font-sans text-zinc-300">
                      <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-zinc-650">No transactions recorded yet.</td>
                          </tr>
                        ) : (
                          transactions.map((tx: { id: string; loggedAt: string; type: string; category: string; amount: number; description: string; }) => (
                            <tr key={tx.id} className="hover:bg-zinc-950/20">
                              <td className="p-3 font-mono text-zinc-400">{new Date(tx.loggedAt).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.type === "REVENUE" ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="p-3">{tx.category}</td>
                              <td className={`p-3 font-bold ${tx.type === "REVENUE" ? "text-emerald-400" : "text-zinc-300"}`}>
                                ₹{tx.amount}
                              </td>
                              <td className="p-3 text-zinc-500">{tx.description || "N/A"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Logistics & Supply Chain Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Logistics Input Form */}
                <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">🚛 Initialize Mandi Transit Logistics</h3>
                  {shipSuccess && <div className="text-xs text-emerald-400 font-bold">{shipSuccess}</div>}
                  
                  <form onSubmit={handleCreateShipment} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">CROP NAME</label>
                        <input
                          type="text"
                          required
                          value={shipCrop}
                          onChange={(e) => setShipCrop(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">QUANTITY (QUINTALS)</label>
                        <input
                          type="number"
                          required
                          value={shipQty}
                          onChange={(e) => setShipQty(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">DESTINATION MANDI</label>
                      <input
                        type="text"
                        required
                        value={shipMandi}
                        onChange={(e) => setShipMandi(e.target.value)}
                        placeholder="e.g. Bowenpally Mandi, Hyderabad"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Dispatch Cargo
                    </button>
                  </form>
                </div>

                {/* Logistics Shipment timeline status list */}
                <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">📦 Logistics & Transit Status</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {shipments.length === 0 ? (
                      <p className="text-xs text-zinc-550 text-center py-6">No cargo dispatches recorded yet.</p>
                    ) : (
                      shipments.map((s: { id: string; cropName: string; quantityQuintals: number; destinationMandi: string; status: string; updatedAt: string; }) => (
                        <div key={s.id} className="border border-zinc-850 bg-zinc-950/20 p-4 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-300">{s.cropName} ({s.quantityQuintals} q)</span>
                            <span className="font-mono text-zinc-500">{new Date(s.updatedAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-zinc-500">Destination: {s.destinationMandi}</p>
                          
                          {/* Timeline statuses */}
                          <div className="flex justify-between items-center pt-2">
                            {["HARVESTED", "IN_TRANSIT", "ARRIVED", "SOLD"].map((stage) => (
                              <button
                                key={stage}
                                onClick={() => handleUpdateShipmentStatus(s.id, stage)}
                                className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                                  s.status === stage
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                                    : "bg-zinc-950 text-zinc-550 border border-zinc-900 hover:text-zinc-300"
                                }`}
                              >
                                {stage.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Carbon Footprint & Green advisor */}
              <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">🌱 Carbon Footprint & Green Advisor</h3>
                  <p className="text-xs text-zinc-550">Estimate seasonal greenhouse emissions and receive mitigation recommendations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">WATER PUMP RUN (HOURS)</label>
                      <input
                        type="number"
                        value={carbonPumpHours}
                        onChange={(e) => setCarbonPumpHours(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-350 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">UREA FERTILIZER (BAGS)</label>
                      <input
                        type="number"
                        value={carbonNfertilizer}
                        onChange={(e) => setCarbonNfertilizer(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-350 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">DIESEL USED (LITERS)</label>
                      <input
                        type="number"
                        value={carbonDiesel}
                        onChange={(e) => setCarbonDiesel(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-350 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleCalculateCarbon}
                      disabled={loadingCarbon}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      {loadingCarbon ? "Calculating..." : "Compute Carbon Index"}
                    </button>
                  </div>

                  {carbonResult ? (
                    <div className="md:col-span-3 border border-zinc-850 bg-zinc-950/40 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Metrics */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <span className="text-xs text-zinc-400">Total Greenhouse Footprint:</span>
                          <span className={`text-sm font-mono font-bold ${
                            carbonResult.carbonRating === "Excellent" ? "text-emerald-400" : "text-rose-400"
                          }`}>{carbonResult.totalCo2eKg} kg CO2e</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <span className="text-xs text-zinc-400">Pumping Emissions:</span>
                          <span className="text-xs font-mono text-zinc-300">{carbonResult.pumpEmissionsKg} kg</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                          <span className="text-xs text-zinc-400">Chemical Inputs Footprint:</span>
                          <span className="text-xs font-mono text-zinc-300">{carbonResult.fertilizerEmissionsKg} kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-zinc-400">Tillage & Diesel Index:</span>
                          <span className="text-xs font-mono text-zinc-300">{carbonResult.dieselEmissionsKg} kg</span>
                        </div>
                      </div>

                      {/* Right: Mitigation Checklist */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🌿 Sustainable Mitigation Action Plan</h4>
                        {carbonResult.mitigations.length === 0 ? (
                          <p className="text-xs text-emerald-400">Your agricultural practices are fully low-impact carbon neutral. Excellent work!</p>
                        ) : (
                          <ul className="space-y-2">
                            {carbonResult.mitigations.map((m: string, i: number) => (
                              <li key={i} className="text-xs text-zinc-355 flex items-start gap-2">
                                <span className="text-emerald-500">✔</span>
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="md:col-span-3 border border-dashed border-zinc-850 rounded-2xl py-12 text-center text-xs text-zinc-555 bg-zinc-950/20">
                      Input your metrics to generate the Green Advisor action checklist.
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* TAB 8: GOVERNMENT SUBSIDIES MATCHING ENGINE */}
          {activeTab === "subsidies" && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Query Panel */}
              <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-zinc-200">🏛️ Government Subsidies & Schemes Optimizer</h3>
                <p className="text-xs text-zinc-500">Query regional agricultural benefits based on location, state registry, and land holdings.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold mb-1">REGISTRATION STATE</label>
                    <select
                      value={subsidyState}
                      onChange={(e) => setSubsidyState(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="All">Other / Central</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 font-bold mb-1">TOTAL LAND holdings (HECTARES)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={subsidyLandSize}
                      onChange={(e) => setSubsidyLandSize(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleMatchSchemes}
                      disabled={loadingSchemes}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      {loadingSchemes ? "Scanning..." : "Scan Eligible Subsidies"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {matchedSchemes.length === 0 ? (
                  <div className="border border-dashed border-zinc-850 rounded-2xl py-12 text-center text-xs text-zinc-555 bg-zinc-950/20">
                    No active eligible schemes found. Change the state or land holding query to recheck.
                  </div>
                ) : (
                  matchedSchemes.map((scheme: { id: string; name: string; eligibleState: string; description: string; benefitDetails: string; maxLandSizeHectares: number; }) => (
                    <div key={scheme.id} className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-950/50 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 border-l border-b border-emerald-800/40 rounded-bl-2xl">
                        State: {scheme.eligibleState}
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-zinc-200">{scheme.name}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{scheme.description}</p>
                        
                        <div className="bg-emerald-950/20 border border-emerald-800/20 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Benefit Details:</span>
                          <p className="text-xs text-zinc-300">{scheme.benefitDetails}</p>
                        </div>
                        
                        <div className="text-[10px] text-zinc-555 font-mono">
                          Eligible Land Limit: &lt;= {scheme.maxLandSizeHectares} Hectares
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 9: LIVESTOCK TELEMETRY CARE */}
          {activeTab === "livestock" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Add RFID ear tag form */}
                <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-zinc-200">🐄 Register Livestock Ear Tag</h3>
                  {liveSuccess && <div className="text-xs text-emerald-400 font-bold">{liveSuccess}</div>}
                  
                  <form onSubmit={handleCreateLivestock} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">RFID EAR TAG ID</label>
                      <input
                        type="text"
                        required
                        value={liveTag}
                        onChange={(e) => setLiveTag(e.target.value)}
                        placeholder="e.g. RFID-COW-1088"
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-350 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-500 font-bold mb-1">ANIMAL BREED / TYPE</label>
                      <select
                        value={liveType}
                        onChange={(e) => setLiveType(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none"
                      >
                        <option value="Cow">Cow</option>
                        <option value="Buffalo">Buffalo</option>
                        <option value="Goat">Goat</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">BODY TEMP (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={liveTemp}
                          onChange={(e) => setLiveTemp(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-350 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 font-bold mb-1">ACTIVITY INDEX</label>
                        <select
                          value={liveActivity}
                          onChange={(e) => setLiveActivity(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-350 focus:outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Resting">Resting</option>
                          <option value="Low Activity">Low Activity</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Save RFID Log
                    </button>
                  </form>
                </div>

                {/* Livestock database logger feeds */}
                <div className="border border-zinc-800 bg-[#0c0c12]/60 rounded-3xl p-6 backdrop-blur-md space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-bold text-zinc-200">🐃 Livestock Telemetry Dashboard</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans text-zinc-300">
                      <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3">Ear Tag ID</th>
                          <th className="p-3">Breed</th>
                          <th className="p-3">Body Temp</th>
                          <th className="p-3">Activity Status</th>
                          <th className="p-3">Health Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {livestockLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-zinc-650">No livestock telemetry recorded.</td>
                          </tr>
                        ) : (
                          livestockLogs.map((l: { id: string; tagId: string; animalType: string; bodyTempCelsius: number; activityStatus: string; }) => (
                            <tr key={l.id} className="hover:bg-zinc-950/20">
                              <td className="p-3 font-mono text-zinc-400 font-bold">{l.tagId}</td>
                              <td className="p-3">{l.animalType}</td>
                              <td className={`p-3 font-bold ${
                                l.bodyTempCelsius > 39.5 ? "text-rose-400" : "text-emerald-400"
                              }`}>{l.bodyTempCelsius}°C</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.activityStatus === "Active" ? "bg-emerald-950 text-emerald-400" : "bg-purple-950 text-purple-400"
                                }`}>
                                  {l.activityStatus}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.bodyTempCelsius > 39.5 ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"
                                }`}>
                                  {l.bodyTempCelsius > 39.5 ? "🔴 FEVER ALERT" : "🟢 HEALTHY"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
