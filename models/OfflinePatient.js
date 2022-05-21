const mongoose = require('mongoose');

const offline = new mongoose.Schema({
    patientID: {
        type: mongoose.Types.ObjectId
    },
    name: {
        type: String
    },
    phoneNumber:{
        type:String
    }
})

const OfflinePatient = mongoose.model('offlinepatient', offline);

module.exports = OfflinePatient;