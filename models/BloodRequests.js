const mongoose = require('mongoose');

const bloodRequestSchema= new mongoose.Schema(
    {

        // userID:{
        //     type:mongoose.Types.ObjectId,
        // },
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

    }
)

const BloodRequest = mongoose.model('bloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
