import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Brain, Eye, Mic, ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-blue-500/30 overflow-x-hidden relative font-sans">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-50 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl supports-[backdrop-filter]:bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-xl tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span>AI Docs</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/auth')} 
              className="hidden md:block text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/auth?mode=signup')} 
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
      <div className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm text-gray-300 mb-8 hover:bg-white/10 transition cursor-default">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Now with Gemini 2.5 Vision</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
          Your Second Brain.
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Stop searching, start knowing. Upload documents, video lectures, or images 
          and chat with them instantly using advanced <span className="text-blue-400 font-medium">RAG Memory</span>.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button 
            onClick={() => navigate('/auth?mode=signup')} 
            className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:scale-105 transition-transform duration-200"
          >
            Start Analyzing Free
            <div className="absolute inset-0 rounded-full blur-lg bg-white/30 -z-10 group-hover:bg-white/50 transition-colors" />
          </button>
          <button 
            className="px-8 py-4 rounded-full font-medium text-white border border-white/10 hover:bg-white/5 transition backdrop-blur-sm flex items-center gap-2"
          >
            View Demo <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/20 bg-[#0f0f0f]/50 backdrop-blur-sm aspect-[16/9] flex items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5" />
          <div className="text-center p-10">
             <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <Brain className="w-8 h-8 text-blue-400" />
             </div>
             <p className="text-gray-500 font-mono text-sm">Processing 1,024 vector embeddings...</p>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Engineered for clarity.</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-100">Instant Recall</h3>
            <p className="text-gray-400 leading-relaxed">
              Our Vector Database remembers every detail. Ask follow-up questions without repeating context.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-100">Multimodal Vision</h3>
            <p className="text-gray-400 leading-relaxed">
              Upload a video lecture or a diagram. The AI watches, analyzes, and transcribes it for you.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-100">Neural Voice</h3>
            <p className="text-gray-400 leading-relaxed">
              Listen to summaries on the go with our ultra-realistic, local-first Piper TTS engine.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 py-12 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Docs Analyzer. Built with React, Node & Gemini.</p>
      </footer>
    </div>
  );
}