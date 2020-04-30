import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';


const count = async (res, where, offset) => {

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM products product\
            ${where}
            `;

    let err, products;

    [err, products] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return products[0].total;
}


const fetch = async (res, id) => {

    let where = ` WHERE product.deleted is NULL AND product.id = '${id}'`;
    let query = `
            SELECT \
            product.* \
            FROM  products product \
            
            ${where} `;

    let err, product;

    [err, product] = await Global.exe(mysql.build(query).promise());

    return product[0];
}


const verify = async (res, where) => {

    let query = `SELECT * FROM products WHERE ${where}`;

    let err, products;

    [err, products] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!products.length) {
        return Global.fail(res, {
            message: 'Data already exists',
            conext: 'Already exists'
        }, 400);
    }

    return true;
}

const validate = async (res, where) => {
    let query = `SELECT * FROM products WHERE name = '${where.name}' and deleted IS NULL`;

    let [err, products] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (products.length) {
        return Global.fail(res, {
            message: 'Already exists',
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