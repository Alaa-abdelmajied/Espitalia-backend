const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Types.ObjectId,
  },
  doctor: {
    type: mongoose.Types.ObjectId,
  },
  hospital: {
    type: mongoose.Types.ObjectId,
  },
  date: {
    type: Date,
  },
  report: {
    type: String,
  },
  prescription: {
    type: String,
  },
  flowNumber: {
    type: Number,
  },
  reviewd: {
    type: Boolean,
  },
});

const Appointment = mongoose.model("appointment", appointmentSchema);

module.exports = Appointment;
