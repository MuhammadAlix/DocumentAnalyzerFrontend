import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Bot className="w-8 h-8"/> AI Docs Analyzer
        </div>
        <div className="space-x-4">
          <button onClick={() => navigate('/auth')} className="text-gray-600 hover:text-black font-medium">Log In</button>
          <button onClick={() => navigate('/auth?mode=signup')} className="bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center py-20 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          Chat with your Documents <br/>
          <span className="text-blue-600">Powered by Gemini 2.5</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Upload PDFs, Audio, or Videos and get instant summaries, detailed analysis, and voice-enabled interactions.
        </p>
        <button onClick={() => navigate('/auth?mode=signup')} className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
          Try it Free
        </button>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 py-20">
        <div className="p-6 bg-gray-50 rounded-2xl">
          <Zap className="w-10 h-10 text-yellow-500 mb-4"/>
          <h3 className="text-xl font-bold mb-2">Instant Analysis</h3>
          <p className="text-gray-600">Stream results in real-time using parallel processing architecture.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl">
          <Shield className="w-10 h-10 text-green-500 mb-4"/>
          <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
          <p className="text-gray-600">Your data is processed securely with enterprise-grade encryption.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-2xl">
          <Globe className="w-10 h-10 text-purple-500 mb-4"/>
          <h3 className="text-xl font-bold mb-2">Multimodal</h3>
          <p className="text-gray-600">Works with PDFs, DOCX, MP3, MP4, and direct voice input.</p>
        </div>
      </div>
    </div>
  );
}