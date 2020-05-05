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

const fetch = async (res, data, user) => {

    let where = ` WHERE bookingItem.deleted is NULL AND bookingItem.transaction_id IS NULL `;
    
    if (data.id){
        where += `
                AND bookingItem.id = '${data.id}'
        `;
    }

    if (data.transaction) {
        where += `
            AND user_id = '${user}' \
            OR  guest_user = '${user}' \
        `
    }

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
    
    return bookingItems;
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

const validate = async (res, body) => {
    
    let where = ` WHERE deleted IS NOT NULL AND transaction_id IS NULL AND product_id = '${body.product_id}' `;
    
    
    if(body.user_id){
        where += `
            AND user_id = '${body.user_id}'
        `
    }

    if(body.guest_user){
        where += `
            AND  guest_user = '${body.guest_user}' 
        `
    }


    let query = `SELECT * FROM bookingItems ${where}`;

 
    
    let [err, bookingItems] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (bookingItems.length) {
        // return Global.fail(res, {
        //     message: 'Already on cart',
        //     context: 'Data already exists'
        // });
        return false;
    }

    return true;
}

const update = async (res,data,where) =>{
    let query = `UPDATE bookingItems SET ? ${where}`

       
    let [err, bookingItems] = await Global.exe(mysql.build(query,data).promise())

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    return true;
}


module.exports = {
    update,
    fetch,
    count,
    verify,
    validate
}