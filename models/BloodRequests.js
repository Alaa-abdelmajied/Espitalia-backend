const mongoose = require('mongoose');

const bloodRequests= new mongoose.schema(
    {

        hospitalID: {
            type: mongoose.Types.ObjectId,
        },
        bloodType:{
            type:String,
        },
        date:{
            type:Date,
        },
        quantity:{
            type:String,
        },

    }
)

const BloodRequests = mongoose.model('BloodRequests', bloodRequests);

const Request = new BloodRequests({
    bloodType:'A+',
    quantity: '2 litres'
});
