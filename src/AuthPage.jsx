import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/authSlice';
import { useLoginMutation, useRegisterMutation } from './store/apiSlice';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <input
                            placeholder="Username"
                            className="w-full p-3 border rounded-lg bg-gray-50"
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    )}
                    <input
                        placeholder="Email"
                        type="email"
                        className="w-full p-3 border rounded-lg bg-gray-50"
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                    <input
                        placeholder="Password"
                        type="password"
                        className="w-full p-3 border rounded-lg bg-gray-50"
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button disabled={isLoginLoading || isRegisterLoading} className="w-full bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 transition">
                        {isLoginLoading || isRegisterLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold underline">
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
}