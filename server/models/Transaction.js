const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  amount: Number,
  billNo: String,
  billDate: Date,
  purpose: String,
  documents: [String],
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  transactionId: { type: String, unique: true, required: true },
  semester: { type: String },
  year: { type: String }
});

module.exports = mongoose.model('Transaction', transactionSchema);
