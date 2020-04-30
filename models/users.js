import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';


const count = async (res, where, offset) =>{

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM users user\
            ${where}
            `;

    let err, users;

    [err, users] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return users[0].total;
}

const verify = async (res, where) => {
    
    let query = `SELECT * FROM users WHERE ${where}`;

    let err, users;
  
    
    [err, users] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if(!users.length){
        return Global.fail(res, {
            message : 'Data does not exists',
            context : 'Does not exists'
        },400);
    }

    return true;
}

const validate = async (res,where)=>{
    let query = `SELECT * FROM users WHERE username = '${where.username}'`;

    let [err,user] = await Global.exe(mysql.build(query).promise());

    if(err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if(user.length){
        return Global.fail(res,{
            message : 'Already exists',
            context : 'Data already exists'
        });
    }

    return true;
}


module.exports = {
    count,
    verify,
    validate
}

