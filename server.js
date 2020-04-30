import http from 'http';
import app from './app';
require('dotenv').config();

const port = process.env.PORT ;


let server = http.createServer(app);

server.listen(port,()=>{
    console.log(`Listening in port ${port} . . .`);
})