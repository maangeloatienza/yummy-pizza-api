import mysql from 'anytv-node-mysql';
import Global from '../global_functions';


const count = async (res, where, offset) => {

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM transactions transactions \
            ${where}
            `;
    
    let err, transactions;

    [err, transactions] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return transactions[0].total;
}

const fetch = async (res, id) => {

    let where = ` WHERE transactions.deleted is NULL AND transactions.id = '${id}'`;
    let query = `
            SELECT \
            transactions.* \
            FROM transactions transactions \
            ${where} `;

    let err, transactions;

    [err, transactions] = await Global.exe(mysql.build(query).promise());

    return transactions[0];
}



const verify = async (res, where) => {

    let query = `SELECT * FROM transactions WHERE ${where}`;

    let err, transactions;

    [err, transactions] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!transactions.length) {
        return Global.fail(res, {
            message: 'Data already exists',
            conext: 'Already exists'
        }, 400);
    }

    return true;
}

const validate = async (res, where) => {
    let query = `SELECT * FROM transactions WHERE code = '${where.code}' AND deleted IS NULL`;
    
    let [err, transactions] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (transactions.length) {
        return Global.fail(res, {
            message: 'Code already exists',
            context: 'Data already exists'
        });
    }

    return true;
}


module.exports = {
    fetch,
    count,
    verify,
    validate
}