const mongoose = require('mongoose');

const waitingVerficationSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Types.ObjectId,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    }
});

const WaitingVerfication = mongoose.model('waitingVerfication', waitingVerficationSchema);

module.exports = WaitingVerfication;