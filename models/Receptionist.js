const mongoose = require('mongoose');
const { isEmail } = require('validator');

const receptionistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter a receptionist name']
    },
    username: {
        type: String,
        required: [true]
    },
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
    hospitalID: {
        type: mongoose.Types.ObjectId,
        //required: [true, 'Please enter a hospital name']
    },
    phoneNumber: {
        type: String,       // better as a string or number?
        required: [true, 'Please enter a valid phone number'],
        minlength: [11, 'Minimum phone number length is 11']
    },
    education: {
        type: String
    },
    from: {
        type: String
    },

    workingDays: {
        type: [{
            day: String,
            to: String,
            from: String
        }]
    },
    isActive: {
        type: Boolean,
        default: true
    }

});

const Receptionist = mongoose.model('receptionist', receptionistSchema);

//test
// async function createReceptionist() {
//     const user = new Receptionist({
//         name: 'Maram',
//         username: 'maram98',
//         email: 'maram_98@gmail.com',
//         password: 'hiiiiiii',
//         hospital_name: 'Al Andalusia',
//         phone_number: 12345678910,
//         education: 'Faculty of Commerce',
//         from: 'Alexandria, Egypt'

//     });

//     const result = await user.save();
//     console.log(result);
// }

//createReceptionist();

module.exports = Receptionist;