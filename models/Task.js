const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título da tarefa é obrigatório'],
    trim: true,
    maxlength: [200, 'Título não pode ter mais de 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
  },
  completed: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    enum: {
      values: ['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Compras', 'Lazer', 'Família', 'Geral'],
      message: 'Categoria deve ser uma das opções válidas'
    },
    default: 'Geral'
  },
  priority: {
    type: String,
    enum: {
      values: ['baixa', 'média', 'alta', 'urgente'],
      message: 'Prioridade deve ser: baixa, média, alta ou urgente'
    },
    default: 'média'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(date) {
        // Se uma data foi fornecida, deve ser no futuro
        return !date || date > new Date();
      },
      message: 'Data de vencimento deve ser no futuro'
    }
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag não pode ter mais de 30 caracteres']
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date
    }
  },
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Subtarefa não pode ter mais de 100 caracteres']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  }]
}, {
  timestamps: true
});

// Middleware para definir completedAt quando a tarefa é marcada como concluída
taskSchema.pre('save', function(next) {
  if (this.isModified('completed')) {
    if (this.completed && !this.completedAt) {
      this.completedAt = new Date();
    } else if (!this.completed) {
      this.completedAt = undefined;
    }
  }
  next();
});

// Método virtual para verificar se a tarefa está atrasada
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && !this.completed && new Date() > this.dueDate;
});

// Método virtual para calcular progresso das subtarefas
taskSchema.virtual('subtaskProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  const completed = this.subtasks.filter(subtask => subtask.completed).length;
  const total = this.subtasks.length;
  const percentage = Math.round((completed / total) * 100);
  
  return { completed, total, percentage };
});

// Método virtual para dias até o vencimento
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Incluir virtuals no JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Índices para performance
taskSchema.index({ user: 1, completed: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);