const Hospital = require('../models/Hospital');
const _ = require('lodash');
const Doctor = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');




module.exports.Login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hospital = await Hospital.hospitalLogin(email, password);
        const token = hospital.generateAuthToken();
        res.send(token);
    }catch(e){
        res.status(400).send(e.message);
    }
}

module.exports.Logout = async (req, res) => {
    
}

module.exports.viewDoctors = async (req, res) => {
    const { id } = req.body;
    const doctors = await Doctor.find({ hospitalID: id, isActive: true});
    if (!doctors) return res.status(404).send("nothing found");
    res.send(doctors);
}

module.exports.addDoctor = async (req, res) => {
    const { error } = Doctor.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    let doctor = await Doctor.findOne({ email: req.body.email});
    if (doctor) return res.status(400).send("Doctor is already exists");

    doctor = new Doctor(_.pick(req.body, ['name', 'userName', 'specialization', 'email', 'schedule', 'password', 'hospitalID', 'workingDays']));
    await doctor.save();
    res.send(_.pick(doctor, ['name', 'userName', 'specialization', 'email', 'schedule', 'hospitalID', 'workingDays']));

}

/*
when hospital send request to activate a Doctor:
    first, we should search for the doctor's ID. If the doctor is assigned to another hospital
    (isActive = false) that's means he is available to be signed for this.hospital
    if the doctor is already active and assigned for a hospital, do nothing or send a response as a bad req.body
*/
module.exports.activateDoctor = async (req, res) => {
    const { hospitalID, DoctorID } = req.body;
    const doctor = await Doctor.findById(DoctorID);
    if(doctor.isActive) return res.status(400).send("Doctor is not available");
    doctor.isActive = true;
    doctor.hospitalID = hospitalID;
    doctor.save();
    res.send("Done");
    //, { isActive: true, hospitalID: hospitalID} 
}

/*
when hospital send request to deactivate a Doctor:
    first, we search for the DoctorID and check if the hospitalID matches this.hospital
    if everything is fine then remove hospitalID and make isActive = false
*/
module.exports.deactivateDoctor = async (req, res) => {
    const { hospitalID, DoctorID } = req.body;
    const doctor = await Doctor.findById(DoctorID);
    if(!doctor || doctor.hospitalID != hospitalID) return res.status(400).send('bad request');
    doctor.hospitalID = null;
    doctor.isActive = false;
    doctor.save();
    res.send("Done");
}


module.exports.addReceptionist = async (req, res) => {
    const {name,username,email,password,hospitalID,phoneNumber,education,from,workingDays} = req.body;
    const newReceptionist = await Receptionist.create({
        name: name,
        username: username,
        email: email,
        password: password,
        hospitalID,
        phoneNumber: phoneNumber,
        education,
        from: from,
        workingDays: workingDays
    });
    if(!newReceptionist) return res.status(400).send("bad request");
    res.send(newReceptionist);
}

module.exports.viewReceptionists = async (req, res) => {
    //const id_ = req.params.id;
    const {id} = req.body;
    //console.log(id);
    //add is Active to the filter
    const receptionists = await Receptionist.find({hospitalID: id});
    if (!receptionists) return res.status(404).send("nothing found");
    res.send(receptionists);
}

module.exports.deactivateReceptionist = async (req, res) => {
    const { hospitalID, receptionistID } = req.body;
    const receptionist = await Receptionist.findById(receptionistID);
    if(!receptionist || receptionist.hospitalID!=hospitalID) return res.status(400).send("You are not authorized");
    receptionist.isActive = false;
    receptionist.hospitalID = null;
    receptionist.save();
    res.send(`${receptionist.name} is removed`);
}

module.exports.activateReceptionist = async (req, res) => {
    const { hospitalID, receptionistID } = req.body;
    const receptionist = await Receptionist.findById(receptionistID);
    if(!receptionist) return res.status(404).send("not found");
    if(receptionist.isActive) return res.status(400).send("is not available");
    receptionist.hospitalID = hospitalID;
    receptionist.isActive = true;
    receptionist.save();
    res.send(`${receptionist.name} is added to your hospital`);

}