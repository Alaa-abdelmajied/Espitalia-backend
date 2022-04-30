const Hospital = require('../models/Hospital');
const validator = require('validator');
const jsonwebtoken = require('jsonwebtoken');
const Doctor = require('../models/Doctor');


const createToken = ( id ) => {
    return jsonwebtoken.sign({ id }, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
}

module.exports.Login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hospital = await Hospital.hospitalLogin(email, password);
        const token = createToken(hospital.id);
    }catch(e){
        res.status(404).send(e.message);
    }
}

module.exports.Logout = async (req, res) => {
    
}

module.exports.viewDoctors = async (req, res) => {
    const { id } = req.body;
    const doctors = await Doctor.find({ hospitalID: id});
    if (!doctors) return res.status(404).send("nothing found");
    res.send(doctors);
}

module.exports.addDoctor = async (req, res) => {
    const { name, userName, specialization, email, schedule, password, hospitalID, workingDays } = req.body;
    const newDoctor = await Doctor.create({
        name: name,
        userName: userName,
        specialization: specialization,
        email: email,
        schedule: schedule,
        password: password,
        hospitalID: hospitalID,
        workingDays:workingDays
    });
    res.send(newDoctor);

}

module.exports.deactivateDoctor = async (req, res) => {

}

module.exports.addReceptionist = async (req, res) => {

}

module.exports.deactivateReceptionist = async (req, res) => {

}