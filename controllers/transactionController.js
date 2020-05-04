import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import Transaction from './../models/transactions';
import BookingItem from './../models/bookingItems';
import util from './../utils/util';

let generate = require('./../utils/codeGenerator').generate;


const reqBody = {
    _code : '',
    user_id : '',
    first_name : '', 
    last_name : '', 
    contact_number: '',
    delivery_address : '',
    _total : 0.0,
    delivery_cost : 0.0,
    _total_usd : 0.0,
    _total_euro : 0.0
};

const optBody = {
    _name : ''
};

const index = async (req,res,next)=>{
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;

    const {
        code,
        user,
        first_name,
        last_name,
        total,
        total_euro,
        total_usd,
        sort_desc,
        sort_id
    } = req.query;

    let where = ` WHERE transactions.deleted IS null  `;

   
    if (user) {
        where += `
            AND user_id = '${user}'
        `;
    }

    if (code) {
        where += `
            AND code = '${code}'
        `;
    }

    if (code) {
        where += `
            AND code = '${code}'
        `;
    }

    if (first_name) {
        where += `
            AND first_name = '${first_name}'
        `;
    }

    if (last_name) {
        where += `
            AND last_name = '${last_name}'
        `;
    }

    if (total) {
        where += `
            AND total = '${total}'
        `;
    }

    if (total_usd) {
        where += `
            AND total_usd = '${total_usd}'
        `;
    }

    if (total_euro) {
        where += `
            AND tota_euro = '${total_euro}'
        `;
    }

    if (sort_id) {
        where += `
            ORDER BY ${sort_id} ${sort_desc ? sort_desc : 'DESC'}
        `;
    }


    

    let [error, count] = await Global.exe(Transaction.count(res, where));

    if (error) {
        return Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

    let query = `
            SELECT \
            transactions.* \
            FROM transactions transactions\
            ${where} \
            ${offset}`;

    console.log('CONTROLLER',query);

    let [err, transaction] = await Global.exe(mysql.build(query)
        .promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (transaction.length == 0) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: transaction,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);
}

const show = async (req, res, next) => {
    let id = req.params.id;
    let where = ` WHERE transactions.deleted is NULL AND transactions.id = '${id}'`;
    let query = `
            SELECT \
            transactions.* \
            FROM transactions transactions \
            ${where} `;


    let [err, role] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!role.length) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: role,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);
}

const store = async (req, res, next) => {
    const data =
    util._get
        .form_data(reqBody)
        .from(req.body);

    let query = `INSERT INTO transactions SET ?`;
    let euro = 55.66;
    let usd = 50.61;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    data.code = generate();

    let [error, validate] = await Global.exe(Transaction.validate(res, {
        code: data.code
    }));

    if (error) {
        return Global.fail(res, {
            message: 'Error validating user',
            context: error
        }, 500);
    }

   

    let [failCompute, compute] = await Global.exe(BookingItem.fetch(res,{
        id : false,
        transaction : true 
    },data.user_id));

    if(failCompute) {
        return Global.fail(res,{
            message : 'Error processing request',
            context : failCompute
        })
    }

    data.total = 0;
    compute.map(item => {
        
      
        data.total =+ data.total + item.subtotal;
        

    });

    let [fail,update] = await Global.exe(BookingItem.update(res,{
        transaction_id : data.code
    },`WHERE guest_user = '${data.user_id}' OR user_id = '${data.user_id}' AND transaction_id IS null`));


    if(fail) {
        return Global.fail(res,{
            message : 'Error processing request',
            context : fail
        })
    }

    data.total = data.total + data.delivery_cost;
    data.total_euro = data.total/euro;
    data.total_usd = data.total/usd;
    data.id = uuid();
    data.created = new Date();
   


    let [err, transaction] = await Global.exe(mysql.build(query,data).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error creating transaction',
            context: err
        }, 500);
    }

    return Global.success(res, {
        message: 'Checkout successfully',
        context: 'Successfully created'
    }, 200);
}

const update = async (req, res, next) => {
    const data =
    util._get
    .form_data(optBody)
    .from(req.body);


    let id = req.params.id;

    let query = `UPDATE roles SET ? WHERE id = '${id}'`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    let [error, verify] = await Global.exe(Role.verify(res, `id = '${id}'`));
    
    if (error) {
        return Global.fail(res, {
            message: 'Error verifying role',
            context: error
        }, 500);
    }

    data.updated = new Date();

    let [err, role] = await Global.exe(mysql.build(query,data).promise());

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
    let query = `UPDATE transactions SET deleted = NOW() WHERE deleted IS NULL AND id = '${id}'`;
    let [error, verify] = await Global.exe(Transaction.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying data',
            context: error
        }, 500);
    }

    let [err, transaction] = await Global.exe(mysql.build(query).promise());

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