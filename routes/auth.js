const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Função para gerar JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Nome deve ter entre 2 e 50 caracteres"),
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter pelo menos 6 caracteres")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número"
      ),
  ],
  async (req, res) => {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // Verificar se usuário já existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email já registrado",
        });
      }

      // Criar novo usuário
      const user = new User({ name, email, password });

      try {
        await user.save();
      } catch (saveError) {
        // Tratamento específico para erro de duplicidade
        if (saveError.code === 11000) {
          return res.status(400).json({
            message: "Email já registrado",
          });
        }
        console.error("Erro ao salvar usuário:", saveError);
        return res.status(500).json({
          message: "Erro interno ao salvar usuário",
          error:
            process.env.NODE_ENV === "development"
              ? saveError.message
              : undefined,
        });
      }

      // Gerar token JWT
      const token = generateToken(user._id);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
        },
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({
        message: "Erro interno do servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login do usuário
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Senha é obrigatória"),
  ],
  async (req, res) => {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Buscar usuário com senha
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({
          message: "Credenciais inválidas",
        });
      }

      // Verificar se conta está ativa
      if (!user.isActive) {
        return res.status(400).json({
          message: "Conta desativada. Entre em contato com o suporte.",
        });
      }

      // Verificar senha
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          message: "Credenciais inválidas",
        });
      }

      // Atualizar último login
      user.lastLogin = new Date();
      await user.save();

      // Gerar token
      const token = generateToken(user._id);

      res.json({
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        preferences: req.user.preferences,
        avatar: req.user.avatar,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({
      message: "Erro interno do servidor",
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Atualizar perfil do usuário
// @access  Private
router.put(
  "/profile",
  [
    auth,
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Nome deve ter entre 2 e 50 caracteres"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Email inválido"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      const { name, email, preferences } = req.body;
      const userId = req.user._id;

      // Se email foi alterado, verificar se já existe
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            message: "Email já está em uso",
          });
        }
      }

      // Atualizar usuário
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (preferences)
        updateData.preferences = { ...req.user.preferences, ...preferences };

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({
        message: "Perfil atualizado com sucesso",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }
);

// @route   POST /api/auth/change-password
// @desc    Alterar senha do usuário
// @access  Private
router.post(
  "/change-password",
  [
    auth,
    body("currentPassword").notEmpty().withMessage("Senha atual é obrigatória"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Nova senha deve ter pelo menos 6 caracteres")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número"
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Buscar usuário com senha
      const user = await User.findById(userId).select("+password");

      // Verificar senha atual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          message: "Senha atual incorreta",
        });
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      res.json({
        message: "Senha alterada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({
        message: "Erro interno do servidor",
      });
    }
  }
);

module.exports = router;
