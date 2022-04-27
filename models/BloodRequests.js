const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
    {

        hospitalID: {
            type: mongoose.Types.ObjectId,
        },
        bloodType: {
            type: String,
        },
        // date:{
        //     type:Date,
        // },
        quantity:{
            type:String,
        },
        date: {
            type: Date,
        },
        quantity: {
            type: String,

        },

    });

const BloodRequest = mongoose.model('bloodRequests', bloodRequestSchema);

module.exports = BloodRequest;


