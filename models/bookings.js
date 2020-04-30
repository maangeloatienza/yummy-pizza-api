import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';


const count = async (res, where, offset) =>{

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM bookings booking\
            ${where}
            `;

    let err, bookings;

    [err, bookings] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return bookings[0].total;
}

const verify = async (res, where) => {

    let query = `SELECT * FROM bookings WHERE ${where}`;

    let err, bookings;

    [err, bookings] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!bookings.length){
        return Global.fail(res, {
            message : 'Data already exists',
            conext  : 'Already exists'
        },400);
    }

    return true;
}

const validate = async (res,where)=>{
    let query = `SELECT * FROM bookings WHERE code = '${where.code}' and deleted IS NULL`;

    let [err,bookings] = await Global.exe(mysql.build(query).promise());

    if(err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (bookings.length){
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