import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentToken } from './store/authSlice';
import { useGetVoicesQuery, useGetHistoryQuery, apiSlice } from './store/apiSlice';
import { Upload, FileText, FileAudio, Bot, Mic, Volume2, StopCircle, Settings, Plus, Menu, X, Send } from 'lucide-react';
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
                const res = await fetch('http://localhost:5000/api/history', { headers: getAuthHeaders() });
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

            const res = await fetch(`http://localhost:5000/api${endpoint}`, {
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
        fetch('http://localhost:5000/api/voices', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setAvailableVoices(data.voices);
                const defaultVoice = data.voices.find(v => v.id.includes('lessac')) || data.voices[0];
                if (defaultVoice) setSelectedVoice(defaultVoice.id);
            }).catch(e => console.error(e));
    };
    const fetchHistory = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/history', { headers: getAuthHeaders() });
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
            const res = await fetch(`http://localhost:5000/api/history/${id}`, { headers: getAuthHeaders() });
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
                const res = await fetch('http://localhost:5000/api/speak', {
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
                    const res = await fetch('http://localhost:5000/api/transcribe', { method: 'POST', headers, body: formData });
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
                const res = await fetch(`http://localhost:5000/api/audio/${requestId}`, { headers: getAuthHeaders() });
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
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-row overflow-hidden transition-colors duration-200">
            <div className={`fixed inset-y-0 left-0 z-20 w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                            <Bot size={20} className="text-blue-600" /> History
                        </h2>
                        <button onClick={() => setShowSidebar(false)} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-4">
                        <button onClick={() => startNewChat(true)} className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition font-medium">
                            <Plus size={18} /> New Analysis
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 space-y-1">
                        {chatList.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => loadChat(chat.id)}
                                className={`w-full text-left p-3 rounded-lg text-sm truncate transition ${
                                    currentChatId === chat.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                                }`}>
                                {chat.title}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-600">
                        <span>{chatList.length - 1} chats stored</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col h-screen relative bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
                    {!showSidebar && (
                        <button onClick={() => setShowSidebar(true)} className="pointer-events-auto p-2 bg-white dark:bg-gray-800 shadow-md rounded-lg md:hidden text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                            <Menu size={20} />
                        </button>
                    )}
                    <div className="pointer-events-auto ml-auto">
                    </div>
                </div>
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    onMouseDown={handleInteractionStart}
                    onMouseUp={handleInteractionEnd}
                    onTouchStart={handleInteractionStart}
                    onTouchEnd={handleInteractionEnd}
                    className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
                    <div className="max-w-3xl mx-auto pt-10">
                        {(messages.length === 0 && currentChatId === 'temp') ? (
                            <div className="mb-10 text-center mt-10">
                                <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">What are we analyzing?</h1>
                                <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
                                <label htmlFor="file-upload" className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex flex-col items-center group">
                                    {getIcon()}
                                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{file ? file.name : "Drop a file here"}</span>
                                    <span className="text-sm text-gray-400 dark:text-gray-500 mt-2">PDF, Audio, Video supported</span>
                                </label>
                                <button onClick={handleAnalyze} disabled={!file || isProcessing} className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 transition shadow-lg disabled:shadow-none">
                                    {isProcessing ? "Analyzing..." : "Start Analysis"}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                                        {msg.role === 'ai' && (
                                            <div className="flex flex-col items-center mr-2 mt-1 gap-1">
                                                <div className="w-8 h-8 rounded-full bg-black dark:bg-gray-700 flex items-center justify-center text-white border border-transparent dark:border-gray-600">
                                                    <Bot size={16} />
                                                </div>
                                                <button onClick={() => handleSpeak(msg)} className="text-gray-400 hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 transition">
                                                    {isSpeaking && i === messages.length - 1
                                                        ? <StopCircle size={16} />
                                                        : (msg.audioCache && msg.audioVoice === selectedVoice ? <Volume2 size={16} className="text-green-500" /> : <Volume2 size={16} />)
                                                    }
                                                </button>
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                        }`}>
                                            {msg.role === 'ai'
                                                ? <ReactMarkdown components={{
                                                    strong: ({ node, ...props }) => <span className="font-bold text-gray-900 dark:text-white" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mt-2 mb-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mt-2 mb-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-3 mb-2 text-gray-900 dark:text-white" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-2 mb-2 text-gray-900 dark:text-white" {...props} />,
                                                    code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-gray-900 text-red-500 dark:text-red-400 px-1 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-gray-700" {...props} />,
                                                }}>{msg.content}</ReactMarkdown>
                                                : msg.content
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {currentAction && (
                            <div className="flex items-center gap-2 mt-4 text-gray-400 dark:text-gray-500 text-sm animate-pulse">
                                <Bot size={16} /> {currentAction}
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 p-4 transition-colors duration-200">
                    <div className="max-w-3xl mx-auto flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-2">
                            <input
                                type="checkbox"
                                id="knowledgeToggle"
                                checked={useGeneralKnowledge}
                                onChange={(e) => setUseGeneralKnowledge(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            />
                            <label htmlFor="knowledgeToggle" className="cursor-pointer select-none hover:text-gray-900 dark:hover:text-gray-200 transition">
                                Allow AI to use general knowledge
                            </label>
                        </div>
                        <div className="relative flex items-center gap-2">
                            <div className="relative">
                                <button onClick={() => setShowVoiceMenu(!showVoiceMenu)} className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                                    <Settings size={20} />
                                </button>
                                {showVoiceMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden z-50">
                                        {availableVoices.map(v => (
                                            <button 
                                                key={v.id} 
                                                onClick={() => { setSelectedVoice(v.id); setShowVoiceMenu(false) }} 
                                                className={`w-full text-left px-4 py-2 text-sm truncate hover:bg-gray-50 dark:hover:bg-gray-700 transition ${selectedVoice === v.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative flex-1">
                                <input 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleChat()} 
                                    placeholder="Ask follow-up..." 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition" 
                                />
                                <button 
                                    onClick={handleChat} 
                                    disabled={!input.trim()} 
                                    className="absolute right-2 top-2 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                    <Send size={18} />
                                </button>
                            </div>
                            <button 
                                onClick={handleMicClick} 
                                className={`p-3 rounded-full transition border border-transparent ${
                                    isRecording 
                                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                                }`}>
                                {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}