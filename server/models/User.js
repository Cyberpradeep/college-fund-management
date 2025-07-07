const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'hod'], default: 'hod' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null }
});

module.exports = mongoose.model('User', userSchema);
