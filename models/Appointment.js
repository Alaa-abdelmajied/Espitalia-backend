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
  from: {
    type: String,
  },
  to: {
    type: String,
  },
  report: {
    type: String,
    default:''
  },
  prescription: {
    type: String,
    default:''
  },
  flowNumber: {
    type: Number,
  },
  reviewd: {
    type: Boolean,
    default: false,
  },
});

const Appointment = mongoose.model("appointment", appointmentSchema);

module.exports = Appointment;
