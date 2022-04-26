const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

// mongoose.connect('mongodb://localhost/EspitaliaDB')
//     .then(() => console.log('Connected.'))
//     .catch(err => console.log('Error:', err));

const hospitalSchema = new mongoose.Schema({
    Email: {
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
    }]
});

hospitalSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

hospitalSchema.statics.hospitalLogin = async function (email, password) {
    const hospital = await this.findOne({ email });
    if (hospital) {
        const validPassword = await bcrypt.compare(password, hospital.password);
        if (validPassword) {
            return hospital;
        }
        throw Error('Incorrect email or password');
    }
    throw Error('Incorrect email or password');
};

hospitalSchema.statics.changePassword = async function (email, oldPassword, newPassword) {
    const hospital = await this.findOne({ email });
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

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;