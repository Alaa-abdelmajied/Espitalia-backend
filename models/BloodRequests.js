const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.schema(
    {

        hospitalID: {
            type: mongoose.Types.ObjectId,
        },
        bloodType: {
            type: String,
        },
        date: {
            type: Date,
        },
        quantity: {
            type: String,
        },

    }
)

const BloodRequest = mongoose.model('bloodRequests', bloodRequestSchema);

module.exports = BloodRequest;

const Request = new BloodRequests({
    bloodType: 'A+',
    quantity: '2 litres'
});
