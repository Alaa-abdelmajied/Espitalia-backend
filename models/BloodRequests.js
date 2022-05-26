const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
    {

        PatientIDs:{
            type: [mongoose.Types.ObjectId],
        },
        hospitalID: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        receptionistID: {
            type: mongoose.Types.ObjectId,
            required: true,
        },
        bloodType: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now
        },

    }
)

const BloodRequest = mongoose.model('bloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
