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

});

module.exports = mongoose.model('Department', departmentSchema);
