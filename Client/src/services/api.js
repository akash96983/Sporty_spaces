const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class PlaygroundAPI {
  static getAuthHeaders(token) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  static async getAllPlaygrounds(token = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/playgrounds`, {
        headers: this.getAuthHeaders(token)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playgrounds');
      }
      
      return data.data; // Return the playgrounds array
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
      throw error;
    }
  }

  static async createPlayground(playgroundData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/playgrounds`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(playgroundData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create playground');
      }
      
      return data.data; // Return the created playground
    } catch (error) {
      console.error('Error creating playground:', error);
      throw error;
    }
  }

  static async getUserPlaygrounds(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/playgrounds/user/my-spaces`, {
        headers: this.getAuthHeaders(token)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user playgrounds');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching user playgrounds:', error);
      throw error;
    }
  }

  static async getPlaygroundById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/playgrounds/${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch playground');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching playground:', error);
      throw error;
    }
  }

  static async updatePlayground(id, playgroundData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/playgrounds/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(playgroundData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update playground');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error updating playground:', error);
      throw error;
    }
  }

  static async deletePlayground(id, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/playgrounds/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete playground');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting playground:', error);
      throw error;
    }
  }
}

export default PlaygroundAPI;
