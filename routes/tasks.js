const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação a todas as rotas
router.use(auth);

// @route   GET /api/tasks
// @desc    Obter todas as tarefas do usuário com filtros
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('category').optional().isString().withMessage('Categoria deve ser uma string'),
  query('completed').optional().isBoolean().withMessage('Completed deve ser boolean'),
  query('priority').optional().isIn(['baixa', 'média', 'alta', 'urgente']).withMessage('Prioridade inválida'),
  query('overdue').optional().isBoolean().withMessage('Overdue deve ser boolean'),
  query('search').optional().isString().withMessage('Search deve ser uma string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      completed,
      priority,
      overdue,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = { user: req.user._id };

    if (category) filters.category = category;
    if (completed !== undefined) filters.completed = completed === 'true';
    if (priority) filters.priority = priority;

    // Filtro de busca por texto
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filtro para tarefas atrasadas
    if (overdue === 'true') {
      filters.dueDate = { $lt: new Date() };
      filters.completed = false;
    }

    // Configurar ordenação
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Executar consulta com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(filters)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email'),
      Task.countDocuments(filters)
    ]);

    // Calcular estatísticas
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $eq: ['$completed', false] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTasks: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      },
      stats: stats[0] || { total: 0, completed: 0, pending: 0, overdue: 0 }
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Obter uma tarefa específica
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user', 'name email');

    if (!task) {
      return res.status(404).json({
        message: 'Tarefa não encontrada'
      });
    }

    res.json(task);

  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'ID da tarefa inválido'
      });
    }
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks
// @desc    Criar nova tarefa
// @access  Private
router.post('/', [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título é obrigatório e deve ter no máximo 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('category')
    .optional()
    .isIn(['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Compras', 'Lazer', 'Família', 'Geral'])
    .withMessage('Categoria inválida'),
  body('priority')
    .optional()
    .isIn(['baixa', 'média', 'alta', 'urgente'])
    .withMessage('Prioridade inválida'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Data de vencimento deve estar no formato ISO8601'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Cada tag deve ter no máximo 30 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      user: req.user._id
    };

    // Validar data de vencimento
    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      if (dueDate <= new Date()) {
        return res.status(400).json({
          message: 'Data de vencimento deve ser no futuro'
        });
      }
    }

    const task = new Task(taskData);
    await task.save();

    // Popular dados do usuário
    await task.populate('user', 'name email');

    res.status(201).json({
      message: 'Tarefa criada com sucesso',
      task
    });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Atualizar tarefa
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título deve ter entre 1 e 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('category')
    .optional()
    .isIn(['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Compras', 'Lazer', 'Família', 'Geral'])
    .withMessage('Categoria inválida'),
  body('priority')
    .optional()
    .isIn(['baixa', 'média', 'alta', 'urgente'])
    .withMessage('Prioridade inválida'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed deve ser boolean'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Data de vencimento deve estar no formato ISO8601'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    // Validar data de vencimento se fornecida
    if (req.body.dueDate) {
      const dueDate = new Date(req.body.dueDate);
      if (dueDate <= new Date()) {
        return res.status(400).json({
          message: 'Data de vencimento deve ser no futuro'
        });
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!task) {
      return res.status(404).json({
        message: 'Tarefa não encontrada'
      });
    }

    res.json({
      message: 'Tarefa atualizada com sucesso',
      task
    });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'ID da tarefa inválido'
      });
    }
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Deletar tarefa
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        message: 'Tarefa não encontrada'
      });
    }

    res.json({
      message: 'Tarefa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'ID da tarefa inválido'
      });
    }
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   POST /api/tasks/:id/subtasks
// @desc    Adicionar subtarefa
// @access  Private
router.post('/:id/subtasks', [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Título da subtarefa é obrigatório e deve ter no máximo 100 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        message: 'Tarefa não encontrada'
      });
    }

    task.subtasks.push({
      title: req.body.title,
      completed: false
    });

    await task.save();

    res.json({
      message: 'Subtarefa adicionada com sucesso',
      task
    });

  } catch (error) {
    console.error('Erro ao adicionar subtarefa:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

// @route   GET /api/tasks/stats/dashboard
// @desc    Obter estatísticas para o dashboard
// @access  Private
router.get('/stats/dashboard', async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    // Estatísticas gerais
    const generalStats = await Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $eq: ['$completed', false] },
                    { $ne: ['$dueDate', null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Estatísticas por categoria
    const categoryStats = await Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Estatísticas por prioridade
    const priorityStats = await Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } }
        }
      }
    ]);

    // Tarefas da semana
    const weeklyTasks = await Task.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startOfWeek, $lte: endOfWeek }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      general: generalStats[0] || { total: 0, completed: 0, pending: 0, overdue: 0 },
      categories: categoryStats,
      priorities: priorityStats,
      weekly: weeklyTasks
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;