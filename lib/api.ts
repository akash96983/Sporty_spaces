const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const authAPI = {
  // Signup new user
  signup: async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    return res.json();
  },

  // Login user
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  // Get current user
  getMe: async (token: string) => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  },

  // Logout
  logout: async (token: string) => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  }
};
