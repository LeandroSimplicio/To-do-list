// Gerenciador de Tarefas Atualizado
class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = "all";
    this.currentPriorityFilter = "";
    this.currentStatusFilter = "";
    this.currentSearch = "";
    this.currentSort = "createdAt";
    this.currentPage = 1;
    this.tasksPerPage = 10;
    this.totalTasks = 0;
    this.stats = {};

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadCategories();
  }

  bindEvents() {
    // Formulário de nova tarefa
    document.getElementById("task-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Campo de busca
    const searchInput = document.getElementById("search-input");
    let searchTimeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.currentSearch = e.target.value;
        this.currentPage = 1; // Reset para primeira página
        this.loadTasks();
      }, 300); // Debounce de 300ms
    });

    // Filtros e ordenação
    document
      .getElementById("category-filter")
      .addEventListener("change", (e) => {
        this.currentFilter = e.target.value;
        this.currentPage = 1; // Reset para primeira página
        this.loadTasks();
      });

    document
      .getElementById("priority-filter")
      .addEventListener("change", (e) => {
        this.currentPriorityFilter = e.target.value;
        this.currentPage = 1; // Reset para primeira página
        this.loadTasks();
      });

    document.getElementById("status-filter").addEventListener("change", (e) => {
      this.currentStatusFilter = e.target.value;
      this.currentPage = 1; // Reset para primeira página
      this.loadTasks();
    });

    document.getElementById("sort-select").addEventListener("change", (e) => {
      this.currentSort = e.target.value;
      this.loadTasks();
    });

    // Botão de atualizar dashboard
    document
      .getElementById("refresh-dashboard")
      .addEventListener("click", () => {
        this.loadDashboardStats();
      });
  }

  async loadCategories() {
    try {
      const categories = await api.getCategories();
      this.populateCategorySelects(categories);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }

  populateCategorySelects(categories) {
    const selects = ["task-category", "category-filter"];

    selects.forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (select) {
        // Limpar opções existentes (exceto "Todas" no filtro)
        if (selectId === "category-filter") {
          select.innerHTML = '<option value="all">Todas as Categorias</option>';
        } else {
          select.innerHTML = "";
        }

        // Adicionar categorias
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.value;
          option.textContent = category.label;
          select.appendChild(option);
        });
      }
    });
  }

  async handleAddTask() {
    const title = document.getElementById("task-input").value.trim();
    const category = document.getElementById("task-category").value;
    const priority = document.getElementById("task-priority").value;
    const dueDate = document.getElementById("task-due-date").value;

    if (!title) {
      this.showNotification("Por favor, digite uma tarefa", "error");
      return;
    }

    const taskData = {
      title,
      category,
      priority,
      dueDate: dueDate || null,
    };

    try {
      await api.createTask(taskData);
      this.clearForm();
      this.loadTasks();
      this.loadDashboardStats();
      this.showNotification("Tarefa adicionada com sucesso!", "success");
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  async loadTasks() {
    try {
      const params = {
        page: this.currentPage,
        limit: this.tasksPerPage,
        sortBy: this.currentSort,
        sortOrder: "desc",
      };

      // Adicionar filtro de busca
      if (this.currentSearch && this.currentSearch.trim()) {
        params.search = this.currentSearch.trim();
      }

      // Adicionar filtro de categoria
      if (
        this.currentFilter &&
        this.currentFilter !== "all" &&
        this.currentFilter !== ""
      ) {
        params.category = this.currentFilter;
      }

      // Adicionar filtro de prioridade
      if (this.currentPriorityFilter && this.currentPriorityFilter !== "") {
        params.priority = this.currentPriorityFilter;
      }

      // Adicionar filtro de status
      if (this.currentStatusFilter && this.currentStatusFilter !== "") {
        if (this.currentStatusFilter === "overdue") {
          params.overdue = "true";
        } else {
          params.completed = this.currentStatusFilter;
        }
      }

      const response = await api.getTasks(params);
      this.tasks = response.tasks;
      this.totalTasks = response.pagination.totalTasks;

      this.renderTasks();
      this.renderPagination();
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      this.showNotification("Erro ao carregar tarefas", "error");
    }
  }

  renderTasks() {
    const taskList = document.getElementById("tasks-list");

    if (this.tasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-list">
          <i class="fas fa-clipboard-list"></i>
          <p>Nenhuma tarefa encontrada</p>
        </div>
      `;
      return;
    }

    taskList.innerHTML = this.tasks
      .map((task) => this.createTaskHTML(task))
      .join("");
    this.bindTaskEvents();
  }

  createTaskHTML(task) {
    const isCompleted = task.completed;
    const isOverdue =
      task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
    const isDueSoon =
      task.dueDate && this.isDueSoon(task.dueDate) && !isCompleted;

    return `
      <li class="task-item ${isCompleted ? "completed" : ""}" data-task-id="${
      task._id
    }">
        <div class="task-content">
          <div class="task-main">
            <input type="checkbox" class="task-checkbox" ${
              isCompleted ? "checked" : ""
            }>
            <span class="task-text">${task.title}</span>
            
            <div class="task-badges">
              <span class="category-badge category-${
                task.category
              }">${this.getCategoryLabel(task.category)}</span>
              <span class="priority-badge priority-${task.priority}">${
      task.priority
    }</span>
              ${
                task.dueDate
                  ? `
                <span class="due-date ${
                  isOverdue ? "overdue" : isDueSoon ? "due-soon" : ""
                }">
                  <i class="fas fa-calendar"></i> ${this.formatDate(
                    task.dueDate
                  )}
                </span>
              `
                  : ""
              }
            </div>
          </div>
          
          <div class="task-actions">
            <button class="edit-btn" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" title="Excluir">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        ${
          task.subtasks && task.subtasks.length > 0
            ? `
          <div class="subtasks">
            ${task.subtasks
              .map(
                (subtask) => `
              <div class="subtask ${subtask.completed ? "completed" : ""}">
                <input type="checkbox" ${subtask.completed ? "checked" : ""} 
                       onchange="taskManager.toggleSubtask('${task._id}', '${
                  subtask._id
                }')">
                <span>${subtask.title}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </li>
    `;
  }

  bindTaskEvents() {
    // Checkboxes das tarefas
    document.querySelectorAll(".task-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const taskId = e.target.closest(".task-item").dataset.taskId;
        this.toggleTask(taskId, e.target.checked);
      });
    });

    // Botões de editar
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.closest(".task-item").dataset.taskId;
        this.editTask(taskId);
      });
    });

    // Botões de excluir
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const taskId = e.target.closest(".task-item").dataset.taskId;
        this.deleteTask(taskId);
      });
    });
  }

  async toggleTask(taskId, completed) {
    try {
      await api.updateTask(taskId, { completed });
      this.loadTasks();
      this.loadDashboardStats();

      const message = completed ? "Tarefa concluída!" : "Tarefa reaberta!";
      this.showNotification(message, "success");
    } catch (error) {
      this.showNotification(error.message, "error");
      this.loadTasks(); // Recarregar para reverter mudança visual
    }
  }

  async toggleSubtask(taskId, subtaskId) {
    try {
      const task = this.tasks.find((t) => t._id === taskId);
      const subtask = task.subtasks.find((s) => s._id === subtaskId);

      await api.updateTask(taskId, {
        subtasks: task.subtasks.map((s) =>
          s._id === subtaskId ? { ...s, completed: !s.completed } : s
        ),
      });

      this.loadTasks();
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  async editTask(taskId) {
    const task = this.tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Preencher formulário com dados da tarefa
    document.getElementById("task-input").value = task.title;
    document.getElementById("task-category").value = task.category;
    document.getElementById("task-priority").value = task.priority;

    if (task.dueDate) {
      document.getElementById("task-due-date").value =
        task.dueDate.split("T")[0];
    }

    // Alterar comportamento do formulário para edição
    const form = document.getElementById("task-form");
    form.dataset.editingId = taskId;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "Atualizar Tarefa";

    // Focar no input
    document.getElementById("task-input").focus();
  }

  async deleteTask(taskId) {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) {
      return;
    }

    try {
      await api.deleteTask(taskId);
      this.loadTasks();
      this.loadDashboardStats();
      this.showNotification("Tarefa excluída com sucesso!", "success");
    } catch (error) {
      this.showNotification(error.message, "error");
    }
  }

  async loadDashboardStats() {
    try {
      const stats = await api.getDashboardStats();
      this.stats = stats;
      this.renderDashboard();
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }

  renderDashboard() {
    const dashboard = document.getElementById("dashboard");
    if (!dashboard || !this.stats.general) return;

    const { general, byCategory, byPriority, weekly } = this.stats;

    dashboard.innerHTML = `
      <h3><i class="fas fa-chart-bar"></i> Painel de Controle</h3>
      
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-number">${general.total}</span>
          <span class="stat-label">Total de Tarefas</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${general.completed}</span>
          <span class="stat-label">Concluídas</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${general.pending}</span>
          <span class="stat-label">Pendentes</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${general.overdue}</span>
          <span class="stat-label">Atrasadas</span>
        </div>
      </div>

      <div class="stats-section">
        <h4>Por Categoria</h4>
        <div class="category-stats">
          ${byCategory
            .map(
              (cat) => `
            <div class="category-stat">
              <span class="category-badge category-${
                cat._id
              }">${this.getCategoryLabel(cat._id)}</span>
              <span>${cat.count} tarefas</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="stats-section">
        <h4>Por Prioridade</h4>
        <div class="priority-stats">
          ${byPriority
            .map(
              (pri) => `
            <div class="priority-stat">
              <span class="priority-badge priority-${pri._id}">${pri._id}</span>
              <span>${pri.count} tarefas</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderPagination() {
    const totalPages = Math.ceil(this.totalTasks / this.tasksPerPage);
    const pagination = document.getElementById("pagination");

    if (!pagination || totalPages <= 1) {
      if (pagination) pagination.innerHTML = "";
      return;
    }

    let paginationHTML = "";

    // Botão anterior
    if (this.currentPage > 1) {
      paginationHTML += `<button onclick="taskManager.goToPage(${
        this.currentPage - 1
      })">Anterior</button>`;
    }

    // Números das páginas
    for (let i = 1; i <= totalPages; i++) {
      if (i === this.currentPage) {
        paginationHTML += `<button class="active">${i}</button>`;
      } else {
        paginationHTML += `<button onclick="taskManager.goToPage(${i})">${i}</button>`;
      }
    }

    // Botão próximo
    if (this.currentPage < totalPages) {
      paginationHTML += `<button onclick="taskManager.goToPage(${
        this.currentPage + 1
      })">Próximo</button>`;
    }

    pagination.innerHTML = paginationHTML;
  }

  goToPage(page) {
    this.currentPage = page;
    this.loadTasks();
  }

  clearForm() {
    const form = document.getElementById("task-form");
    form.reset();
    delete form.dataset.editingId;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "Adicionar Tarefa";
  }

  getCategoryLabel(category) {
    const labels = {
      work: "Trabalho",
      personal: "Pessoal",
      shopping: "Compras",
      health: "Saúde",
      study: "Estudos",
      other: "Outros",
    };
    return labels[category] || category;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  }

  isDueSoon(dateString) {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
      notification.classList.remove("show");
    }, 4000);
  }
}

// Inicializar TaskManager quando a página carregar e o usuário estiver autenticado
document.addEventListener("DOMContentLoaded", () => {
  // Aguardar um pouco para garantir que outros scripts foram carregados
  setTimeout(() => {
    if (window.authManager && window.authManager.isAuthenticated()) {
      window.taskManager = new TaskManager();
    }
  }, 100);
});
