const Patient = require('../models/Patient');
const Notifications = require('../models/Notifications');
const BloodRequests = require('../models/BloodRequests');

module.exports.patientLogin = async (req, res) => {
const { email, password } = req.body;
try {
    const patient = await Patient.patientLogin(email,password);
    
} catch (err) {
    res.status(400).send(err.message);
}
}
module.exports.getPatient=async(req,res) => {
const {id} = req.body;
const patient=await Patient.find({_id:id});
console.log(patient);
try{
    res.send(patient);
}
catch (err) {
    res.status(400).send(err.message);
}
}

module.exports.getNotification=async(req,res) => {
const notification=await Notifications.find();
console.log(notification);

try{
    res.send(notification);
}
catch (err) {
    res.status(400).send(err.message);
}
}


module.exports.getBloodRequests=async(req,res) => {
    const bloodRequests=await BloodRequests.find();
    console.log(bloodRequests);
    
    try{
        res.send(bloodRequests);
    }
    catch (err) {
        res.status(400).send(err.message);
    }
    }