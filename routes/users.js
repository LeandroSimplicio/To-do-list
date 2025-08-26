const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(auth);

// @route   GET /api/users/profile
// @desc    Obter perfil completo do usuário
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Buscar estatísticas do usuário
    const taskStats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: ['$completed', 1, 0] } },
          pendingTasks: { $sum: { $cond: ['$completed', 0, 1] } }
        }
      }
    ]);

    const stats = taskStats[0] || { totalTasks: 0, completedTasks: 0, pendingTasks: 0 };

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      stats
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Atualizar preferências do usuário
// @access  Private
router.put('/preferences', [
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Tema deve ser light ou dark'),
  body('defaultCategory')
    .optional()
    .isIn(['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Compras', 'Lazer', 'Família', 'Geral'])
    .withMessage('Categoria padrão inválida'),
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notificações deve ser boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { theme, defaultCategory, notifications } = req.body;
    
    const updateData = {};
    if (theme) updateData['preferences.theme'] = theme;
    if (defaultCategory) updateData['preferences.defaultCategory'] = defaultCategory;
    if (notifications !== undefined) updateData['preferences.notifications'] = notifications;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Preferências atualizadas com sucesso',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/users/avatar
// @desc    Atualizar avatar do usuário
// @access  Private
router.put('/avatar', [
  body('avatar')
    .isURL()
    .withMessage('Avatar deve ser uma URL válida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Avatar atualizado com sucesso',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Desativar conta do usuário
// @access  Private
router.delete('/account', [
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória para desativar a conta')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    // Buscar usuário com senha
    const user = await User.findById(req.user._id).select('+password');

    // Verificar senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Senha incorreta'
      });
    }

    // Desativar conta (não deletar para manter integridade dos dados)
    user.isActive = false;
    await user.save();

    res.json({
      message: 'Conta desativada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar conta:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/export
// @desc    Exportar dados do usuário
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tasks = await Task.find({ user: req.user._id });

    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      tasks: tasks.map(task => ({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        completed: task.completed,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        tags: task.tags,
        subtasks: task.subtasks,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })),
      exportedAt: new Date()
    };

    res.json({
      message: 'Dados exportados com sucesso',
      data: exportData
    });

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/users/categories
// @desc    Obter categorias disponíveis
// @access  Private
router.get('/categories', (req, res) => {
  const categories = [
    'Trabalho',
    'Pessoal', 
    'Estudos',
    'Saúde',
    'Compras',
    'Lazer',
    'Família',
    'Geral'
  ];

  res.json({
    categories
  });
});

module.exports = router;