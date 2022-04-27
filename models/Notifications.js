const mongoose = require('mongoose');
const notificationSchema= new mongoose.Schema({
title: {
    type: String,
},
body: {
    type: String,
},
// date: {
//     type: Date,
// },
});

<<<<<<< HEAD
const Notification = mongoose.model('notification', notificationSchema);
=======
const notificationSchema = new mongoose.schema({
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    date: {
        type: Date,
    },
})

const Notification = mongoose.model('notification', notificationSchema);

>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
module.exports = Notification;

async function createNotification(){
const notification = new Notification({
<<<<<<< HEAD
    title:"Third Notification",
    body:"New appointment available",
=======
    title: 'Welcome to Espitalia',
    body: 'Try our application to reserve your appointment immediately'
>>>>>>> 15d8539ca7b5dc08c2cdef66031b4d4abc5eb6bd
});

const result = await notification.save();
console.log(result);

}
//createNotification();

