const mongoose = require('mongoose');

const specializationSchema = new mongoose.Schema({
    doctorIds:{
        type: [mongoose.Types.ObjectId],
    },
    name:{
        type:String,
        required:true
    }
});

const Specialization = mongoose.model('specialization',specializationSchema);

module.exports = Specialization;