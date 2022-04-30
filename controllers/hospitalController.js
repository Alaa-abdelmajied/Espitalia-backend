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

//TODO: need to be checked or modified
module.exports.Logout = async (req, res) => {
    const { id, token } = req.body;
    try{
        const decodedToken = jsonwebtoken.verify(token,'Grad_Proj.Espitalia#SecRet.Application@30132825275');
        await Hospital.findById(decodedToken.id);
        res.send("Logged out");
    } catch(error) {
        res.status(400).send("bad request");
    }
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