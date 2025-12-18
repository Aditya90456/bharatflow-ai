const mongoose = require('./mongooseConnection');

const vehicleSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;