// Configuração da API
const API_BASE_URL = "http://localhost:3004/api";

// Classe para gerenciar a API
class API {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  // Configurar headers padrão
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na requisição");
      }

      return data;
    } catch (error) {
      console.error("Erro na API:", error);
      throw error;
    }
  }

  // Métodos de autenticação
  async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getProfile() {
    return await this.request("/auth/me");
  }

  async updateProfile(profileData) {
    return await this.request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return await this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  }

  // Métodos de tarefas
  async getTasks(filters = {}) {
    const queryParams = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== "") {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/tasks?${queryString}` : "/tasks";

    return await this.request(endpoint);
  }

  async getTask(id) {
    return await this.request(`/tasks/${id}`);
  }

  async createTask(taskData) {
    return await this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return await this.request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return await this.request(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  async addSubtask(taskId, subtaskData) {
    return await this.request(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify(subtaskData),
    });
  }

  async getDashboardStats() {
    return await this.request("/tasks/stats/dashboard");
  }

  // Métodos de usuário
  async getUserProfile() {
    return await this.request("/users/profile");
  }

  async updatePreferences(preferences) {
    return await this.request("/users/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }

  async updateAvatar(avatar) {
    return await this.request("/users/avatar", {
      method: "PUT",
      body: JSON.stringify({ avatar }),
    });
  }

  async exportData() {
    return await this.request("/users/export");
  }

  async getCategories() {
    return await this.request("/users/categories");
  }

  // Gerenciamento de token
  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  isAuthenticated() {
    return !!this.token;
  }

  // Logout
  logout() {
    this.removeToken();
    window.location.reload();
  }
}

// Instância global da API
const api = new API();

// Interceptor para lidar com erros de autenticação
const originalRequest = api.request.bind(api);
api.request = async function (endpoint, options = {}) {
  try {
    return await originalRequest(endpoint, options);
  } catch (error) {
    if (
      error.message.includes("Token") ||
      error.message.includes("Acesso negado")
    ) {
      // Token inválido ou expirado
      this.logout();
      return;
    }
    throw error;
  }
};

// Exportar para uso global
window.api = api;
