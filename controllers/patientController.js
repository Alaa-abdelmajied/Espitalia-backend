const Patient = require('../models/Patient');

module.exports.patientLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await Patient.patientLogin(email,password);
        
    } catch (err) {
        res.status(400).send(err.message);
    }
}

module.exports.getPatient = async(req, res) => {
    const { name } = req.body;
    const patient = await Patient.find({name:name}).select('name');
    if (!patient) return res.status(404).send("No patients.");
    res.send(patient);
    console.log(patient);
}