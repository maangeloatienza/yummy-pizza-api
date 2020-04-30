import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import BookingItem from '../models/bookingItems';
import Product from '../models/products';
import util from './../utils/util';

const reqBody = {
    _user_id : '',
    _guest_user: '',
    product_id : '',
    _quantity : 1
};

const optBody = {
    _quantity: 0
};

const index = async (req, res, next) => {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;
    const {
        sort_id,
        sort_desc,
        user
    } = req.query;

    let response = [];
    let where = ` WHERE bookingItem.deleted IS null AND bookingItem.transaction_id IS null `;

    if (user){
        where += `
            AND bookingItem.user_id = '${user}' OR bookingItem.guest_user = '${user}'
        `;
    }
    
    if (sort_id) {
        where += `
            ORDER BY ${sort_id} ${sort_desc ? sort_desc : ASC}
        `;
    }


    let [error, count] = await Global.exe(BookingItem.count(res, where));


    if (error) {
        return Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

    let query = `
            SELECT \
            bookingItem.id, \
            bookingItem.user_id, \
            bookingItem.guest_user, \
            bookingItem.subtotal, \
            bookingItem.quantity, \
            bookingItem.product_id, \
            product.name,\
            product.price, \
            product.image, \
            bookingItem.created, \
            bookingItem.updated, \
            bookingItem.deleted \
            FROM bookingItems bookingItem \
            LEFT JOIN products product \
            ON product.id = bookingItem.product_id \
            ${where} \
            ${offset}`;
    console.log(query);
    let [err, bookingItems] = await Global.exe(mysql.build(query)
        .promise());
    

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (bookingItems.length == 0) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }


    return Global.success(res, {
        data: bookingItems,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);

}

const show = async (req, res, next) => {
    let id = req.params.id;
    let where = ` WHERE booking.deleted is NULL AND booking.id = '${id}'`;
    let query = `
            SELECT \
            booking.*, \
            user.id as user_id, \
            user.first_name,\
            user.last_name, \
            user.username, \
            user.email, \
            user.phone_number \
            FROM bookings booking \
            LEFT JOIN users user \
            ON booking.booked_by = user.id \
            ${where} `;


    let [err, booking] = await Global.exe(mysql.build(query).promise());
    let response = [];
    if (err) {
        Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!booking.length) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }


    response.push({
        id: booking[0].id,
        code: booking[0].code,
        booked_by: {
            first_name: booking[0].first_name,
            last_name: booking[0].last_name,
            username: booking[0].username,
        },
        booking_date: booking[0].booking_date,
        created: booking[0].created,
        updated: booking[0].updated,
        deleted: booking[0].deleted
    });


    return Global.success(res, {
        data: response[0],
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);
}

const store = async (req, res, next) => {
    const data =
        util._get
            .form_data(reqBody)
            .from(req.body);

    let query = `INSERT INTO bookingItems SET ?`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }


    let [error, validate] = await Global.exe(BookingItem.validate(res, {
        product_id: data.product_id,
    }));

    if (error) {
        return Global.fail(res, {
            message: 'Error validating booking',
            context: error
        }, 500);
    }

    let [fail,productUp] = await Global.exe(Product.fetch(res,data.product_id));
    
    if (fail) {
        return Global.fail(res, {
            message: 'Error validating products',
            context: error
        }, 500);
    }

    data.subtotal = data.quantity ? (data.quantity * productUp.price) : productUp.price;
    data.id = uuid();
    data.created = new Date();
    


    let [err, booking] = await Global.exe(mysql.build(query, data).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error creating booking item',
            context: err
        }, 500);
    }

    return Global.success(res, {
        message: 'Data successfully created',
        context: 'Successfully created'
    }, 200);
}



const update = async (req, res, next) => {
    const data =
        util._get
            .form_data(optBody)
            .from(req.body);


    let id = req.params.id;

    let query = `UPDATE bookingItems SET ? WHERE id = '${id}'`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    let [error, verify] = await Global.exe(BookingItem.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying booking item',
            context: error
        }, 500);
    }

    let [fail,bookingItemUp] = await Global.exe(BookingItem.fetch(res,id));
    
    if (fail) {
        return Global.fail(res, {
            message: 'Error updating booking item',
            context: fail
        }, 500);
    }

    data.subtotal = data.quantity ? data.quantity * bookingItemUp.price : bookingItemUp.subtotal;


    let [err, booking] = await Global.exe(mysql.build(query, data).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Failed to update',
            context: err
        }, 500);
    }

    return Global.success(res, {
        message: 'Data updated successfully',
        context: 'Successfully updated'
    }, 200);
}


const remove = async (req, res, next) => {
    let id = req.params.id;
    let query = `DELETE FROM bookingItems WHERE id = '${id}'`;
    let [error, verify] = await Global.exe(BookingItem.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying data',
            context: error
        }, 500);
    }

    let [err, booking] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Failed to deleted',
            context: err
        }, 500);
    }

    return Global.success(res, {
        message: 'Data deleted successfully',
        context: 'Successfully deleted'
    }, 200);
}


module.exports = {
    index,
    show,
    store,
    update,
    remove
}