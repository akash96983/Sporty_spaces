'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../lib/api';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  const oauthBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/api\/?$/, '');

  // No auth check needed on login page - let middleware handle it

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setApiError(''); // Clear API error on input change
    
    if (touched[name as keyof typeof touched]) {
      const error = name === 'email' ? validateEmail(value) : validatePassword(value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = name === 'email' ? validateEmail(value) : validatePassword(value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      email: emailError,
      password: passwordError
    });
    
    setTouched({
      email: true,
      password: true
    });
    
    if (!emailError && !passwordError) {
      setIsLoading(true);
      setApiError('');
      
      try {
        const response = await authApi.login({
          email: formData.email,
          password: formData.password
        });
        
        // Redirect to home page on successful login
        router.push('/');
      } catch (error: any) {
        setApiError(error.message || 'Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-slate-50 flex justify-center items-center h-screen">
      {/* Left: About Section */}
      <div className="w-1/2 h-screen hidden lg:flex lg:flex-col lg:justify-center lg:items-start bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-20 py-16">
        <div className="max-w-md space-y-20">
          {/* Brand Section */}
          <div className="space-y-10">
            <div className="space-y-3">
              <h2 className="text-xl font-light tracking-wide text-slate-50">Sporty Spaces</h2>
              <div className="w-10 h-[1px] bg-emerald-500"></div>
            </div>
            <h1 className="text-[52px] font-extralight leading-[1.15] tracking-tight text-slate-50">
              Your Game,<br />Your Space,<br />Your Time
            </h1>
          </div>

          {/* Features List */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-8 h-[1px] bg-emerald-500/50"></div>
              <h3 className="text-xs font-light tracking-[0.2em] text-slate-300 uppercase">Real-Time Availability</h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-[1px] bg-emerald-500/50"></div>
              <h3 className="text-xs font-light tracking-[0.2em] text-slate-300 uppercase">Instant Confirmation</h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-[1px] bg-emerald-500/50"></div>
              <h3 className="text-xs font-light tracking-[0.2em] text-slate-300 uppercase">Flexible Pricing</h3>
            </div>
          </div>
        </div>
      </div>
      
     
      <div className="lg:px-20 lg:py-16 md:px-16 md:py-12 px-8 py-8 w-full lg:w-1/2 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
        <h1 className="text-3xl font-light mb-6 text-slate-800">Login</h1>
        
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{apiError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-light text-slate-600 mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email"
              disabled={isLoading}
              className={`w-full bg-white border rounded-lg py-2.5 px-4 text-slate-900 font-light placeholder:text-slate-400 placeholder:font-light focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.email && touched.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-emerald-500 focus:border-transparent'
              }`}
              autoComplete="email"
            />
            {errors.email && touched.email && (
              <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
            )}
          </div>
          
          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-light text-slate-600 mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                id="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                disabled={isLoading}
                className={`w-full bg-white border rounded-lg py-2.5 px-4 pr-12 text-slate-900 font-light placeholder:text-slate-400 placeholder:font-light focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.password && touched.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-emerald-500 focus:border-transparent'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
            )}
          </div>
          
          {/* Login Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-light rounded-lg py-2.5 px-4 w-full transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-50 text-slate-500 font-light">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <a
            href={`${oauthBaseUrl}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-light rounded-lg py-2.5 px-4 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <a
            href={`${oauthBaseUrl}/api/auth/github`}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-light rounded-lg py-2.5 px-4 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </a>
        </div>
        
        {/* Sign up Link */}
        <div className="mt-6 text-center">
          <span className="text-sm font-light text-slate-600">Don't have an account? </span>
          <Link href="/signup" className="text-sm font-light text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">Sign up</Link>
        </div>
        </div>
      </div>
    </div>
  );
}