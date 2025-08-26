# 📝 Lista de Tarefas Avançada (To-Do List)

Uma aplicação web moderna e completa para gerenciamento de tarefas, desenvolvida com Node.js, Express, MongoDB e uma interface responsiva.

## ✨ Funcionalidades

### 🔐 Sistema de Autenticação
- **Registro de usuários** com validação de dados
- **Login seguro** com JWT (JSON Web Tokens)
- **Proteção de rotas** e middleware de autenticação
- **Gerenciamento de sessão** persistente

### 📋 Gerenciamento de Tarefas
- **Criar, editar e excluir** tarefas
- **Marcar como concluída/pendente** com um clique
- **Categorização** por tipo (Trabalho, Pessoal, Estudos, Saúde, etc.)
- **Níveis de prioridade** (Baixa, Média, Alta, Urgente)
- **Datas de vencimento** com alertas visuais
- **Subtarefas** para melhor organização

### 🔍 Filtros e Busca
- **Filtrar por categoria** e prioridade
- **Filtrar por status** (Pendentes, Concluídas, Atrasadas)
- **Busca por texto** em tempo real
- **Ordenação** por data, prioridade ou título
- **Paginação** para melhor performance

### 📊 Painel de Controle (Dashboard)
- **Estatísticas em tempo real** das tarefas
- **Gráficos visuais** de progresso
- **Contadores** por categoria e prioridade
- **Indicadores** de produtividade

### 🎨 Interface e Experiência
- **Design moderno e responsivo**
- **Modo escuro/claro** alternável
- **Animações suaves** e transições
- **Notificações visuais** de feedback
- **Compatibilidade mobile** com gestos touch

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação por tokens
- **bcrypt** - Criptografia de senhas
- **cors** - Controle de acesso CORS
- **dotenv** - Gerenciamento de variáveis de ambiente

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com variáveis CSS
- **JavaScript ES6+** - Lógica da aplicação
- **Fetch API** - Comunicação com backend
- **LocalStorage** - Armazenamento local de preferências

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14 ou superior)
- MongoDB (local ou MongoDB Atlas)
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/todo-list-app.git
cd todo-list-app
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Banco de Dados
MONGODB_URI=mongodb://localhost:27017/todolist
# ou para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/todolist

# Configurações JWT
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
JWT_EXPIRE=7d

# Configurações do Servidor
PORT=3003
NODE_ENV=development

# Configurações de Segurança
BCRYPT_ROUNDS=12
```

### 4. Inicie o servidor
```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start
```

### 5. Acesse a aplicação
Abra seu navegador e acesse: `http://localhost:3004`

## 📁 Estrutura do Projeto

```
todo-list-app/
├── Assets/
│   ├── CSS/
│   │   ├── style.css          # Estilos principais
│   │   └── responsive.css     # Estilos responsivos
│   ├── JS/
│   │   ├── api.js            # Comunicação com API
│   │   ├── authManager.js    # Gerenciamento de autenticação
│   │   ├── taskManager.js    # Gerenciamento de tarefas
│   │   └── script.js         # Script principal
│   └── img/                  # Imagens e assets
├── config/
│   └── database.js           # Configuração do banco
├── middleware/
│   └── auth.js              # Middleware de autenticação
├── models/
│   ├── User.js              # Modelo de usuário
│   └── Task.js              # Modelo de tarefa
├── routes/
│   ├── auth.js              # Rotas de autenticação
│   ├── tasks.js             # Rotas de tarefas
│   └── users.js             # Rotas de usuários
├── index.html               # Página principal
├── server.js                # Servidor Express
├── package.json             # Dependências e scripts
└── .env                     # Variáveis de ambiente
```

## 🔧 Scripts Disponíveis

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Iniciar em modo produção
npm start

# Instalar dependências
npm install
```

## 📱 Como Usar

### 1. Primeiro Acesso
1. Acesse a aplicação no navegador
2. Clique em "Registrar" para criar uma conta
3. Preencha seus dados e confirme o registro
4. Faça login com suas credenciais

### 2. Gerenciando Tarefas
1. **Adicionar tarefa**: Use o formulário no topo da página
2. **Categorizar**: Selecione uma categoria apropriada
3. **Definir prioridade**: Escolha o nível de urgência
4. **Data de vencimento**: Defina um prazo (opcional)
5. **Marcar como concluída**: Clique no checkbox da tarefa

### 3. Organizando e Filtrando
1. **Filtros**: Use os seletores para filtrar por categoria, prioridade ou status
2. **Busca**: Digite no campo de busca para encontrar tarefas específicas
3. **Ordenação**: Organize por data, prioridade ou título
4. **Dashboard**: Acesse estatísticas detalhadas das suas tarefas

### 4. Personalizando
1. **Tema**: Alterne entre modo claro e escuro
2. **Perfil**: Gerencie suas informações de usuário
3. **Preferências**: Ajuste configurações pessoais

## 🛡️ Segurança

- **Autenticação JWT** com tokens seguros
- **Criptografia de senhas** com bcrypt
- **Validação de dados** no frontend e backend
- **Proteção contra ataques** CORS configurado
- **Variáveis de ambiente** para dados sensíveis

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Dados do usuário logado

### Tarefas
- `GET /api/tasks` - Listar tarefas do usuário
- `POST /api/tasks` - Criar nova tarefa
- `PUT /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Excluir tarefa
- `PATCH /api/tasks/:id/toggle` - Alternar status da tarefa

### Usuários
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/preferences` - Atualizar preferências

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Leandro Simplicio**
- GitHub: [@LeandroSimplicio](https://github.com/LeandroSimplicio)
- LinkedIn: [Leandro Simplicio](https://linkedin.com/in/leandro-simplicio)
- Email: leandro.simplicio@gmail.com

## 🙏 Agradecimentos

- Inspirado nas melhores práticas de desenvolvimento web
- Ícones e fontes do Google Fonts
- Comunidade open source por ferramentas incríveis


---

⭐ **Se este projeto foi útil para você, considere dar uma estrela no repositório!**

Uma aplicação de lista de tarefas moderna e responsiva desenvolvida com HTML, CSS e JavaScript puro.

## Funcionalidades

- Adicionar novas tarefas
- Marcar tarefas como concluídas
- Editar tarefas existentes
- Excluir tarefas
- Armazenamento local (localStorage) para persistência de dados
- Design responsivo para dispositivos móveis e desktop
- Interface de usuário moderna com animações e efeitos visuais
- Notificações para ações do usuário

## Tecnologias Utilizadas

- HTML5
- CSS3 (com Flexbox e animações)
- JavaScript (ES6+)
- Font Awesome para ícones
- Google Fonts (Poppins)
- LocalStorage API

## Capturas de Tela

![Captura de tela da aplicação](Assets/img/Beige%20Minimalist%20Mockup%20Instagram%20Post.png)

### Versão Desktop
![Versão Desktop](Assets/img/Homepage.png)

### Versão Mobile
![Versão Mobile](Assets/img/Home-mobile.png)

## Como Usar

1. Clone este repositório
2. Abra o arquivo `index.html` em seu navegador
3. Comece a adicionar suas tarefas!

## Recursos Adicionais

- Design responsivo para todos os dispositivos
- Efeitos de glassmorphism
- Animações suaves para melhor experiência do usuário
- Tema com gradiente moderno

## Autor

Leandro Simplicio - [LinkedIn](https://www.linkedin.com/in/leandro-simplicio/) - [GitHub](https://github.com/LeandroSimplicio)

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.