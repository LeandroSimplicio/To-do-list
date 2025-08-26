const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, insira um email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false // Por padrão, não incluir a senha nas consultas
  },
  avatar: {
    type: String,
    default: ''
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    defaultCategory: {
      type: String,
      default: 'Geral'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só faz hash se a senha foi modificada
  if (!this.isModified('password')) return next();
  
  try {
    // Hash da senha
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para remover dados sensíveis
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Índices para performance
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);