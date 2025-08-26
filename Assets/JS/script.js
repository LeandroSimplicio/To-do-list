// Script principal atualizado para integração com autenticação e API

// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    // Carrega o tema salvo
    loadTheme();
    
    // Inicializar componentes apenas se estiver autenticado
    if (window.authManager && window.authManager.isAuthenticated()) {
        initializeApp();
    }
    
    // Atualizar links sociais
    updateSocialLinks();
    
    // Melhorar experiência mobile
    enhanceMobileExperience();
});

// Função para inicializar a aplicação após autenticação
function initializeApp() {
    // Carregar dados do dashboard
    if (window.taskManager) {
        window.taskManager.loadTasks();
        window.taskManager.loadDashboardStats();
    }
    
    // Focar no input de tarefa
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
        taskInput.focus();
    }
}

// Função para alternar entre os temas claro e escuro
function toggleTheme() {
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    
    // Atualizar preferências do usuário se estiver logado
    if (window.authManager && window.authManager.isAuthenticated()) {
        const theme = document.body.getAttribute('data-theme') || 'light';
        updateUserPreferences({ theme });
    }
}

// Função para carregar o tema salvo
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
}

// Função para atualizar preferências do usuário
async function updateUserPreferences(preferences) {
    try {
        await api.updateUserPreferences(preferences);
    } catch (error) {
        console.error('Erro ao atualizar preferências:', error);
    }
}

// Função para melhorar a experiência mobile
function enhanceMobileExperience() {
    // Detectar se é um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Adicionar classe para dispositivos móveis
        document.body.classList.add('mobile-device');
        
        // Ajustar viewport para evitar zoom em inputs
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Melhorar interação com tarefas em dispositivos móveis
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Detectar swipe horizontal em itens de tarefa
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            if (diffX > 0) {
                // Swipe para esquerda - mostrar ações
                taskItem.classList.add('swipe-left');
            } else {
                // Swipe para direita - esconder ações
                taskItem.classList.remove('swipe-left');
            }
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
}

// Função para atualizar links sociais
function updateSocialLinks() {
    const socialLinks = document.querySelectorAll('.social-links a');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Adicionar analytics ou tracking se necessário
            console.log(`Link social clicado: ${link.href}`);
        });
    });
}

// Função para exportar dados do usuário
async function exportUserData() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        return;
    }
    
    try {
        const data = await api.exportUserData();
        
        // Criar arquivo para download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-list-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        if (window.taskManager) {
            window.taskManager.showNotification('Dados exportados com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        if (window.taskManager) {
            window.taskManager.showNotification('Erro ao exportar dados', 'error');
        }
    }
}

// Função para importar dados do usuário
function importUserData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validar estrutura dos dados
            if (!data.user || !data.tasks) {
                throw new Error('Formato de arquivo inválido');
            }
            
            // Confirmar importação
            if (!confirm('Isso irá substituir todos os seus dados atuais. Continuar?')) {
                return;
            }
            
            // Importar tarefas
            for (const task of data.tasks) {
                await api.createTask({
                    title: task.title,
                    category: task.category,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    completed: task.completed
                });
            }
            
            // Recarregar dados
            if (window.taskManager) {
                window.taskManager.loadTasks();
                window.taskManager.loadDashboardStats();
                window.taskManager.showNotification('Dados importados com sucesso!', 'success');
            }
            
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            if (window.taskManager) {
                window.taskManager.showNotification('Erro ao importar dados: ' + error.message, 'error');
            }
        }
    });
    
    input.click();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botão de alternância de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Botões de exportar/importar (se existirem)
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportUserData);
    }
    
    const importBtn = document.getElementById('import-data');
    if (importBtn) {
        importBtn.addEventListener('click', importUserData);
    }
});

// Função global para inicializar após login
window.initializeAppAfterLogin = initializeApp;