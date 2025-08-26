// Gerenciador de Autenticação
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Verificar se há token salvo
    if (api.isAuthenticated()) {
      this.loadUserProfile();
    } else {
      this.showAuthContainer();
    }

    this.bindEvents();
  }

  bindEvents() {
    // Eventos dos formulários
    document
      .getElementById("login-form-element")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });

    document
      .getElementById("register-form-element")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegister();
      });

    // Alternar entre login e registro
    document.getElementById("show-register").addEventListener("click", (e) => {
      e.preventDefault();
      this.showRegisterForm();
    });

    document.getElementById("show-login").addEventListener("click", (e) => {
      e.preventDefault();
      this.showLoginForm();
    });

    // Menu do usuário
    document
      .getElementById("user-menu-toggle")
      .addEventListener("click", () => {
        this.toggleUserMenu();
      });

    document.getElementById("logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      this.logout();
    });

    // Fechar menu ao clicar fora
    document.addEventListener("click", (e) => {
      const userMenu = document.querySelector(".user-menu");
      if (!userMenu.contains(e.target)) {
        this.closeUserMenu();
      }
    });
  }

  async handleLogin() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      this.showNotification("Por favor, preencha todos os campos", "error");
      return;
    }

    try {
      this.showLoading("login-form-element");

      const response = await api.login({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      });

      this.currentUser = response.user;
      this.showNotification(response.message, "success");
      this.showAppContainer();

      // Carregar dados da aplicação
      if (window.taskManager) {
        window.taskManager.loadTasks();
      }
    } catch (error) {
      this.showNotification(error.message, "error");
    } finally {
      this.hideLoading("login-form-element");
    }
  }

  async handleRegister() {
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    if (!name || !email || !password) {
      this.showNotification("Por favor, preencha todos os campos", "error");
      return;
    }

    if (password.length < 6) {
      this.showNotification(
        "A senha deve ter pelo menos 6 caracteres",
        "error"
      );
      return;
    }

    try {
      this.showLoading("register-form-element");

      const response = await api.register({
        name: document.getElementById("register-name").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value,
      });

      this.currentUser = response.user;
      this.showNotification(response.message, "success");
      this.showAppContainer();
    } catch (error) {
      this.showNotification(error.message, "error");
    } finally {
      this.hideLoading("register-form-element");
    }
  }

  async loadUserProfile() {
    try {
      const response = await api.getProfile();
      this.currentUser = response.user;
      this.showAppContainer();

      // Carregar dados da aplicação
      if (window.taskManager) {
        window.taskManager.loadTasks();
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      this.logout();
    }
  }

  showLoginForm() {
    document.getElementById("login-form").classList.add("active");
    document.getElementById("register-form").classList.remove("active");
  }

  showRegisterForm() {
    document.getElementById("register-form").classList.add("active");
    document.getElementById("login-form").classList.remove("active");
  }

  showAuthContainer() {
    document.getElementById("auth-container").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  }

  showAppContainer() {
    document.getElementById("auth-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";

    // Atualizar nome do usuário
    if (this.currentUser) {
      document.getElementById("user-name").textContent = this.currentUser.name;
    }
  }

  toggleUserMenu() {
    const dropdown = document.getElementById("user-dropdown");
    dropdown.classList.toggle("show");
  }

  closeUserMenu() {
    const dropdown = document.getElementById("user-dropdown");
    dropdown.classList.remove("show");
  }

  logout() {
    api.logout();
    this.currentUser = null;
    this.showAuthContainer();
    this.clearForms();
    this.showNotification("Logout realizado com sucesso", "success");
  }

  clearForms() {
    document.getElementById("login-form-element").reset();
    document.getElementById("register-form-element").reset();
  }

  showLoading(formId) {
    const form = document.getElementById(formId);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
  }

  hideLoading(formId) {
    const form = document.getElementById(formId);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = false;

    if (formId === "login-form-element") {
      button.textContent = "Entrar";
    } else {
      button.textContent = "Cadastrar";
    }
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
      notification.classList.remove("show");
    }, 4000);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser && api.isAuthenticated();
  }
}

// Instância global do gerenciador de autenticação
window.authManager = new AuthManager();
