import express from 'express';
import bodyParser from 'body-parser';
import SetupDB from './database_setting';
import Routes from './routes/index';
require('dotenv').config();

const app = express();


let configurationSetting = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
}

SetupDB.connect(configurationSetting);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false, parameterLimit: 50000, type: '*/x-www-form-urlencoded' }));


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization');
    next();
});

app.use('/api/v1', Routes);

app.use('/', (req, res) => {
    return res.json({
        message: 'Route not found',
        context: 'Route does not exists'
    }).status(404);
});


module.exports = app;