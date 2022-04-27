const mongoose = require('mongoose');

<<<<<<< HEAD
const bloodRequests= new mongoose.Schema(
=======
const bloodRequestSchema = new mongoose.schema(
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
    {

        hospitalID: {
            type: mongoose.Types.ObjectId,
        },
        bloodType: {
            type: String,
        },
<<<<<<< HEAD
        // date:{
        //     type:Date,
        // },
        quantity:{
            type:String,
=======
        date: {
            type: Date,
        },
        quantity: {
            type: String,
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
        },

    }
)

const BloodRequest = mongoose.model('bloodRequests', bloodRequestSchema);

module.exports = BloodRequest;

<<<<<<< HEAD
module.exports = BloodRequests;

async function createBloodRequests(){
const bloodRequest = new BloodRequests({
    bloodType:"AB+",
    quantity:"2 litres",
=======
const Request = new BloodRequests({
    bloodType: 'A+',
    quantity: '2 litres'
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
});

const result = await bloodRequest.save();
console.log(result);

}
createBloodRequests();

