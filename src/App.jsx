import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, FileAudio, FileVideo, File, Send, Bot, Mic, Volume2, StopCircle, Settings, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState(""); 
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  
  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(""); 
  const [showVoiceMenu, setShowVoiceMenu] = useState(false); 
  
  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // Load voices
  useEffect(() => {
    fetch('http://localhost:5000/api/voices')
      .then(res => res.json())
      .then(data => {
        setAvailableVoices(data.voices);
        const defaultVoice = data.voices.find(v => v.id.includes('lessac')) || data.voices[0];
        if (defaultVoice) setSelectedVoice(defaultVoice.id);
      })
      .catch(err => console.error("Failed to load voices", err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentAction]);

  // --- NEW: Background Audio Generator (Zero Latency) ---
  const prefetchAudio = async (text, msgIndex) => {
    if (!text.trim()) return;

    // Capture the voice used for this pre-fetch
    const voiceUsed = selectedVoice; 

    try {
      // Call API silently
      const res = await fetch('http://localhost:5000/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text.replace(/[*#_`]/g, '').trim(),
          voiceId: voiceUsed 
        })
      });
      
      const data = await res.json();

      if (data.audioChunks) {
        // Update the specific message with the cached audio
        setMessages(prev => {
          const newMsgs = [...prev];
          if (newMsgs[msgIndex]) {
            newMsgs[msgIndex] = {
              ...newMsgs[msgIndex],
              audioCache: data.audioChunks, // Save audio here
              audioVoice: voiceUsed         // Remember which voice was used
            };
          }
          return newMsgs;
        });
        console.log(`Audio pre-fetched for message ${msgIndex}`);
      }
    } catch (e) {
      console.error("Audio pre-fetch failed", e);
    }
  };


  
  // --- UPDATED: Instant Playback Logic ---
  const handleSpeak = async (msg) => {
    // 1. Stop if playing
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    const text = msg.content;
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) return;

    setIsSpeaking(true);

    let audioChunksToPlay = null;

    // 2. CHECK CACHE: Do we already have the audio for this EXACT voice?
    if (msg.audioCache && msg.audioVoice === selectedVoice) {
      console.log("Playing from Cache (Zero Latency)");
      audioChunksToPlay = msg.audioCache;
    } 
    else {
      // 3. FALLBACK: Fetch now (if voice changed or cache failed)
      console.log("Cache miss or voice changed. Fetching...");
      try {
        const res = await fetch('http://localhost:5000/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voiceId: selectedVoice })
        });
        const data = await res.json();
        audioChunksToPlay = data.audioChunks;
      } catch (err) {
        console.error("TTS Error:", err);
        setIsSpeaking(false);
        return;
      }
    }

    // 4. Play the chunks
    if (audioChunksToPlay && audioChunksToPlay.length > 0) {
      let index = 0;
      const playNext = () => {
        if (index >= audioChunksToPlay.length) {
          setIsSpeaking(false);
          return;
        }
        const audio = new Audio("data:audio/wav;base64," + audioChunksToPlay[index]);
        audioRef.current = audio;
        audio.onended = () => { index++; playNext(); };
        audio.onerror = () => setIsSpeaking(false);
        audio.play();
      };
      playNext();
    }
  };

  // --- Recorder ---
  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.webm');
        try {
          const res = await fetch('http://localhost:5000/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.text) setInput(prev => prev + " " + data.text);
        } catch (err) { console.error(err); } finally { setIsProcessing(false); stream.getTracks().forEach(t => t.stop()); }
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Mic access denied"); }
  };

  const handleFileChange = (e) => { setFile(e.target.files[0]); e.target.value = null; };
  
  const streamResponse = async (response, callback) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; 
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      for (let char of chunk) { callback(prev => prev + char); await new Promise(r => setTimeout(r, 20)); }
    }
    return buffer; 
  };

const handleAnalyze = async () => {
    if (!file) return;
    setMessages([]); 
    setIsProcessing(true); 
    setCurrentAction("Analyzing..."); 
    
    try {
      const formData = new FormData(); 
      formData.append('file', file);
      
      // IMPORTANT: Send the selected voice so the server uses the right one in the background
      formData.append('voiceId', selectedVoice); 

      const res = await fetch('http://localhost:5000/api/analyze', { 
        method: 'POST', 
        body: formData 
      });

      // 1. Capture the Request ID from the server
      const requestId = res.headers.get('X-Request-ID');

      setCurrentAction(""); 
      setMessages([{ role: 'ai', content: "" }]);
      
      // 2. Stream the text
      const fullText = await streamResponse(res, (fn) => setMessages(prev => {
        const newMsgs = [...prev];
        const updatedMsg = { ...newMsgs[0] };
        updatedMsg.content = fn(updatedMsg.content);
        newMsgs[0] = updatedMsg;
        return newMsgs;
      }));
      
      setExtractedText(fullText);

      // 3. Retrieve the audio that was generated in parallel
      if (requestId) {
        // Index is 0 because analyze wipes previous chat
        fetchCachedAudio(requestId, 0); 
      }

    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const fetchCachedAudio = async (requestId, msgIndex) => {
    try {
      const res = await fetch(`http://localhost:5000/api/audio/${requestId}`);
      const data = await res.json();
      
      if (data.audioChunks && data.audioChunks.length > 0) {
        setMessages(prev => {
          const newMsgs = [...prev];
          if (newMsgs[msgIndex]) {
            newMsgs[msgIndex] = {
              ...newMsgs[msgIndex],
              audioCache: data.audioChunks,
              audioVoice: selectedVoice // Mark as ready
            };
          }
          return newMsgs;
        });
        console.log("Parallel Audio Retrieved!");
      }
    } catch (e) {
      console.error("Failed to fetch parallel audio", e);
    }
  };

  const handleChat = async () => {
    if (!input.trim()) return;
    const msg = input; 
    setInput(""); 
    const aiMsgIndex = messages.length + 1; // Index of the incoming AI message

    setMessages(p => [...p, { role: 'user', content: msg }]); 
    setIsProcessing(true); 
    setCurrentAction("Thinking...");
    
    try {
      const res = await fetch('http://localhost:5000/api/chat', { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          message: msg, 
          context: extractedText,
          voiceId: selectedVoice // Send voice choice for background processing
        }) 
      });

      // 1. Capture Request ID
      const requestId = res.headers.get('X-Request-ID');

      setCurrentAction(""); 
      setMessages(p => [...p, { role: 'ai', content: "" }]);
      
      // 2. Stream Text
      await streamResponse(res, (fn) => setMessages(prev => {
        const newMsgs = [...prev];
        const idx = newMsgs.length - 1;
        const updatedMsg = { ...newMsgs[idx] };
        updatedMsg.content = fn(updatedMsg.content);
        newMsgs[idx] = updatedMsg;
        return newMsgs;
      }));

      // 3. Immediately fetch the audio that was generating in background
      if (requestId) {
        fetchCachedAudio(requestId, aiMsgIndex);
      }

    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const getIcon = () => {
    if (!file) return <Upload className="w-10 h-10 text-blue-500 mb-2" />;
    if (file.type.startsWith('audio')) return <FileAudio className="w-10 h-10 text-purple-500 mb-2" />;
    return <FileText className="w-10 h-10 text-blue-500 mb-2" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col md:flex-row gap-6 h-[80vh]">
        
        {/* LEFT */}
        <div className="w-full md:w-1/3 flex flex-col border-r border-gray-100 pr-4">
          <h1 className="text-xl font-bold mb-4 text-gray-800">AI Assistant</h1>
          <input type="file" id="file-upload" className="hidden" onChange={handleFileChange}/>
          <label htmlFor="file-upload" className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center min-h-[200px]">
            {getIcon()} <span className="text-sm font-medium text-gray-600">{file ? file.name : "Click to Upload"}</span>
          </label>
          <button onClick={handleAnalyze} disabled={isProcessing || !file} className="mt-4 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition font-medium shadow-lg disabled:shadow-none">{isProcessing ? "Busy..." : "Start Analysis"}</button>
          
          {/* VOICE SELECTOR */}
          <div className="mt-auto pt-6 border-t border-gray-100">
             <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Assistant Voice</label>
             <div className="relative">
                <button onClick={() => setShowVoiceMenu(!showVoiceMenu)} className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-100 transition">
                  <span className="flex items-center gap-2"><Settings size={16} className="text-gray-500"/>{availableVoices.find(v => v.id === selectedVoice)?.name || "Default"}</span>
                </button>
                {showVoiceMenu && (
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                    {availableVoices.map(voice => (
                      <button key={voice.id} onClick={() => { setSelectedVoice(voice.id); setShowVoiceMenu(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition ${selectedVoice === voice.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'}`}>{voice.name}</button>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-2/3 flex flex-col h-full relative">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20 scrollbar-hide">
             {messages.length===0 && !currentAction && <div className="h-full flex flex-col items-center justify-center text-gray-300"><Bot className="w-12 h-12 mb-2"/><p>Ready</p></div>}
             {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                   
                   {/* AI Avatar & Speak Button (Only for AI) */}
                   {msg.role === 'ai' && (
                     <div className="flex flex-col items-center mr-2 mt-1 gap-1">
                       <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                         <Bot size={16}/>
                       </div>
                       <button 
                         onClick={() => handleSpeak(msg)} 
                         className="text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition"
                         title="Read Aloud"
                       >
                         {/* Logic: Show Stop if talking. Show Green Speaker if cached. Show Gray Speaker if normal. */}
                         {isSpeaking && i === messages.length - 1 
                            ? <StopCircle size={16}/> 
                            : (msg.audioCache && msg.audioVoice === selectedVoice 
                                ? <Volume2 size={16} className="text-green-500"/> 
                                : <Volume2 size={16}/>
                              )
                         }
                       </button>
                     </div>
                   )}

                   {/* Message Bubble */}
                   <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                   }`}>
                      {msg.role === 'ai' ? (
                        /* AI Message: Render Markdown (Bold, Lists, etc.) */
                        <ReactMarkdown 
                          components={{
                            strong: ({node, ...props}) => <span className="font-bold text-black" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 mt-2 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 mt-2 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-3 mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold mt-2 mb-2" {...props} />,
                            code: ({node, ...props}) => <code className="bg-gray-200 text-red-500 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-2" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        /* User Message: Keep simple text */
                        msg.content
                      )}
                   </div>

                </div>
             ))}
             {currentAction && <div className="flex justify-start animate-pulse"><div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white mr-2"><Bot size={16}/></div><div className="bg-gray-100 text-gray-500 p-3 rounded-2xl rounded-bl-none text-sm italic">{currentAction}</div></div>}
             <div ref={chatEndRef}/>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white pt-2">
             <div className="relative flex items-center gap-2">
                <div className="relative flex-1"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleChat()} placeholder="Ask or use mic..." disabled={isProcessing||messages.length===0} className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-black transition"/><button onClick={handleChat} disabled={!input.trim()||isProcessing} className="absolute right-2 top-2 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition"><Send size={18}/></button></div>
                <button onClick={handleMicClick} disabled={messages.length===0} className={`p-3 rounded-full transition shadow-md ${isRecording?'bg-red-500 text-white animate-pulse':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{isRecording?<StopCircle size={20}/>:<Mic size={20}/>}</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}