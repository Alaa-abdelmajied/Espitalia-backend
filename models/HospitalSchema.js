const mongoose = require('mongoose');
const validator = require('validator');
const CryptoJS = require('crypto-js');

mongoose.connect('mongodb://localhost/EspitaliaDB')
    .then(() => console.log('Connected.'))
    .catch(err => console.log('Error:', err));

const hospitalSchema = new mongoose.Schema({
    Email: {
        type: String,
        required: true,
        validate: [validator.isEmail, 'invalid Email']
    },
    Name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    Address: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },

    Specialization: [{
        type: String,
        required: true,
    }],

    salt: {
        type: String,
        require: true,
    },
    password_Hash: {                 
        type: String,
        required: true,
    },
})

const Hospital = mongoose.model('Hospital', hospitalSchema);

async function addHospital(hospital) {
    const _hospital = new Hospital({
        Email: hospital.email,
        Name: hospital.name,
        Address: hospital.address,
        salt: hospital.salt,
        password_Hash: hospital.password,
    });

    try {
        const result = await _hospital.save();
        console.log(result);
    } catch (error) {
        console.log(error.message);
    }
}


//Client Side signup(add hosp)
const newHospital = {
    email: 'management@andalosia.com',
    name: 'El Andalosia',
    Address: 'smouha, Alexandria',
    password: 'andalosia123'
};

//Server Side adding data

const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
var hashDigest = CryptoJS.PBKDF2(newHospital.password, salt, {
    keySize: 256 / 32
}).toString();

const hospital_data = {
    email: newHospital.email,
    name: newHospital.name,
    Address: newHospital.Address,
    salt: salt,
    password: hashDigest
};
addHospital(hospital_data);