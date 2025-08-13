// Selecionando elementos do DOM
const taskInput = document.getElementById('task-input');
const addButton = document.getElementById('add-button');
const tasksList = document.getElementById('tasks-list');

// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    // Foca no input ao carregar a página
    taskInput.focus();
    
    // Renderiza as tarefas salvas
    renderTasks();
    
    // Atualiza o nome do autor no rodapé (se existir)
    const authorElement = document.querySelector('.author');
    if (authorElement) {
        const savedAuthor = localStorage.getItem('author');
        if (savedAuthor) {
            authorElement.textContent = savedAuthor;
        } else {
            // Solicita o nome do usuário na primeira visita
            setTimeout(() => {
                const userName = prompt('Como você gostaria de ser chamado?', 'Seu Nome');
                if (userName && userName.trim() !== '' && userName !== 'Seu Nome') {
                    authorElement.textContent = userName;
                    localStorage.setItem('author', userName);
                }
            }, 1000);
        }
    }
});

// Array para armazenar as tarefas
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Função para renderizar as tarefas na tela
function renderTasks() {
    // Limpa a lista antes de renderizar
    tasksList.innerHTML = '';
    
    // Mensagem quando não há tarefas
    if (tasks.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-list';
        emptyMessage.innerHTML = '<i class="fas fa-clipboard-list"></i><p>Sua lista está vazia. Adicione uma nova tarefa!</p>';
        tasksList.appendChild(emptyMessage);
        return;
    }
    
    // Renderiza cada tarefa
    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.classList.add('task-item');
        if (task.completed) {
            taskItem.classList.add('completed');
        }
        
        // Cria o elemento de texto da tarefa
        const taskText = document.createElement('span');
        taskText.classList.add('task-text');
        taskText.textContent = task.text;
        
        // Cria o container para os botões de ação
        const taskActions = document.createElement('div');
        taskActions.classList.add('task-actions');
        
        // Botão de completar tarefa
        const completeBtn = document.createElement('button');
        completeBtn.classList.add('complete-btn');
        completeBtn.innerHTML = task.completed ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-check"></i>';
        completeBtn.title = task.completed ? 'Desfazer' : 'Completar';
        completeBtn.addEventListener('click', () => toggleComplete(index));
        
        // Botão de editar tarefa
        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-btn');
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Editar';
        editBtn.addEventListener('click', () => editTask(index));
        
        // Botão de deletar tarefa
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = 'Deletar';
        deleteBtn.addEventListener('click', () => deleteTask(index));
        
        // Adiciona os botões ao container de ações
        taskActions.appendChild(completeBtn);
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        // Adiciona os elementos ao item da tarefa
        taskItem.appendChild(taskText);
        taskItem.appendChild(taskActions);
        
        // Adiciona o item da tarefa à lista
        tasksList.appendChild(taskItem);
    });
    
    // Salva as tarefas no localStorage
    saveTasks();
}

// Função para adicionar uma nova tarefa
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText !== '') {
        // Adiciona a nova tarefa
        tasks.push({
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        // Limpa o input
        taskInput.value = '';
        
        // Renderiza as tarefas atualizadas
        renderTasks();
        
        // Foca no input para adicionar outra tarefa
        taskInput.focus();
        
        // Feedback visual
        showNotification('Tarefa adicionada com sucesso!', 'success');
    } else {
        // Feedback visual para campo vazio
        showNotification('Por favor, digite uma tarefa!', 'error');
        taskInput.focus();
    }
}

// Função para mostrar notificações
function showNotification(message, type) {
    // Remove notificações anteriores
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Cria a notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adiciona ícone baseado no tipo
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    notification.prepend(icon);
    
    // Adiciona ao corpo do documento
    document.body.appendChild(notification);
    
    // Anima a entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove após alguns segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Função para marcar/desmarcar uma tarefa como completa
function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    
    // Adiciona timestamp de conclusão
    if (tasks[index].completed) {
        tasks[index].completedAt = new Date().toISOString();
        showNotification('Tarefa concluída!', 'success');
    } else {
        delete tasks[index].completedAt;
        showNotification('Tarefa reativada!', 'success');
    }
    
    renderTasks();
}

// Função para editar uma tarefa
function editTask(index) {
    const newText = prompt('Editar tarefa:', tasks[index].text);
    
    if (newText !== null && newText.trim() !== '') {
        tasks[index].text = newText.trim();
        tasks[index].updatedAt = new Date().toISOString();
        renderTasks();
        showNotification('Tarefa atualizada!', 'success');
    } else if (newText !== null) {
        showNotification('A tarefa não pode estar vazia!', 'error');
    }
}

// Função para deletar uma tarefa
function deleteTask(index) {
    // Armazena o elemento da tarefa para animação
    const taskElement = document.querySelectorAll('.task-item')[index];
    
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        // Anima a remoção
        taskElement.style.opacity = '0';
        taskElement.style.transform = 'translateX(30px)';
        
        setTimeout(() => {
            // Remove do array após a animação
            tasks.splice(index, 1);
            renderTasks();
            showNotification('Tarefa removida!', 'success');
        }, 300);
    }
}

// Função para salvar as tarefas no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Event Listeners
addButton.addEventListener('click', addTask);

// Adicionar tarefa ao pressionar Enter no input
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Efeito de foco no input
taskInput.addEventListener('focus', () => {
    document.querySelector('.input-container').style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.25)';
});

taskInput.addEventListener('blur', () => {
    document.querySelector('.input-container').style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
});

// Melhorar a experiência em dispositivos móveis
function enhanceMobileExperience() {
    // Verificar se é um dispositivo móvel
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    if (isMobile) {
        // Ajustar o comportamento do teclado virtual
        taskInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                addTask();
                // Fechar o teclado virtual após adicionar a tarefa
                taskInput.blur();
            }
        });
        
        // Melhorar o comportamento de toque nos botões
        document.querySelectorAll('.complete-btn, .edit-btn, .delete-btn').forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            btn.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
        });
        
        // Evitar zoom ao tocar nos inputs em iOS
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
    }
}

// Chamar a função quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', enhanceMobileExperience);

// Atualiza os links sociais com os do usuário (se fornecidos)
function updateSocialLinks() {
    const githubLink = localStorage.getItem('githubLink');
    const linkedinLink = localStorage.getItem('linkedinLink');
    
    if (githubLink) {
        document.querySelector('a[title="GitHub"]').href = githubLink;
    }
    
    if (linkedinLink) {
        document.querySelector('a[title="LinkedIn"]').href = linkedinLink;
    }
}

// Chama a função para atualizar links sociais
document.addEventListener('DOMContentLoaded', updateSocialLinks);