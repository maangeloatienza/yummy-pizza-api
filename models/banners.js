import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';


const count = async (res, where, offset) => {

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM banners banner\
            ${where}
            `;

    let err, banners;

    [err, banners] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return banners[0].total;
}


const verify = async (res, where) => {

    let query = `SELECT * FROM banners WHERE ${where}`;

    let err, banners;

    [err, banners] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!banners.length) {
        return Global.fail(res, {
            message: 'Data already exists',
            conext: 'Already exists'
        }, 400);
    }

    return true;
}

const validate = async (res, where) => {
    let query = `SELECT * FROM banners WHERE name = '${where.name}' and deleted IS NULL`;

    let [err, banners] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (banners.length) {
        return Global.fail(res, {
            message: 'Already exists',
            context: 'Data already exists'
        });
    }

    return true;
}


module.exports = {
    count,
    verify,
    validate
}