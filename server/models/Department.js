const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: String,
  description: String,
  allocatedFund: { type: Number, default: 0 },
  utilizedFund: { type: Number, default: 0 },
  hodUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  coordinatorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fundAllocations: [
    {
      amount: { type: Number, required: true },
      semester: { type: String, required: true },
      year: { type: String, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true }
    }
  ]
});

module.exports = mongoose.model('Department', departmentSchema);
