import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';


const count = async (res, where, offset) =>{

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM roles role\
            ${where}
            `;

    let err, roles;

    [err, roles] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return roles[0].total;
}


const verify = async (res, where) => {

    let query = `SELECT * FROM roles WHERE ${where}`;

    let err, roles;

    [err, roles] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!roles.length){
        return Global.fail(res, {
            message : 'Data already exists',
            conext  : 'Already exists'
        },400);
    }

    return true;
}

const validate = async (res,where)=>{
    let query = `SELECT * FROM roles WHERE name = '${where.name}' and deleted IS NULL`;

    let [err,role] = await Global.exe(mysql.build(query).promise());

    if(err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (role.length){
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