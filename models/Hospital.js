const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

/*
TODO: 
    install config module, make a config folder and make default.json and custom-environment-variables.json
    in default.json:
        {
            "jwtPrivateKey": ""
        }
    in custom-environment-variables.json:
        {
            "jwtPrivateKey": "Esbitalia_jwtPrivateKey"
        }
    then,
    replace the "PrivateKey" in jwt.sign() with config.get('jwtPrivateKey')
    and don't forget to set the environment variable
*/

const hospitalSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, 'invalid Email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    },
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
    },
    address: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255,
    },
    specialization: [{
        type: String,
        required: true,
    }]
});

hospitalSchema.methods.generateAuthToken = function () {
    /*
    FIXME:
        the private key should be an environment variable
    */
    const token = jsonwebtoken.sign({ _id: this._id }, "PrivateKey");
    return token;
}

hospitalSchema.methods.decodeToken = function (token) {
    const decodedToken = jsonwebtoken.verify(token, "PrivateKey");
    return decodedToken;
}

hospitalSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    console.log(this.password);
    next();
});

hospitalSchema.statics.hospitalLogin = async function (email, password) {
    const hospital = await this.findOne({ email });
    if (hospital) {
        const validPassword = await bcrypt.compare(password, hospital.password);
        //console.log(password);
        if (validPassword) {
            return hospital;
        }
        throw Error('Incorrect email or password');
    }
    throw Error('Incorrect email or password');
};

hospitalSchema.statics.changePassword = async function (hospitalId, oldPassword, newPassword) {
    const hospital = await this.findOne({ _id: hospitalId });
    const validPassword = await bcrypt.compare(oldPassword, hospital.password);
    if (validPassword) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await Hospital.updateOne(hospital, {
            password: hashedPassword
        });
        return ('done');
    }
    throw Error('Incorrect password');
}

hospitalSchema.statics.forgotPassword = async function (hospitalId, newpassword) {
    const hospital = await this.findOne({ _id: hospitalId });
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    await Hospital.updateOne(hospital, {
        password: hashedPassword,
    });
    return "done";
};

const Hospital = mongoose.model('hospital', hospitalSchema);

function validateHospital(hospital) {
    const schema = {
        name: Joi.string().min(3).max(255).require(),
        email: Joi.string().min(3).max(255).email().require(),
        password: Joi.string().min(8).max(250).password().require(),
        address: Joi.string().min(3).max(255).require(),
    };
    return Joi.validate(hospital, schema);
}

module.exports = Hospital;