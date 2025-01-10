const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Email regex
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hide sensitive fields from JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10); // Increase bcrypt rounds
  }
  next();
});

// Method to check password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Static method to create an admin user
userSchema.statics.createAdminUser = async function (adminData) {
  if (adminData.secretKey !== process.env.ADMIN_SECRET) {
    throw new Error('Unauthorized to create an admin');
  }
  const admin = new this({
    ...adminData,
    role: 'admin'
  });
  return admin.save();
};

// Static method to find users by role
userSchema.statics.findByRole = async function (role) {
  return this.find({ role });
};

// Middleware to handle unique constraint errors
userSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});

// Add index for query optimization
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;