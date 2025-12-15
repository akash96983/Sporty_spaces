'use client';

const API_BASE_URL = '/api';

// Token management
const TokenManager = {
  getToken(): string | null {
    return null;
  },

  setToken(_token: string): void {
    // Token now lives in an httpOnly cookie managed by the backend.
  },

  removeToken(): void {
    if (typeof document !== 'undefined') {
      document.cookie = 'token_client=; path=/; max-age=0; sameSite=Lax';
      document.cookie = 'token=; path=/; max-age=0; sameSite=Lax';
    }
  },

  getUser(): any {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  setUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },

  clearAll(): void {
    this.removeToken();
    this.removeUser();
  }
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });
};

interface SignupData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

const fetchAuthenticatedUser = async (): Promise<ApiResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to get user');
  }

  if (result.user) {
    TokenManager.setUser(result.user);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userUpdated'));
    }
  }

  return result;
};

export const authApi = {
  async signup(data: SignupData): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Signup failed');
    }

    // Cache authenticated user locally for client state
    if (result.user) {
      TokenManager.setUser(result.user);
    }

    // Dispatch event for UI updates
    window.dispatchEvent(new Event('userUpdated'));

    return result;
  },

  async login(data: LoginData): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    // Cache authenticated user locally for client state
    if (result.user) {
      TokenManager.setUser(result.user);
    }

    // Dispatch event for UI updates
    window.dispatchEvent(new Event('userUpdated'));

    return result;
  },

  async logout(): Promise<void> {
    try {
      await fetchWithAuth(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenManager.clearAll();
      window.dispatchEvent(new Event('userUpdated'));
    }
  },

  async getCurrentUser(): Promise<ApiResponse> {
    return fetchAuthenticatedUser();
  },

  getToken(): string | null {
    return null;
  },

  getUser(): any {
    return TokenManager.getUser();
  },

  isAuthenticated(): boolean {
    return !!TokenManager.getUser();
  },

  async ensureUser(): Promise<boolean> {
    if (TokenManager.getUser()) {
      return true;
    }

    try {
      await fetchAuthenticatedUser();
      return true;
    } catch {
      return false;
    }
  },

  async updateProfile(data: { username?: string; email?: string }): Promise<ApiResponse> {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/update-profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Profile update failed');
    }

    // Update user in localStorage
    if (result.user) {
      TokenManager.setUser(result.user);
    }

    return result;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Password change failed');
    }

    return result;
  },

  async deleteAccount(): Promise<ApiResponse> {
    const response = await fetchWithAuth(`${API_BASE_URL}/auth/delete-account`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Account deletion failed');
    }

    TokenManager.clearAll();
    window.dispatchEvent(new Event('userUpdated'));

    return result;
  },
};

// Export helper for other API calls
export { fetchWithAuth, TokenManager };
