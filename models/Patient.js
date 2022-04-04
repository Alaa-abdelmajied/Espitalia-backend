const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const patientSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    },
    name: {
        type: String
    },
    age: {
        type: Number
    },
    phoneNumber: {
        type: Number
    },
    dateOfBirth: {
        type: Date
    },
    avatar: {
        type: Buffer
    },
    unVisits: {
        type: Number,
        default: 0
    },
    questions: {
        type: Boolean
    }
});

patientSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

patientSchema.statics.login = async function (email, password) {
    const patient = await this.findOne({ email });
    if (patient) {
        const validPassword = await bcrypt.compare(password, patient.password);
        if (validPassword) {
            return patient;
        }
        throw Error('Incorrect email or password');
    }
    throw Error('Incorrect email or password');
};

patientSchema.statics.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(this.password, salt);
}

const Patient = mongoose.model('patient',patientSchema);

module.exports = Patient;