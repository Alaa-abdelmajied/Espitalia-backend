const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const patientRouters = require('./routes/PatientRoutes')

const app = express();
app.use(express.json());

const dbURI = 'mongodb+srv://Alaa:FpX3KihZBF5jaCV@espitaliacluster.ozn3j.mongodb.net/espitaliaDb?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then((result) => {
    console.log('Server Connected!');
    app.listen(3000);
})
.catch((err) => console.log(err));
const conn = mongoose.connection;
conn.on('error', () => console.error.bind(console, 'connection error'));
conn.once('open', () => console.info('Connection to Database is successful'));
module.exports = conn;

app.use('/patient', patientRouters);