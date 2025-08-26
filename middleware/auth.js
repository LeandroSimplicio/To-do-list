const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Pegar o token do header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Acesso negado. Token não fornecido.",
      });
    }

    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar o usuário
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Token inválido. Usuário não encontrado.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "Conta desativada. Entre em contato com o suporte.",
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    console.error("Erro no registro completo:", error); // log completo

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token inválido.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expirado. Faça login novamente.",
      });
    }

    res.status(500).json({
      message: "Erro interno do servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware opcional - não falha se não houver token
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continua mesmo com erro no token opcional
    next();
  }
};

module.exports = { auth, optionalAuth };
