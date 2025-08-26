const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();

// Configurações de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com", // 👈 permitido agora
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com", // 👈 necessário pras fontes
        ],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela de tempo
  message: "Muitas tentativas, tente novamente em 15 minutos.",
});
app.use("/api/", limiter);

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch((err) => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Importar rotas
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");

// Usar rotas
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Rota para servir o frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Algo deu errado!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Middleware para rotas não encontradas
app.use("*", (req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});
