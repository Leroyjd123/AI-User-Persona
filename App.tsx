import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generatePersonaProfile, createChatSession, getSystemInstruction } from './services/geminiService';
import { Persona, PersonaInput, ChatMessage, AdvancedSettings } from './types';
import HelpModal from './components/HelpModal';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import PersonaCard from './components/PersonaCard';
import { jsPDF } from "jspdf";
import {
  Sparkles,
  MessageSquare,
  Mic,
  Send,
  RefreshCcw,
  Dice5,
  Loader2,
  Key,
  Check,
  Trash2,
  SlidersHorizontal,
  Lock,
  Unlock,
  Copy,
  Bug,
  HelpCircle,
  X as XIcon,
} from 'lucide-react';

// Example scenarios for Randomizer
const RANDOM_SCENARIOS = [
  {
    productName: "Smart Plant Pot",
    problem: "People kill their houseplants by over or under watering them.",
    demographic: "Urban millennials living in apartments"
  },
  {
    productName: "AI Code Reviewer for Juniors",
    problem: "Senior engineers spend too much time reviewing basic pull requests.",
    demographic: "Tech leads in startups"
  },
  {
    productName: "Sustainable Sneaker Marketplace",
    problem: "Hard to verify if 'eco-friendly' fashion is actually sustainable.",
    demographic: "Gen Z eco-conscious shoppers"
  },
  {
    productName: "Freelance Tax Assistant",
    problem: "Independent contractors struggle to track deductible expenses.",
    demographic: "Freelance designers and writers"
  },
  {
    productName: "Remote Team Bonding App",
    problem: "Distributed teams feel disconnected and lonely.",
    demographic: "HR managers at remote-first companies"
  }
];

// Initial Advanced Settings
const DEFAULT_ADVANCED: AdvancedSettings = {
  customName: '',
  gender: 'Any',
  ageRange: '25-45',
  nationality: '',
  techLiteracy: 2,
  buyingPower: 'Value',
  vibe: 'Busy but Open',
  currentSolution: '',
  contextOfUse: 'Deep Work',
  decisionPower: 'End User',
  constraints: []
};

// Data for Randomizer
const RANDOM_DATA = {
  nationalities: ['USA', 'India', 'Germany', 'Japan', 'Brazil', 'UK', 'Nigeria', 'Canada', 'Australia', 'France'],
  vibes: ['Skeptical 🧐', 'Early Adopter 🚀', 'Frustrated 😫', 'Professional 💼', 'Busy but Open ⏱️'],
  solutions: ['Excel', 'Notion', 'Pen & Paper', 'Competitor App', 'Email Chains', 'Nothing'],
  constraints: ['Visual Impairment', 'Non-Native Speaker', 'Low Tech Literacy', 'Slow Internet']
};

// Dummy Data for Test Mode
const DUMMY_PERSONA: Persona = {
  name: "Alex Rivera",
  age: 29,
  occupation: "UX Designer",
  location: "Austin, Texas",
  quote: "I just need tools that don't get in my way.",
  bio: "Alex is a busy UX designer working at a mid-sized tech agency. They value efficiency and clean interfaces above all else. Often juggling multiple projects, Alex gets frustrated by slow software and convoluted workflows.",
  motivations: ["Efficiency in workflow", "Clean aesthetics", "Seamless integrations"],
  frustrations: ["Slow loading times", "Cluttered dashboards", "Lack of keyboard shortcuts"],
  brands: ["Apple", "Figma", "Notion", "Herman Miller"],
  avatarUrl: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairBun&accessoriesType=Prescription02&hairColor=BrownDark&facialHairType=BeardMedium&clotheType=Hoodie&eyeType=Happy&eyebrowType=Default&mouthType=Smile",
  chatInstructions: "Roleplay as Alex, a pragmatic designer who asks about dark mode and shortcuts.",
  advancedTraits: {
    ...DEFAULT_ADVANCED,
    gender: 'Non-binary',
    nationality: 'USA',
    techLiteracy: 3,
    buyingPower: 'Premium',
    vibe: 'Professional 💼',
    contextOfUse: 'Deep Work',
    currentSolution: 'Figma + Jira',
    constraints: ['Visual Impairment']
  }
};

const generateDummyChat = (): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  const conversation = [
    { role: 'model', text: "Hi! I'm Alex. I see you're building a new design tool? Can you tell me how it handles vector networks?" },
    { role: 'user', text: "Yes, we have a new node-based system. What do you dislike about current tools?" }
  ];

  messages.push(...conversation.map((c, i) => ({
    id: i.toString(),
    role: c.role as 'user' | 'model',
    text: c.text,
    timestamp: new Date(Date.now() - (conversation.length - i) * 60000)
  })));

  return messages;
};

interface UsageStats {
  personasGenerated: number;
  chatCounts: { [personaId: string]: number };
}

function App() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Auth & Usage State
  const [authMode, setAuthMode] = useState<'unselected' | 'free' | 'custom'>('unselected');
  const [customApiKey, setCustomApiKey] = useState('');
  const [usage, setUsage] = useState<UsageStats>({ personasGenerated: 0, chatCounts: {} });

  // Generation Inputs
  const [inputs, setInputs] = useState<PersonaInput>({
    productName: '',
    problem: '',
    demographic: ''
  });

  // Advanced Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(DEFAULT_ADVANCED);

  // Chat State
  const [chatStarted, setChatStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals & UI State
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Persona | null>(null);

  // Persona Card View State
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [searchQuery, setSearchQuery] = useState('');

  // Load usage from localStorage
  useEffect(() => {
    const storedUsage = localStorage.getItem('personaFlowUsage');
    if (storedUsage) {
      setUsage(JSON.parse(storedUsage));
    }
  }, []);

  // Check for saved persona
  useEffect(() => {
    const saved = localStorage.getItem('savedPersona');
    if (saved && !persona && authMode !== 'unselected') {
      // Logic to load saved persona could go here
    }
  }, [authMode, persona]);

  // Save usage to localStorage
  useEffect(() => {
    localStorage.setItem('personaFlowUsage', JSON.stringify(usage));
  }, [usage]);

  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  const confirmDiscardChanges = useCallback((): boolean => {
    if (isEditing) {
      return window.confirm("You have unsaved changes to the persona. Are you sure you want to discard them?");
    }
    return true;
  }, [isEditing]);

  // Handle URL Shared Data
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const sharedData = params.get('data');
      if (sharedData) {
        try {
          const decoded = JSON.parse(atob(decodeURIComponent(sharedData)));
          setPersona(decoded);
          if (authMode === 'unselected') setAuthMode('free');
          setChatStarted(false);
        } catch (e) {
          console.error("Failed to parse shared persona", e);
        }
      }
    };
    init();
  }, [authMode, customApiKey]);

  const handleSelectKey = async () => {
    // Logic for external key selection removed
  };

  const handleTestMode = () => {
    if (!confirmDiscardChanges()) return;
    setAuthMode('free');
    setPersona(DUMMY_PERSONA);
    setChatMessages(generateDummyChat());
    setChatStarted(true);
  };

  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping, chatStarted]);

  const fillRandom = () => {
    if (!confirmDiscardChanges()) return;
    const random = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
    setInputs(prev => ({ ...prev, ...random }));
  };

  // Randomized Settings Logic
  const randomizeTabSettings = useCallback(() => {
    setAdvancedSettings(prev => {
      const next = { ...prev };
      next.gender = ['Male', 'Female', 'Non-binary'][Math.floor(Math.random() * 3)] as any;
      next.techLiteracy = Math.floor(Math.random() * 3) + 1;
      next.vibe = RANDOM_DATA.vibes[Math.floor(Math.random() * RANDOM_DATA.vibes.length)];
      return next;
    });
  }, []);

  const handleGenerate = async () => {
    if (!inputs.productName || !inputs.problem) return;
    if (!confirmDiscardChanges()) return;

    if (authMode === 'free' && usage.personasGenerated >= 5) {
      alert("Free Tier Limit Reached: You have generated 5/5 personas. Please enter a custom API Key to continue.");
      return;
    }

    console.log("Generating persona with inputs:", inputs);
    setLoading(true);
    setLoadingMsg("Dreaming up a person...");
    setChatStarted(false);

    try {
      const fullInput = { ...inputs, advancedSettings };
      const apiKey = authMode === 'custom' ? customApiKey : undefined;

      const profile = await generatePersonaProfile(fullInput, apiKey);
      profile.advancedTraits = fullInput.advancedSettings;

      console.log("Persona generated successfully:", profile);
      setPersona(profile);
      setActiveTab('details');
      setChatMessages([]);

      if (authMode === 'free') {
        setUsage(prev => ({ ...prev, personasGenerated: prev.personasGenerated + 1 }));
      }

      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'Failed to generate persona'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetGenerator = () => {
    if (!confirmDiscardChanges()) return;
    setPersona(null);
    setChatMessages([]);
    setInputs({ productName: '', problem: '', demographic: '' });
    setAdvancedSettings(DEFAULT_ADVANCED);
    setIsEditing(false);
    setActiveTab('details');
    setChatStarted(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Keeping this for potential future re-enablement or background auto-save features if needed
  const savePersona = useCallback(() => {
    if (persona) {
      localStorage.setItem('savedPersona', JSON.stringify(persona));
      showToast("Persona Saved!");
    }
  }, [persona]);

  const startChat = () => {
    if (!persona) return;
    console.log("Starting chat session for:", persona.name);
    setChatStarted(true);
    const apiKey = authMode === 'custom' ? customApiKey : undefined;
    chatSessionRef.current = createChatSession(persona, apiKey);
    setChatMessages([{
      id: 'init',
      role: 'model',
      text: `Hi there! I'm ${persona.name}. I hear you're working on something interesting?`,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatSessionRef.current || !persona) return;

    const currentChatCount = usage.chatCounts[persona.name] || 0;
    if (authMode === 'free' && currentChatCount >= 10) {
      alert("Free Tier Limit Reached: You have sent 10 messages to this persona. Add your own API Key to continue chatting.");
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    if (authMode === 'free') {
      setUsage(prev => ({
        ...prev,
        chatCounts: {
          ...prev.chatCounts,
          [persona.name]: (prev.chatCounts[persona.name] || 0) + 1
        }
      }));
    }

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text || "",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the entire chat history?")) {
      setChatMessages([]);
    }
  };

  const generatePDF = async () => {
    if (!persona) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- Header Background ---
    doc.setFillColor(243, 244, 246); // gray-100
    doc.rect(0, 0, pageWidth, 60, 'F');

    // --- Header Text ---
    const headerTextX = margin + 10;
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55); // gray-800
    doc.setFont("helvetica", "bold");
    doc.text(persona.name, headerTextX, 25);

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // gray-600
    doc.setFont("helvetica", "normal");
    doc.text(`${persona.occupation}`, headerTextX, 32);
    doc.text(`${persona.age} years old  •  ${persona.location}`, headerTextX, 38);

    let currentY = 75;

    // --- Two Column Layout Setup ---
    const colGap = 10;
    const leftColWidth = (pageWidth - (margin * 2) - colGap) * 0.40; // 40%
    const rightColWidth = (pageWidth - (margin * 2) - colGap) * 0.60; // 60%
    const leftColX = margin;
    const rightColX = margin + leftColWidth + colGap;

    // --- LEFT COLUMN CONTENT ---

    // Bio
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39); // gray-900
    doc.setFont("helvetica", "bold");
    doc.text("Bio", leftColX, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81); // gray-700
    doc.setFont("helvetica", "normal");
    const bioLines = doc.splitTextToSize(persona.bio, leftColWidth);
    doc.text(bioLines, leftColX, currentY);
    currentY += (bioLines.length * 5) + 10;

    // Core Needs / Motivations
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.text("Motivations", leftColX, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    persona.motivations.forEach(m => {
      const lines = doc.splitTextToSize(`• ${m}`, leftColWidth);
      doc.text(lines, leftColX, currentY);
      currentY += (lines.length * 5) + 2;
    });
    currentY += 8;

    // Frustrations
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.text("Frustrations", leftColX, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    persona.frustrations.forEach(f => {
      const lines = doc.splitTextToSize(`• ${f}`, leftColWidth);
      doc.text(lines, leftColX, currentY);
      currentY += (lines.length * 5) + 2;
    });

    // --- RIGHT COLUMN CONTENT ---
    let rightY = 75;

    // Quote (Highlight box)
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.setFillColor(249, 250, 251); // gray-50
    doc.roundedRect(rightColX, rightY - 5, rightColWidth, 30, 3, 3, 'FD');
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "italic");
    const quoteLines = doc.splitTextToSize(`"${persona.quote}"`, rightColWidth - 10);
    doc.text(quoteLines, rightColX + 5, rightY + 5);
    rightY += 35;

    // Advanced Traits Table-like structure
    if (persona.advancedTraits) {
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text("Psychographics & Context", rightColX, rightY);
      rightY += 8;

      const traits = persona.advancedTraits;
      const addTraitRow = (label: string, value: string) => {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.setFont("helvetica", "bold");
        doc.text(label.toUpperCase(), rightColX, rightY);

        doc.setTextColor(17, 24, 39);
        doc.setFont("helvetica", "normal");
        doc.text(value.toString(), rightColX + 35, rightY);
        rightY += 6;
      };

      addTraitRow("Gender", traits.gender);
      addTraitRow("Tech Literacy", `${traits.techLiteracy}/3`);
      addTraitRow("Buying Power", traits.buyingPower);
      addTraitRow("Vibe", traits.vibe);
      addTraitRow("Context", traits.contextOfUse);
      addTraitRow("Decision Power", traits.decisionPower);
      rightY += 4;

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "bold");
      doc.text("CURRENT SOLUTION", rightColX, rightY);
      rightY += 5;
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "normal");
      const solLines = doc.splitTextToSize(traits.currentSolution || "None", rightColWidth);
      doc.text(solLines, rightColX, rightY);
      rightY += (solLines.length * 5) + 4;

      if (traits.constraints.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.setFont("helvetica", "bold");
        doc.text("CONSTRAINTS", rightColX, rightY);
        rightY += 5;
        doc.setTextColor(220, 38, 38); // red-600
        doc.setFont("helvetica", "normal");
        doc.text(traits.constraints.join(', '), rightColX, rightY);
        rightY += 10;
      }
    }

    // Brands
    rightY += 5;
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.text("Brands", rightColX, rightY);
    rightY += 6;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont("helvetica", "normal");
    doc.text(persona.brands.join(', '), rightColX, rightY);


    // --- TRANSCRIPT SECTION ---
    if (chatMessages.length > 0) {
      doc.addPage();
      let transY = 20;

      doc.setFontSize(16);
      doc.setTextColor(17, 24, 39);
      doc.setFont("helvetica", "bold");
      doc.text("Interview Transcript", margin, transY);
      transY += 15;

      chatMessages.forEach(msg => {
        const isUser = msg.role === 'user';
        const role = isUser ? 'Interviewer' : persona.name;
        const color = isUser ? [37, 99, 235] : [5, 150, 105]; // blue-600 vs emerald-600

        doc.setFontSize(10);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`${role}:`, margin, transY);
        transY += 5;

        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(msg.text, pageWidth - (margin * 2));
        doc.text(lines, margin, transY);
        transY += (lines.length * 5) + 6;

        // Page break check
        if (transY > pageHeight - 20) {
          // Footer
          const date = new Date().toLocaleString();
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175);
          doc.text(`Generated via PersonaFlow - ${date}`, pageWidth - 20, pageHeight - 10, { align: 'right' });

          doc.addPage();
          transY = 20;
        }
      });
    }

    doc.save(`${persona.name.replace(/\s+/g, '_')}_Persona.pdf`);
  };

  const startEditing = useCallback(() => {
    if (!persona) return;
    console.log("Starting edit mode for persona:", persona);
    setEditForm({ ...persona });
    setIsEditing(true);
  }, [persona]);

  const cancelEditing = useCallback(() => {
    console.log("Canceling edit mode");
    setIsEditing(false);
    setEditForm(null);
  }, []);

  const saveEdits = useCallback(() => {
    if (!editForm) return;
    console.log("Saving edits:", editForm);
    setPersona(editForm);
    setIsEditing(false);
    setChatStarted(false);
  }, [editForm]);

  const handleEditChange = useCallback((field: keyof Persona, value: any) => {
    console.log(`Editing field [${field}]:`, value);
    setEditForm(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  // Auth Selection Screen
  if (authMode === 'unselected') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Key className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-slate-800 tracking-tight">Access PersonaFlow</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">Choose how you want to access the platform.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/40 p-6 rounded-2xl border border-dashed border-slate-300 opacity-60 flex flex-col items-center cursor-not-allowed">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-3"><Lock className="w-6 h-6" /></div>
              <h3 className="font-bold text-slate-400 mb-1">Try Free</h3>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-4 px-2 py-0.5 bg-indigo-50 rounded">Coming Soon</p>
              <button disabled className="w-full py-2 bg-slate-200 text-slate-400 rounded-lg text-sm font-semibold mt-auto">Unavailable</button>
            </div>

            <div className="bg-white/50 p-6 rounded-2xl border border-white/60 hover:border-indigo-300 transition-all flex flex-col items-center">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full mb-3"><Lock className="w-6 h-6" /></div>
              <h3 className="font-bold text-slate-800 mb-1">Enter Key</h3>
              <p className="text-xs text-slate-500 mb-4">Unlimited Access</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (customApiKey) setAuthMode('custom');
              }} className="w-full space-y-2 mb-4">
                <input type="password" value={customApiKey} onChange={(e) => setCustomApiKey(e.target.value)} placeholder="Paste Gemini API Key" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" name="api-key" autoComplete="current-password" />
                <button type="submit" disabled={!customApiKey} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 mt-auto">Start Unlimited</button>
              </form>
            </div>
          </div>
          <button onClick={handleTestMode} className="mt-6 flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-xs font-medium transition-colors w-full"><Bug className="w-3 h-3" /> Test Mode</button>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="relative w-full font-sans text-slate-800 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden flex flex-col lg:h-screen lg:overflow-hidden min-h-screen">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-60 h-60 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-60 h-60 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-white/20 backdrop-blur-2xl"></div>
      </div>

      {/* Toast */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-medium">
          <Check className="w-4 h-4" /> {toastMessage}
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 px-6 z-20 bg-white/30 backdrop-blur-md border-b border-white/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/40 rounded-xl border border-white/50 shadow-sm">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">PersonaFlow</h1>
          {authMode === 'free' && (
            <span className="hidden md:inline-flex px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full items-center gap-2 border border-green-200">
              Free Tier
              <span className="font-normal opacity-70">( {usage.personasGenerated}/5 P )</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => {
              setAuthMode('unselected');
              setPersona(null);
              setChatStarted(false);
              setChatMessages([]);
            }}
            className="p-2.5 bg-white/40 hover:bg-white/60 text-slate-600 hover:text-indigo-600 rounded-xl border border-white/50 transition-all active:scale-95"
            title="Go to Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white/50 rounded-full transition-colors"
            title="Help"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          {persona && (
            <button onClick={resetGenerator} className="px-4 py-2 bg-white/40 hover:bg-white/60 text-slate-600 text-sm font-medium rounded-full border border-white/50 transition-all flex items-center gap-2">
              <RefreshCcw className="w-3 h-3" />
              <span className="hidden sm:inline">New Persona</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-4 min-h-0 p-4 lg:p-6 max-w-[1400px] mx-auto w-full z-10">

        {/* Left Panel */}
        <div className="relative w-full h-[600px] lg:h-full lg:min-h-0 transition-all duration-500 ease-in-out shrink-0">
          {/* Input Form Overlay */}
          <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${persona ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            <div className="h-full bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-4 md:p-6 flex flex-col justify-center overflow-y-auto">
              <div className="max-w-sm mx-auto w-full text-center">
                <h2 className="text-xl font-bold text-slate-800 mb-1">Build your user.</h2>
                <p className="text-sm text-slate-600 mb-4">Describe the product context.</p>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Product</label>
                    <input value={inputs.productName} onChange={e => setInputs({ ...inputs, productName: e.target.value })} className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Meditation App" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Core Problem</label>
                    <textarea value={inputs.problem} onChange={e => setInputs({ ...inputs, problem: e.target.value })} className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-24 resize-none" placeholder="e.g. High stress in tech jobs" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleGenerate} disabled={loading || !inputs.productName} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                      {loading ? loadingMsg : "Generate"}
                    </button>
                    <button onClick={() => setShowSettingsModal(true)} className="px-3 bg-white/50 text-indigo-600 rounded-xl border border-white/60 hover:bg-white/80"><SlidersHorizontal className="w-5 h-5" /></button>
                    <button onClick={fillRandom} className="px-3 bg-white/50 text-indigo-600 rounded-xl border border-white/60 hover:bg-white/80"><Dice5 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persona Card Component */}
          <div className={`absolute inset-0 transition-all duration-700 ease-in-out ${persona ? 'opacity-100 scale-100 delay-100' : 'opacity-0 pointer-events-none scale-95'}`}>
            <PersonaCard
              persona={persona}
              isEditing={isEditing}
              editForm={editForm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              chatMessages={chatMessages}
              handlers={{
                generatePDF, startEditing, saveEdits, cancelEditing, handleEditChange, setShowPromptModal
              }}
            />
          </div>
        </div>

        {/* Right Panel: Chat Interface */}
        <div className={`w-full h-[500px] lg:h-full lg:min-h-0 transition-all duration-700 ease-in-out shrink-0 ${persona ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
          <div className="h-full bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl flex flex-col overflow-hidden relative">

            {!persona && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
                <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center mb-2"><MessageSquare className="w-6 h-6 text-slate-400" /></div>
                <h3 className="text-lg font-semibold text-slate-600 mb-1">Interview Room</h3>
                <p className="text-xs text-slate-500 max-w-xs">Generate a persona to start chatting.</p>
              </div>
            )}

            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-white/30 flex items-center justify-between bg-white/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full bg-indigo-100 overflow-hidden">
                  {persona && <img src={persona.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{persona ? persona.name : 'User'}</h3>
                  <p className="text-xs text-slate-500">{persona ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleClearChat} disabled={!persona} className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100"><Trash2 className="w-5 h-5" /></button>
                <button onClick={() => showToast("Live Voice Interview Coming Soon!")} disabled={!persona} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100"><Mic className="w-5 h-5" /></button>
              </div>
            </div>

            {chatStarted ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm backdrop-blur-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white/60 text-slate-800 border border-white/50 rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/60 border border-white/50 px-4 py-3.5 rounded-2xl rounded-bl-none flex gap-1.5 items-center w-16 justify-center">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white/30 border-t border-white/30 shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-center gap-2">
                    <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/60 border-none rounded-full px-5 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/80 transition-all outline-none shadow-sm" />
                    <button type="submit" disabled={!inputMessage.trim()} className="absolute right-2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md"><Send className="w-4 h-4 ml-0.5" /></button>
                  </form>
                </div>
              </>
            ) : persona ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <button onClick={startChat} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Speak with User</button>
                <button onClick={() => setShowPromptModal(true)} className="px-8 py-3 bg-white/50 text-slate-700 font-bold rounded-xl border border-white/60 hover:bg-white/80 transition-all flex items-center justify-center gap-2"><Copy className="w-4 h-4" /> Copy Prompt</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSettingsModal && (
        <AdvancedSettingsModal
          onClose={() => setShowSettingsModal(false)}
          settings={advancedSettings}
          setSettings={setAdvancedSettings}
          onRandomize={randomizeTabSettings}
          onReset={() => setAdvancedSettings(DEFAULT_ADVANCED)}
        />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {showPromptModal && persona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Copy className="w-5 h-5 text-indigo-600" /> Copy Prompt</h3>
              <button onClick={() => setShowPromptModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <button onClick={() => { copyToClipboard(getSystemInstruction(persona)); setShowPromptModal(false); }} className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" /> Copy for Gemini</button>
              <button onClick={() => { copyToClipboard(`Act as a user persona for a user research interview.\n\n${getSystemInstruction(persona)}`); setShowPromptModal(false); }} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"><MessageSquare className="w-5 h-5" /> Copy for ChatGPT</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;