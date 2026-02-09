import React from 'react';
import { X as XIcon, SlidersHorizontal, Globe, Monitor, Smartphone, Coffee, Eye, Battery, Loader2, Shuffle } from 'lucide-react';
import { AdvancedSettings } from '../types';

interface AdvancedSettingsModalProps {
    onClose: () => void;
    settings: AdvancedSettings;
    setSettings: (s: AdvancedSettings) => void;
    onRandomize: () => void;
    onReset: () => void;
}

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ onClose, settings, setSettings, onRandomize, onReset }) => {
    const [activeTab, setActiveTab] = React.useState<'identity' | 'mindset' | 'context'>('identity');

    // Helper for constraints
    const toggleConstraint = (c: string) => {
        const exists = settings.constraints.includes(c);
        setSettings({
            ...settings,
            constraints: exists ? settings.constraints.filter(i => i !== c) : [...settings.constraints, c]
        });
    };

    const RANDOM_VIBES = ['Skeptical 🧐', 'Early Adopter 🚀', 'Frustrated 😫', 'Professional 💼', 'Busy but Open ⏱️'];

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in">
            <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/60 rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col h-[85vh] md:h-auto md:max-h-[80vh] transition-all animate-in slide-in-from-bottom-10 duration-500">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Customize Persona
                        </h2>
                        <p className="text-xs text-slate-500">Fine-tune demographics and psychology.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-4 md:px-5 pt-3 gap-3 border-b border-white/50 bg-white/30">
                    {['identity', 'mindset', 'context'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 px-2 text-sm font-semibold capitalize relative transition-colors ${activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                        </button>
                    ))}
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

                    {/* IDENTITY TAB */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6 animate-in fade-in duration-300">

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Persona Name <span className="opacity-50 font-normal">(Override)</span></label>
                                <input
                                    type="text"
                                    value={settings.customName}
                                    onChange={e => setSettings({ ...settings, customName: e.target.value })}
                                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-slate-400"
                                    placeholder="e.g. John Doe (Leave empty for auto-gen)"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender Identity</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Male', 'Female', 'Non-binary', 'Any'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSettings({ ...settings, gender: opt as any })}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${settings.gender === opt
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white/50 hover:bg-white text-slate-600 border border-white/60'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age Range</label>
                                    <input
                                        type="text"
                                        value={settings.ageRange}
                                        onChange={e => setSettings({ ...settings, ageRange: e.target.value })}
                                        className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="e.g. 25-34"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nationality / Region</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={settings.nationality}
                                            onChange={e => setSettings({ ...settings, nationality: e.target.value })}
                                            className="w-full bg-white/50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            placeholder="e.g. Bangalore, India"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MINDSET TAB */}
                    {activeTab === 'mindset' && (
                        <div className="space-y-8 animate-in fade-in duration-300">

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tech Literacy</label>
                                    <span className="text-xs font-bold text-indigo-600">
                                        {settings.techLiteracy === 1 ? 'Novice' : settings.techLiteracy === 2 ? 'Competent' : 'Expert'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="1"
                                    value={settings.techLiteracy}
                                    onChange={e => setSettings({ ...settings, techLiteracy: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Needs Help</span>
                                    <span>Standard User</span>
                                    <span>Power User</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buying Power</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['Budget', 'Value', 'Premium', 'Enterprise'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSettings({ ...settings, buyingPower: opt as any })}
                                            className={`py-2 rounded-xl text-xs font-bold transition-all ${settings.buyingPower === opt
                                                    ? 'bg-slate-800 text-white shadow-lg'
                                                    : 'bg-white/50 hover:bg-white text-slate-600 border border-white/60'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vibe / Attitude</label>
                                <div className="flex flex-wrap gap-2">
                                    {RANDOM_VIBES.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSettings({ ...settings, vibe: opt })}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${settings.vibe === opt
                                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                    : 'bg-white/50 border-transparent text-slate-600 hover:bg-white'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Solution</label>
                                <input
                                    type="text"
                                    value={settings.currentSolution}
                                    onChange={e => setSettings({ ...settings, currentSolution: e.target.value })}
                                    className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder:text-slate-400"
                                    placeholder="e.g. Excel Spreadsheets"
                                />
                            </div>
                        </div>
                    )}

                    {/* CONTEXT TAB */}
                    {activeTab === 'context' && (
                        <div className="space-y-8 animate-in fade-in duration-300">

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Context of Use</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'Deep Work', icon: Monitor, desc: 'Desktop, Focused' },
                                        { id: 'On-the-Go', icon: Smartphone, desc: 'Mobile, Distracted' },
                                        { id: 'Leisure', icon: Coffee, desc: 'Tablet, Relaxed' },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSettings({ ...settings, contextOfUse: opt.id })}
                                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all text-left ${settings.contextOfUse === opt.id
                                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                    : 'bg-white/50 border-transparent hover:bg-white'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg ${settings.contextOfUse === opt.id ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                <opt.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 text-sm">{opt.id}</div>
                                                <div className="text-[10px] text-slate-400">{opt.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Decision Power</label>
                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    {['End User', 'Manager', 'Buyer'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setSettings({ ...settings, decisionPower: opt })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${settings.decisionPower === opt
                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Constraints & Accessibility</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'Visual Impairment', icon: Eye },
                                        { id: 'Non-Native Speaker', icon: Globe },
                                        { id: 'Low Tech Literacy', icon: Battery },
                                        { id: 'Slow Internet', icon: Loader2 },
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleConstraint(opt.id)}
                                            className={`pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 ${settings.constraints.includes(opt.id)
                                                    ? 'bg-red-50 border-red-200 text-red-700'
                                                    : 'bg-white/50 border-transparent text-slate-600 hover:bg-white'
                                                }`}
                                        >
                                            <opt.icon className="w-3.5 h-3.5" />
                                            {opt.id}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 md:p-5 border-t border-white/50 bg-white/30 flex justify-between items-center">
                    <button
                        onClick={onRandomize}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-[10px] md:text-xs font-semibold transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
                    >
                        <Shuffle className="w-3.5 h-3.5" /> Randomize Tab
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onReset}
                            className="text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-slate-500/30 transition-all active:scale-95"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSettingsModal;
