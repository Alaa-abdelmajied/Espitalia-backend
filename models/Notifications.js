const mongoose = require('mongoose');

const notifications= new mongoose.schema({
    title:{
        type: String,
    },
    body:{
        type: String,
    },
    date: {
        type: Date,
    },
})

const Notification = mongoose.model('Notification', notifications);

const notification = new Notification({
    title:'Welcome to Espitalia',
    body:'Try our application to reserve your appointment immediately'
});
