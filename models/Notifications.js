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

const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;

async function createNotification(){
const notification = new Notification({
    title:"Third Notification",
    body:"New appointment available",
});

const result = await notification.save();
console.log(result);

}
//createNotification();

