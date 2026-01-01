import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/authSlice';
import { useLoginMutation, useRegisterMutation } from './store/apiSlice';
import { ArrowLeft } from 'lucide-react';

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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 relative">
            <div className="absolute top-6 left-6">
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition font-medium">
                    <ArrowLeft size={20} /> Home
                </button>
            </div>
            
            <div className="absolute top-6 right-6">
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {isLogin ? 'Enter your details to access your workspace.' : 'Start your journey with AI Docs today.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                            <input
                                placeholder="johndoe"
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            placeholder="you@example.com"
                            type="email"
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input
                            placeholder="••••••••"
                            type="password"
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button 
                        disabled={isLoginLoading || isRegisterLoading} 
                        className="w-full bg-black dark:bg-blue-600 text-white p-3.5 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-blue-700 transition shadow-lg dark:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoginLoading || isRegisterLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="mt-6 text-center pt-6 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setIsLogin(!isLogin)} 
                            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}