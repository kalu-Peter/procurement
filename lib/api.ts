
// API configuration and helper functions for PHP backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    const result = await this.request('/auth/logout', {
      method: 'POST',
    });
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    return result;
  }

  // Asset endpoints
  async getAssets(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/assets${params ? `?${params}` : ''}`);
  }

  async getAsset(id: string) {
    return this.request<any>(`/assets/${id}`);
  }

  async createAsset(assetData: any) {
    return this.request<any>('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  async updateAsset(id: string, assetData: any) {
    return this.request<any>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
  }

  async deleteAsset(id: string) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Transfer endpoints
  async getTransfers(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/transfers${params ? `?${params}` : ''}`);
  }

  async createTransfer(transferData: any) {
    return this.request<any>('/transfers', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async approveTransfer(id: string, notes?: string) {
    return this.request(`/transfers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectTransfer(id: string, notes?: string) {
    return this.request(`/transfers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Disposal endpoints
  async getDisposals(filters?: any) {
    const params = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/disposals${params ? `?${params}` : ''}`);
  }

  async createDisposal(disposalData: any) {
    return this.request<any>('/disposals', {
      method: 'POST',
      body: JSON.stringify(disposalData),
    });
  }

  async approveDisposal(id: string, notes?: string) {
    return this.request(`/disposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectDisposal(id: string, notes?: string) {
    return this.request(`/disposals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Excel import endpoint
  async importAssets(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseURL}/assets/import`, {
      method: 'POST',
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    }).then(response => response.json());
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
