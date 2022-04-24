const Hospital = require('../models/Hospital');
const validator = require('validator');

module.exports.hospitalLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (validator.isEmail(email)){
            const hospital = await Hospital.hospitalLogin(email, password);
        }
    }catch(e){
        res.status(404).send(e.message);
    }
}

module.exports.Logout = async (req, res) => {

}

module.exports.viewDoctors = async (req, res) => {

}

module.exports.addDoctor = async (req, res) => {

}

module.exports.deactivateDoctor = async (req, res) => {

}

module.exports.addReceptionist = async (req, res) => {

}

module.exports.deactivateReceptionist = async (req, res) => {

}