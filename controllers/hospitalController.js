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

module.exports.deactivateDoctor = async (req, res) => {
    const { id } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(id, { isActive: false} );
}

module.exports.activateDoctor = async (req, res) => {
    const { id } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(id, { isActive: true} );
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
    console.log(id);
    //add is Active to the filter
    const receptionists = await Receptionist.find({hospitalID: id});
    if (!receptionists) return res.status(404).send("nothing found");
    res.send(receptionists);
}

module.exports.deactivateReceptionist = async (req, res) => {

}

module.exports.activateReceptionist = async (req, res) => {

}