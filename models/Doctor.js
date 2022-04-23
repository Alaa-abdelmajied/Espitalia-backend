const mongoose = require('mongoose');
const { isEmail } = require('validator');

//deh ma3mola embedded schema gwa doctor w gwaha hena feh el appointment list
const scheduleSchema =new mongoose.Schema({
    day:
    {
        type:String,
        enum:['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
        lowercase:true
    },     
    from:String ,
    to:String,
    AppointmentList:{
        Types:[mongoose.Types.ObjectId]
    }
    });

const doctorSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'name is required']
    },
    userName:{
        type:String,
        required:[true,'userName is required']
    },
    specialization:{
        type:String,
        required:[true,'specialization is required']
    },
    rating:{
        type:Number,
    },
    reviews:{
        type:[String]
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    schedule:{
        type:[scheduleSchema],
        required:true,
        lowercase:true
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Minimum password length is 6 characters']
    },
    hospital_id:{
        type: mongoose.Types.ObjectId,
        required:true,
    },
    currentFlowNumber:{
        type:Number,
        default:0
    }
   
})
