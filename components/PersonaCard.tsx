import React from 'react';
import { Download, Copy, Pencil, Save, X as XIcon, Briefcase, User as UserIcon, MapPin, FileText, History, Search, Cpu, Wallet, Zap, Quote, AlertCircle, ThumbsUp } from 'lucide-react';
import { Persona } from '../types';

interface PersonaCardProps {
  persona: Persona | null;
  isEditing: boolean;
  editForm: Persona | null;
  activeTab: 'details' | 'history';
  setActiveTab: (t: 'details' | 'history') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  chatMessages: any[];
  handlers: {
    generatePDF: () => void;
    startEditing: () => void;
    saveEdits: () => void;
    cancelEditing: () => void;
    handleEditChange: (field: keyof Persona, value: any) => void;
    setShowPromptModal: (v: boolean) => void;
  };
}

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona, isEditing, editForm, activeTab, setActiveTab, searchQuery, setSearchQuery, chatMessages, handlers
}) => {
  console.log("PersonaCard render - isEditing:", isEditing, "editForm:", editForm);
  if (!persona) return null;

  const filteredMotivations = persona.motivations.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFrustrations = persona.frustrations.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBrands = persona.brands.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Card Header with Avatar */}
      <div className="relative md:h-36 bg-gradient-to-r from-indigo-200/50 to-purple-200/50 p-4 md:p-6 flex flex-col md:flex-row items-center md:items-end gap-4 shrink-0 z-20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none"></div>

        {/* Avatar Wrapper */}
        <div className="group relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 md:-mb-10 z-10 cursor-default">
          <div className="w-full h-full rounded-full border-2 border-white/80 bg-white/80 shadow-lg overflow-hidden transition-all duration-300 group-hover:border-indigo-400 group-hover:shadow-indigo-500/30">
            <img
              src={persona.avatarUrl}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-slate-800/90 backdrop-blur text-white text-xs font-bold rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 whitespace-nowrap shadow-lg hidden md:block">
            {persona.name}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center md:text-left w-full pt-2 md:pt-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editForm?.name || ''}
                onChange={(e) => handlers.handleEditChange('name', e.target.value)}
                className="w-full bg-white/50 border border-white/60 rounded-lg px-2 py-1 text-xl font-bold text-slate-800 text-center md:text-left"
                placeholder="Name"
              />
              <div className="flex gap-2 justify-center md:justify-start">
                <input
                  type="text"
                  value={editForm?.occupation || ''}
                  onChange={(e) => handlers.handleEditChange('occupation', e.target.value)}
                  className="w-full bg-white/50 border border-white/60 rounded-lg px-2 py-1 text-sm text-slate-600"
                  placeholder="Occupation"
                />
                <input
                  type="number"
                  value={editForm?.age || ''}
                  onChange={(e) => handlers.handleEditChange('age', parseInt(e.target.value))}
                  className="w-20 bg-white/50 border border-white/60 rounded-lg px-2 py-1 text-sm text-slate-600"
                  placeholder="Age"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate">{persona.name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 text-slate-600 mt-1 text-sm font-medium flex-wrap">
                <span className="flex items-center gap-1 whitespace-nowrap"><Briefcase className="w-3 h-3" /> {persona.occupation}</span>
                <span className="flex items-center gap-1 whitespace-nowrap"><UserIcon className="w-3 h-3" /> {persona.age}y</span>
                <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="w-3 h-3" /> {persona.location}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-2 mb-0 md:mb-4 shrink-0 mt-4 md:mt-0 w-full md:w-auto">
          {!isEditing ? (
            <>
              <button
                onClick={handlers.generatePDF}
                className="bg-white/30 hover:bg-white/60 p-2.5 rounded-full backdrop-blur-md border border-white/40 text-indigo-900 transition-all shadow-sm"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlers.setShowPromptModal(true)}
                className="bg-white/30 hover:bg-white/60 p-2.5 rounded-full backdrop-blur-md border border-white/40 text-indigo-900 transition-all shadow-sm"
                title="Copy Prompt"
              >
                <Copy className="w-5 h-5" />
              </button>

              <button
                onClick={() => { console.log("Edit button clicked"); handlers.startEditing(); }}
                className="bg-white/30 hover:bg-white/60 p-2.5 rounded-full backdrop-blur-md border border-white/40 text-indigo-900 transition-all shadow-sm"
                title="Edit Persona"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { console.log("Save button clicked"); handlers.saveEdits(); }}
                className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-full shadow-lg transition-all"
                title="Save Changes"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={handlers.cancelEditing}
                className="bg-white/50 hover:bg-white/80 text-slate-600 p-2.5 rounded-full border border-white/40 transition-all"
                title="Cancel"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/30 px-4 md:px-6 bg-white/20 mt-4 md:mt-0 pt-8 md:pt-4">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${activeTab === 'details' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Profile</span>
          {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <span className="flex items-center gap-2"><History className="w-4 h-4" /> Transcript</span>
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
        </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">

        {activeTab === 'details' ? (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter details..."
                className="w-full bg-white/40 border border-white/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Advanced Details Display */}
            {persona.advancedTraits && (
              <div className="bg-white/30 rounded-2xl p-5 border border-white/40">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Cpu className="w-3 h-3" /> Psychographics & Context
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Tech Literacy</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(lvl => (
                        <div key={lvl} className={`h-1.5 w-4 rounded-full ${persona.advancedTraits!.techLiteracy >= lvl ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Buying Power</span>
                    <div className="flex items-center gap-1 text-slate-700 text-sm font-medium">
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      {persona.advancedTraits.buyingPower}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Vibe</span>
                    <div className="text-slate-700 text-sm font-medium truncate" title={persona.advancedTraits.vibe}>
                      {persona.advancedTraits.vibe}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Context</span>
                    <div className="text-slate-700 text-sm font-medium truncate flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-yellow-500" />
                      {persona.advancedTraits.contextOfUse}
                    </div>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Current Solution</span>
                    <div className="text-slate-700 text-sm font-medium truncate">
                      {persona.advancedTraits.currentSolution || "None"}
                    </div>
                  </div>
                  {persona.advancedTraits.constraints.length > 0 && (
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] uppercase text-slate-400 font-bold">Constraints</span>
                      <div className="flex flex-wrap gap-1">
                        {persona.advancedTraits.constraints.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px] border border-red-100">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quote */}
            <div className="relative pl-6">
              <Quote className="absolute left-0 top-0 w-3 h-3 text-indigo-400 rotate-180" />
              {isEditing ? (
                <textarea
                  value={editForm?.quote || ''}
                  onChange={(e) => handlers.handleEditChange('quote', e.target.value)}
                  className="w-full bg-white/50 border border-white/60 rounded-lg p-2 text-md italic text-slate-700 font-medium"
                  rows={2}
                />
              ) : (
                <p className="text-md italic text-slate-700 font-medium leading-normal">
                  {persona.quote}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About</h4>
              {isEditing ? (
                <textarea
                  value={editForm?.bio || ''}
                  onChange={(e) => handlers.handleEditChange('bio', e.target.value)}
                  className="w-full bg-white/50 border border-white/60 rounded-lg p-3 text-slate-600 leading-relaxed text-sm h-32"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed text-sm">
                  {persona.bio}
                </p>
              )}
            </div>

            {/* Frustrations & Motivations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(searchQuery === '' || filteredFrustrations.length > 0) && (
                <div className="bg-white/30 rounded-2xl p-5 border border-white/40">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Frustrations
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={editForm?.frustrations.join('\n') || ''}
                      onChange={(e) => handlers.handleEditChange('frustrations', e.target.value.split('\n'))}
                      className="w-full bg-white/50 border border-white/60 rounded-lg p-2 text-sm h-40"
                      placeholder="One per line"
                    />
                  ) : (
                    <ul className="space-y-2">
                      {(searchQuery ? filteredFrustrations : persona.frustrations).map((f, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-red-400 text-[10px] mt-1">●</span> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {(searchQuery === '' || filteredMotivations.length > 0) && (
                <div className="bg-white/30 rounded-2xl p-5 border border-white/40">
                  <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ThumbsUp className="w-3 h-3" /> Motivations
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={editForm?.motivations.join('\n') || ''}
                      onChange={(e) => handlers.handleEditChange('motivations', e.target.value.split('\n'))}
                      className="w-full bg-white/50 border border-white/60 rounded-lg p-2 text-sm h-40"
                      placeholder="One per line"
                    />
                  ) : (
                    <ul className="space-y-2">
                      {(searchQuery ? filteredMotivations : persona.motivations).map((m, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-green-500 text-[10px] mt-1">●</span> {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Brands */}
            {(searchQuery === '' || filteredBrands.length > 0) && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Brands</h4>
                {isEditing ? (
                  <input
                    value={editForm?.brands.join(', ') || ''}
                    onChange={(e) => handlers.handleEditChange('brands', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full bg-white/50 border border-white/60 rounded-lg p-2 text-sm"
                    placeholder="Comma separated"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(searchQuery ? filteredBrands : persona.brands).map((b, i) => (
                      <span key={i} className="px-3 py-1 bg-white/40 border border-white/50 rounded-lg text-xs font-medium text-slate-600">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Transcript View
          <div className="space-y-4">
            {chatMessages.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10 italic">No conversation history yet.</p>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className="flex flex-col gap-1 pb-4 border-b border-white/20 last:border-0">
                  <span className={`text-xs font-bold uppercase tracking-wide ${msg.role === 'user' ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {msg.role === 'user' ? 'Interviewer' : persona.name}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default PersonaCard;