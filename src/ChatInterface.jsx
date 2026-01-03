import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentToken } from './store/authSlice';
import { useGetVoicesQuery, useGetHistoryQuery, apiSlice } from './store/apiSlice';
import { Upload, FileText, FileAudio, Bot, Mic, Volume2, StopCircle, Settings, Plus, Menu, X, Send, Sparkles, User, ChevronDown, PanelLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export default function ChatInterface() {

    const token = useSelector(selectCurrentToken);
    const dispatch = useDispatch();

    const { data: voiceData } = useGetVoicesQuery();
    const { data: historyData, refetch: refetchHistory } = useGetHistoryQuery();

    const [chatList, setChatList] = useState([]);
    const [messages, setMessages] = useState([]);
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState("");
    const [input, setInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentAction, setCurrentAction] = useState("");
    const [currentChatId, setCurrentChatId] = useState('temp');
    const [showSidebar, setShowSidebar] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState("");
    const [showVoiceMenu, setShowVoiceMenu] = useState(false);
    const [useGeneralKnowledge, setUseGeneralKnowledge] = useState(true);

    const chatEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const isUserInteracting = useRef(false);

    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        if (shouldAutoScrollRef.current && !isUserInteracting.current) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, currentAction, extractedText]);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (!isUserInteracting.current) {
            shouldAutoScrollRef.current = isAtBottom;
        }
    };

    const handleInteractionStart = () => { isUserInteracting.current = true; };
    const handleInteractionEnd = () => {
        isUserInteracting.current = false;
        handleScroll();
    };
    useEffect(() => {
        if (historyData) {
            const tempChat = { id: 'temp', title: 'New Chat' };
            setChatList([tempChat, ...historyData]);
        }
    }, [historyData]);
    useEffect(() => {
        fetchVoices();
        const initHistory = async () => {
            try {
                const res = await fetch('http://192.168.100.61:5000/api/history', { headers: getAuthHeaders() });
                const data = await res.json();
                const tempChat = { id: 'temp', title: 'New Chat' };
                setChatList([tempChat, ...data]);
                setCurrentChatId('temp');
            } catch (e) {
                console.error("History Error:", e);
            }
        };
        initHistory();
    }, []);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentAction]);
    const streamBufferRef = useRef("");
const streamRequest = async (endpoint, body) => {
        try {
            if (!token) {
                console.error("No authentication token found!");
                alert("Please log in again.");
                return { fullText: "", requestId: null };
            }

            const headers = { 'Authorization': `Bearer ${token}` };
            
            if (!(body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            const res = await fetch(`http://192.168.100.61:5000/api${endpoint}`, {
                method: 'POST',
                headers,
                body: body instanceof FormData ? body : JSON.stringify(body)
            });
            if (res.status === 401 || res.status === 403) {
                console.error("Authentication failed or expired.");
                return { fullText: "", requestId: null };
            }
            
            if (!res.ok) throw new Error(`Server Error: ${res.statusText}`);
            const newChatId = res.headers.get('X-Chat-ID');
            const requestId = res.headers.get('X-Request-ID');
            if (newChatId) {
                dispatch(apiSlice.util.invalidateTags(['History']));
                setCurrentChatId(newChatId);
            }
            setMessages(p => [...p, { role: 'ai', content: "" }]);
            if (requestId) {
                fetchCachedAudio(requestId, messages.length);
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            streamBufferRef.current = "";
            let networkStreamDone = false;
            const consumeNetworkStream = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        networkStreamDone = true;
                        break;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    streamBufferRef.current += chunk;
                }
            };
            consumeNetworkStream();
            let displayedIndex = 0;
            await new Promise((resolve) => {
                const typeWriterInterval = setInterval(() => {
                    const targetText = streamBufferRef.current;
                    if (displayedIndex < targetText.length) {
                        const lag = targetText.length - displayedIndex;
                        const step = lag > 50 ? 5 : (lag > 20 ? 3 : 2);
                        const nextChunk = targetText.slice(displayedIndex, displayedIndex + step);
                        setMessages(prev => {
                            const newMsgs = [...prev];
                            const lastIdx = newMsgs.length - 1;
                            if (lastIdx >= 0 && newMsgs[lastIdx].role === 'ai') {
                                newMsgs[lastIdx] = {
                                    ...newMsgs[lastIdx],
                                    content: targetText.slice(0, displayedIndex + nextChunk.length)
                                };
                            }
                            return newMsgs;
                        });

                        displayedIndex += nextChunk.length;
                    }
                    else if (networkStreamDone) {
                        clearInterval(typeWriterInterval);
                        resolve();
                    }
                }, 30);
            });
            return { fullText: streamBufferRef.current, requestId };
        } catch (e) {
            console.error(e);
            return { fullText: "", requestId: null };
        }
    };
    const fetchVoices = () => {
        fetch('http://192.168.100.61:5000/api/voices', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setAvailableVoices(data.voices);
                const defaultVoice = data.voices.find(v => v.id.includes('lessac')) || data.voices[0];
                if (defaultVoice) setSelectedVoice(defaultVoice.id);
            }).catch(e => console.error(e));
    };
    const fetchHistory = async () => {
        try {
            const res = await fetch('http://192.168.100.61:5000/api/history', { headers: getAuthHeaders() });
            const data = await res.json();
            const tempChat = { id: 'temp', title: 'New Chat' };
            setChatList([tempChat, ...data]);
        } catch (e) { console.error(e); }
    };
    const loadChat = async (id) => {
        if (id === 'temp') {
            startNewChat(true);
            return;
        }
        setIsProcessing(true);
        setCurrentAction("Loading chat...");
        shouldAutoScrollRef.current = false;
        try {
            const res = await fetch(`http://192.168.100.61:5000/api/history/${id}`, { headers: getAuthHeaders() });
            const data = await res.json();
            setExtractedText(data.context || "");
            setMessages(data.Messages || data.messages || []);
            setCurrentChatId(data.id);
            setFile(null);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
            if (window.innerWidth < 768) setShowSidebar(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
            setCurrentAction("");
        }
    };
    const startNewChat = (clear = true) => {
        if (clear) {
            setMessages([]);
            setExtractedText("");
            setFile(null);
        }
        if (chatList.length > 0 && chatList[0].id === 'temp') {
            setCurrentChatId('temp');
        } else {
            const tempChat = { id: 'temp', title: 'New Chat' };
            setChatList(prev => [tempChat, ...prev]);
            setCurrentChatId('temp');
        }
        if (window.innerWidth < 768) setShowSidebar(false);
    };
    const handleSpeak = async (msg) => {
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
        if (msg.audioCache && msg.audioVoice === selectedVoice) {
            console.log("Playing from Cache (Zero Latency)");
            audioChunksToPlay = msg.audioCache;
        }
        else {
            console.log("Cache miss or voice changed. Fetching...");
            try {
                const res = await fetch('http://192.168.100.61:5000/api/speak', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    },
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
                    const headers = getAuthHeaders();
                    const res = await fetch('http://192.168.100.61:5000/api/transcribe', { method: 'POST', headers, body: formData });
                    const data = await res.json();
                    if (data.text) setInput(prev => prev + " " + data.text);
                } catch (err) { console.error(err); } finally { setIsProcessing(false); stream.getTracks().forEach(t => t.stop()); }
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) { alert("Mic access denied"); }
    };
    const handleFileChange = (e) => { setFile(e.target.files[0]); e.target.value = null; };
    const handleAnalyze = async () => {
        if (!file) return;
        shouldAutoScrollRef.current = true;
        setMessages([]); setIsProcessing(true); setCurrentAction("Analyzing...");
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('voiceId', selectedVoice);
            const { fullText } = await streamRequest('/analyze', formData);
            if (fullText) setExtractedText(fullText);
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
            setCurrentAction("");
        }
    };
    const fetchCachedAudio = async (requestId, msgIndex) => {
        let isComplete = false;
        while (!isComplete) {
            try {
                const res = await fetch(`http://192.168.100.61:5000/api/audio/${requestId}`, { headers: getAuthHeaders() });
                const data = await res.json();
                if (data.audioChunks && data.audioChunks.length > 0) {
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs[msgIndex]) {
                            const currentLen = newMsgs[msgIndex].audioCache?.length || 0;
                            if (data.audioChunks.length > currentLen) {
                                newMsgs[msgIndex] = {
                                    ...newMsgs[msgIndex],
                                    audioCache: data.audioChunks,
                                    audioVoice: selectedVoice
                                };
                            }
                        }
                        return newMsgs;
                    });
                }
                isComplete = data.isComplete;
                if (!isComplete) {
                    await new Promise(r => setTimeout(r, 500));
                }
            } catch (e) {
                console.error("Polling Error:", e);
                break;
            }
        }
    };
    const handleChat = async () => {
        if (!input.trim()) return;
        shouldAutoScrollRef.current = true;
        const msg = input; setInput("");
        setMessages(p => [...p, { role: 'user', content: msg }]);
        setIsProcessing(true); setCurrentAction("Thinking...");
        try {
            await streamRequest('/chat', {
                message: msg,
                voiceId: selectedVoice,
                chatId: currentChatId
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };
    const getIcon = () => {
        if (!file) return <Upload className="w-10 h-10 text-blue-500 mb-2" />;
        if (file.type.startsWith('audio')) return <FileAudio className="w-10 h-10 text-purple-500 mb-2" />;
        return <FileText className="w-10 h-10 text-blue-500 mb-2" />;
    };
    return (
        <div className="h-screen bg-[#030303] text-gray-100 flex overflow-hidden font-sans selection:bg-blue-500/30">
            
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* --- COLLAPSIBLE GLASS SIDEBAR --- */}
            <div 
                className={`
                    relative z-30 h-full bg-black/60 backdrop-blur-2xl border-r border-white/5 
                    transition-all duration-300 ease-in-out overflow-hidden flex flex-col
                    ${showSidebar ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'}
                `}
            >
                <div className="w-80 flex flex-col h-full"> {/* Fixed width wrapper to prevent content squishing during transition */}
                    
                    {/* Header */}
                    <div className="p-5 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                                <Bot size={18} className="text-white" />
                            </div>
                            <span>AI Docs</span>
                        </div>
                        <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white transition p-1 hover:bg-white/10 rounded-lg">
                            <PanelLeft size={20} />
                        </button>
                    </div>

                    {/* New Chat Button */}
                    <div className="p-4">
                        <button onClick={() => startNewChat()} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-3 rounded-xl transition-all duration-200 group">
                            <Plus size={18} className="group-hover:scale-110 transition-transform"/> 
                            <span className="font-medium text-sm">New Analysis</span>
                        </button>
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                        <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</p>
                        {chatList.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => loadChat(chat.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm truncate transition-all duration-200 ${
                                    currentChatId === chat.id 
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                                }`}
                            >
                                {chat.title}
                            </button>
                        ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center">
                                <User size={14} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Muhammad Ali</p>
                                <p className="text-xs text-gray-500 truncate">Pro Plan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col h-screen relative z-10 min-w-0">
                
                {/* Top Bar (Toggle & Menu) */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
                    {/* Toggle Sidebar Button (Visible when sidebar is closed) */}
                    <button 
                        onClick={() => setShowSidebar(!showSidebar)} 
                        className={`pointer-events-auto p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all ${showSidebar ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                    >
                        <PanelLeft size={20} />
                    </button>
                </div>

                {/* Messages Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-4 md:px-8 pb-48 scroll-smooth" // Added massive pb-48 to clear the floating island
                >
                    <div className="max-w-3xl mx-auto pt-14">
                        
                        {/* Empty State */}
                        {(messages.length === 0 && currentChatId === 'temp') ? (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in-up">
                                <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-8 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
                                    <Sparkles className="w-10 h-10 text-blue-400" />
                                </div>
                                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                                    What are we analyzing?
                                </h1>
                                <p className="text-gray-400 mb-8 max-w-md">
                                    Upload documents, videos, or audio to get started with advanced RAG analysis.
                                </p>
                                
                                <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
                                <label 
                                    htmlFor="file-upload" 
                                    className="group relative w-full max-w-md border border-dashed border-white/20 rounded-2xl p-10 cursor-pointer hover:bg-white/5 hover:border-blue-500/50 transition-all duration-300 flex flex-col items-center"
                                >
                                    <div className="absolute inset-0 bg-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                                    {getIcon()}
                                    <span className="text-lg font-medium text-gray-300 group-hover:text-white transition relative z-10">
                                        {file ? file.name : "Drop a file here"}
                                    </span>
                                    <span className="text-sm text-gray-500 mt-2 relative z-10">PDF, MP4, MP3, DOCX</span>
                                </label>

                                <button 
                                    onClick={handleAnalyze} 
                                    disabled={!file || isProcessing} 
                                    className="mt-8 px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                >
                                    {isProcessing ? "Analyzing..." : "Start Analysis"}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {messages.map((msg, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end'} group`}
                                    >
                                        
                                        {/* AI Icons (Bottom Left) */}
                                        {msg.role === 'ai' && (
                                            <div className="flex flex-col items-center gap-2 mb-1 shrink-0">
                                                <button 
                                                    onClick={() => handleSpeak(msg)} 
                                                    className={`p-1.5 rounded-full transition-all duration-300 ${
                                                        isSpeaking && i === messages.length - 1 
                                                        ? 'bg-red-500/20 text-red-400' 
                                                        : 'text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                                                    }`}
                                                >
                                                    {isSpeaking && i === messages.length - 1 
                                                        ? <StopCircle size={14} /> 
                                                        : <Volume2 size={14} />
                                                    }
                                                </button>
                                                
                                                <div className="w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-lg shadow-blue-900/10">
                                                    <Bot size={16} className="text-blue-400" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div 
                                            className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-7 shadow-lg backdrop-blur-sm border ${
                                                msg.role === 'user' 
                                                ? 'bg-blue-600 text-white border-blue-500 rounded-br-none' 
                                                : 'bg-white/5 text-gray-200 border-white/10 rounded-bl-none'
                                            }`}
                                        >
                                            {msg.role === 'ai' ? (
                                                <ReactMarkdown 
                                                    components={{
                                                        strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                                                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-white border-b border-white/10 pb-2" {...props} />,
                                                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
                                                        code: ({node, ...props}) => <code className="bg-black/50 border border-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-blue-300" {...props} />,
                                                        p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                                                        ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1 mb-3" {...props} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {currentAction && (
                            <div className="flex items-center justify-center gap-2 mt-6 text-gray-500 text-sm animate-pulse">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"/>
                                {currentAction}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* --- FLOATING INPUT ISLAND --- */}
                {/* Centered detached island with shadow and backdrop blur */}
                <div className="absolute bottom-6 left-0 right-0 px-4 z-20 flex justify-center">
                    <div className="w-full max-w-3xl bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl shadow-black/50 ring-1 ring-white/5">
                        <div className="flex flex-col gap-3">
                            
                            {/* Controls Row */}
                            <div className="flex justify-between items-center px-2">
                                {/* Knowledge Toggle */}
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${useGeneralKnowledge ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-transparent'}`}>
                                        {useGeneralKnowledge && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={useGeneralKnowledge} 
                                        onChange={(e) => setUseGeneralKnowledge(e.target.checked)} 
                                    />
                                    <span className="text-xs text-gray-400 group-hover:text-gray-200 transition font-medium">General Knowledge</span>
                                </label>

                                {/* Voice Selector */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowVoiceMenu(!showVoiceMenu)} 
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded-full hover:bg-white/5"
                                    >
                                        <Settings size={12} />
                                        <span className="truncate max-w-[100px]">{availableVoices.find(v => v.id === selectedVoice)?.name || "Default Voice"}</span>
                                    </button>
                                    {showVoiceMenu && (
                                        <div className="absolute bottom-full right-0 mb-3 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                            {availableVoices.map(v => (
                                                <button 
                                                    key={v.id} 
                                                    onClick={() => { setSelectedVoice(v.id); setShowVoiceMenu(false) }} 
                                                    className={`w-full text-left px-4 py-2.5 text-xs truncate hover:bg-white/5 transition ${selectedVoice === v.id ? 'text-blue-400 bg-white/5' : 'text-gray-400'}`}
                                                >
                                                    {v.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Input Bar */}
                            <div className="relative flex items-center gap-2">
                                <div className="relative flex-1 group">
                                    <input 
                                        value={input} 
                                        onChange={e => setInput(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && handleChat()} 
                                        placeholder="Ask a follow-up question..." 
                                        className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl py-3.5 pl-5 pr-14 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner text-sm" 
                                    />
                                    <button 
                                        onClick={handleChat} 
                                        disabled={!input.trim()} 
                                        className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={handleMicClick} 
                                    className={`p-3.5 rounded-2xl border transition-all ${
                                        isRecording 
                                        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                                </button>
                            </div>
                            
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}