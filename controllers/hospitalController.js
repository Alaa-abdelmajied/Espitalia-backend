const Hospital = require('../models/Hospital');
const validator = require('validator');
const jsonwebtoken = require('jsonwebtoken');


const createToken = ( id ) => {
    return jsonwebtoken.sign({ id }, 'Grad_Proj.Espitalia#SecRet.Application@30132825275');
}

module.exports.hospitalLogin = async (req, res) => {
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

}

module.exports.addDoctor = async (req, res) => {

}

module.exports.deactivateDoctor = async (req, res) => {

}

module.exports.addReceptionist = async (req, res) => {

}

module.exports.deactivateReceptionist = async (req, res) => {

}