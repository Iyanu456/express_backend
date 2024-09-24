const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  paymentAmount: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
});

const Purchase = mongoose.model('Purchase', purchaseSchema);
module.exports = Purchase;
