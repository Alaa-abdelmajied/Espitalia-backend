const Patient = require('../models/Patient');

module.exports.patientLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const patient = await Patient.patientLogin(email,password);
        
    } catch (err) {
        res.status(400).send(err.message);
    }
}