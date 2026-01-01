import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, Brain, Eye, Mic, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
          <Bot className="w-8 h-8 text-blue-600"/> 
          <span>AI Docs Analyzer</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="space-x-4 hidden md:block">
            <button onClick={() => navigate('/auth')} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium transition">
              Log In
            </button>
            <button onClick={() => navigate('/auth?mode=signup')} className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition font-medium">
              Get Started
            </button>
          </div>
        </div>
      </nav>
      <div className="text-center py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
          Chat with your Data <br/>
          <span className="text-blue-600 dark:text-blue-400">Powered by Gemini 2.5</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Experience the next generation of RAG. Upload PDFs, videos, or images and get 
          instant, context-aware answers with neural-quality voice playback.
        </p>
        <button onClick={() => navigate('/auth?mode=signup')} className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition shadow-lg shadow-blue-200 dark:shadow-blue-900/20 flex items-center gap-2 mx-auto">
          Try it Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 py-20">
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-gray-600 transition">
          <Brain className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4"/>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Deep Context (RAG)</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Powered by Pinecone vector search. The AI remembers every detail of your documents for accurate follow-up questions.
          </p>
        </div>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-gray-600 transition">
          <Eye className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4"/>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Multimodal Vision</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Don't just chat with text. Upload images, diagrams, or video lectures, and our vision model will analyze them instantly.
          </p>
        </div>
        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent dark:border-gray-700 hover:border-blue-100 dark:hover:border-gray-600 transition">
          <Mic className="w-10 h-10 text-red-500 dark:text-red-400 mb-4"/>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Neural Voice</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Listen to your summaries on the go. High-fidelity, local text-to-speech engine powered by Piper.
          </p>
        </div>

      </div>
      <div className="text-center pb-10 text-gray-400 dark:text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} AI Docs Analyzer. Built with React & Node.js.
      </div>
    </div>
  );
}