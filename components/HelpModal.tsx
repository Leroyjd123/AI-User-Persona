import React from 'react';
import { X, User, MessageSquare, Mic, Sparkles } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">How PersonaFlow Works</h2>
            <p className="text-sm text-slate-500">Your guide to AI-driven user research.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          <div className="flex gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl">1</div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Define the Context
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Start by describing your <strong>Product</strong> and the <strong>Problem</strong> you are solving. 
                Use the "Customize" settings to fine-tune the persona's demographics, tech literacy, and attitude (e.g., "Skeptical Buyer" vs "Early Adopter").
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-bold text-xl">2</div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" /> Generate Persona
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The AI creates a realistic user profile with a backstory, motivations, and frustrations. You can <strong>Edit</strong> any field manually or <strong>Save</strong> the persona to your browser for later.
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center font-bold text-xl">3</div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" /> Interview & Validate
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Chat with the persona to test your assumptions. 
                Use the <strong>Live Voice <Mic className="w-3 h-3 inline"/></strong> feature for a real-time audio interview (requires Gemini API key).
                Export the transcript as a PDF when finished.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

export default HelpModal;
