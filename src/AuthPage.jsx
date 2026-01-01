import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/authSlice';
import { useLoginMutation, useRegisterMutation } from './store/apiSlice';
import { ArrowLeft, Sparkles, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const isSignupInit = searchParams.get('mode') === 'signup';
    const [isLogin, setIsLogin] = useState(!isSignupInit);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [login, { isLoading: isLoginLoading }] = useLoginMutation();
    const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                const userData = await login({ email: formData.email, password: formData.password }).unwrap();
                dispatch(setCredentials({ ...userData, token: userData.token }));
                navigate('/app');
            } else {
                await register(formData).unwrap();
                setIsLogin(true);
                alert("Account created! Please log in.");
            }
        } catch (err) {
            alert(err.data?.error || "Authentication failed");
        }
    };

    const isLoading = isLoginLoading || isRegisterLoading;

    return (
        <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30">
            
            {/* --- Ambient Background Glows --- */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none opacity-40 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none opacity-40" />

            {/* --- Top Navigation --- */}
            <div className="absolute top-8 left-8 z-20">
                <button 
                    onClick={() => navigate('/')} 
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 border border-white/5 transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Home
                </button>
            </div>

            {/* --- Glass Auth Card --- */}
            <div className="relative z-10 w-full max-w-md p-1 group">
                {/* Gradient Border Glow (Subtle pulse behind) */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                
                {/* UPDATED CONTAINER:
                   - hover:bg-black/50 (Brightens slightly from black/40)
                   - hover:border-white/20 (Brightens border from white/10)
                   - transition-all duration-300 (Smooths the effect)
                */}
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl shadow-black/50 hover:bg-black/50 hover:border-white/20 hover:shadow-blue-900/10 transition-all duration-300">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-300">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-2">
                            {isLogin ? 'Enter your credentials to access your workspace.' : 'Start analyzing your documents in seconds.'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 ml-1">Username</label>
                                <div className="relative group/input">
                                    <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" size={18} />
                                    <input
                                        required
                                        placeholder="johndoe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 focus:border-white/20 transition-all"
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Email Address</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" size={18} />
                                <input
                                    required
                                    placeholder="name@company.com"
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 focus:border-white/20 transition-all"
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 ml-1">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within/input:text-blue-400 transition-colors" size={18} />
                                <input
                                    required
                                    placeholder="••••••••"
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 focus:border-white/20 transition-all"
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button 
                            disabled={isLoading} 
                            className="w-full bg-white hover:bg-gray-100 text-black py-3.5 rounded-xl font-bold mt-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                            {isLoading ? (
                                <><Loader2 size={20} className="animate-spin" /> Processing...</>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Footer Toggle */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            {isLogin ? "New to AI Docs? " : "Already have an account? "}
                            <button 
                                onClick={() => setIsLogin(!isLogin)} 
                                className="text-white font-medium hover:underline underline-offset-4 decoration-blue-500 decoration-2 transition-all"
                            >
                                {isLogin ? 'Create Account' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}