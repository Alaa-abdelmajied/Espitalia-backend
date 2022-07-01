const mongoose = require('mongoose');

const dbURI = 'mongodb+srv://Espitalia:nP9GJhPQVrOmizqi@espitalia.yqzvi.mongodb.net/Espitalia?retryWrites=true&w=majority';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log('Server Connected!');
    })
    .catch((err) => console.log(err));
const conn = mongoose.connection;

conn.on('error', () => console.error.bind(console, 'connection error'));

conn.once('open', () => console.info('Connection to Database is successful'));

module.exports = conn;