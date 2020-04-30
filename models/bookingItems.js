import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from '../global_functions';


const count = async (res, where, offset) => {

    let query =
        `SELECT \
            COUNT(*) AS total
            FROM bookingItems bookingItem \
            ${where}
            `;
    
    let err, bookingItems;

    [err, bookingItems] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data count',
            context: err
        }, 500);
    }

    return bookingItems[0].total;
}

const fetch = async (res, id) => {

    let where = ` WHERE bookingItem.deleted is NULL AND bookingItem.id = '${id}'`;
    let query = `
            SELECT \
            bookingItem.*, \
            product.name, \
            product.price, \
            product.image \
            FROM bookingItems bookingItem \
            LEFT JOIN products product \
            ON bookingItem.product_id = product.id \
            ${where} `;

    let err, bookingItems;

    [err, bookingItems] = await Global.exe(mysql.build(query).promise());

    return bookingItems[0];
}



const verify = async (res, where) => {

    let query = `SELECT * FROM bookingItems WHERE ${where}`;

    let err, bookingItems;

    [err, bookingItems] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!bookingItems.length) {
        return Global.fail(res, {
            message: 'Data already exists',
            conext: 'Already exists'
        }, 400);
    }

    return true;
}

const validate = async (res, where) => {
    let query = `SELECT * FROM bookingItems WHERE product_id = '${where.product_id}' AND user_id IS NOT NULL OR guest_user IS NOT NULL AND deleted IS NULL`;
    
    let [err, bookingItems] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (bookingItems.length) {
        return Global.fail(res, {
            message: 'Already on cart',
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