const mongoose = require('mongoose');

const bloodRequests= new mongoose.Schema(
    {

        hospitalID: {
            type: mongoose.Types.ObjectId,
        },
        bloodType:{
            type:String,
        },
        // date:{
        //     type:Date,
        // },
        quantity:{
            type:String,
        },

    }
)

const BloodRequests = mongoose.model('BloodRequests', bloodRequests);

module.exports = BloodRequests;

async function createBloodRequests(){
const bloodRequest = new BloodRequests({
    bloodType:"AB+",
    quantity:"2 litres",
});

const result = await bloodRequest.save();
console.log(result);

}
createBloodRequests();

