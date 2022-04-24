const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Types.ObjectId
    },
    doctor: {
        type: mongoose.Types.ObjectId
    },
    hopsital: {
        type: mongoose.Types.ObjectId
    },
    date: {
        type: Date
    },
    report: {
        type: String
    },
    prescription: {
        type: String
    },
    flowNumber:{
        type: Number
    }
})

const Appointment = mongoose.model('appointment', patientSchema);

module.exports = Appointment;