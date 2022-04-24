const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/HospitalSchema');

module.exports.patientLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await Patient.patientLogin(email,password);
        
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.patientLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await Patient.patientLogin(email,password);
        
    } catch (err) {
        res.status(400).send(err.message);
    }
}

//search be asma2 el drs bas
module.exports.patientSearchDoctor = async (req,res) => {
    const {search} = req.body;
    try{
       res.send(await Doctor.find({name:{$regex: ".*" + search + ".*"}}));

    }catch{
        res.status(400).send(err.message);
    }
}

//search be Specialization bas
module.exports.patientSearchSpecialization = async (req,res) => {
    const {search} = req.body;
    try{

        res.send(await Doctor.find({specialization:{$regex: ".*" + search + ".*"}}));

    }catch{
        res.status(400).send(err.message);
    }
}

//search be hospital bas
module.exports.patientSearchHospital = async (req,res) => {
    const {search} = req.body;
    try{

        res.send(await Hospital.find({Name:{$regex: ".*" + search + ".*"}}));

    }catch{
        res.status(400).send(err.message);
    }
}

//search be el talata (array w ba push fyha beltartyb 0:drs 1:hospital 2:specialization)
module.exports.patientGeneralSerach = async(req,res) =>{
    const {search} = req.body;
    try {
       
        var result = new Array();
        var doctors = await Doctor.find({name:{$regex: ".*" + search + ".*"}});
        var hospitals = await Hospital.find({Name:{$regex: ".*" + search + ".*"}});
        var specializations= await Doctor.find({specialization:{$regex: ".*" + search + ".*"}});
        
        result.push(doctors);
        result.push(hospitals);
        result.push(specializations);
       
        // console.log(result);
      
        res.send(result);

    } catch {
        res.status(400).send(err.message);
    }
}
