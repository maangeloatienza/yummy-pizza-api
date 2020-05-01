import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import Booking from './../models/bookings';
import util from './../utils/util';

let generate = require('./../utils/codeGenerator').generate;


const reqBody = {
    booked_by : '',
    booking_date : ''
};

const optBody = {
    _booked_by : '',
    _booking_date : ''
};

const index = async(req,res,next)=>{

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;
    const {
        code,
        booked_by,
        booking_date,
        sort_id,
        sort_desc,
        search
    } = req.query;

    let response =[];
    let where = ` WHERE booking.deleted IS null  `;

    if (sort_id) {
        where += `
            ORDER BY ${sort_id} ${sort_desc ? sort_desc : ASC}
        `;
    }

    if (search) {
        where += `
            AND code LIKE '%${search}%' \
            OR user.first_name LIKE '%${search}%' \
            OR user.last_name LIKE '%${search}%' \
            OR user.username LIKE '%${search}%' \
        `;
    }

    if (code) {
        where += `
            AND booking.code = '${code}' \
            \
        `;
    }


    if (booked_by) {
        where += `
            AND user.first_name = '${booked_by}' \
            OR user.last_name = '${booked_by}' \
            OR user.username = '${booked_by}'
        `;
    }

    if (booking_date) {

        where += `
            AND DATE(booking_date) = DATE('${booked_by}') \
        `;
    }

    let [error, count] = await Global.exe(Booking.count(res,where));
    
    if (error) {
        Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

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
            ${where} \
            ${offset}`;

    let [err, bookings] = await Global.exe(mysql.build(query)
        .promise());
                
    
    if(err){
        Global.fail(res,{
            message : 'Error fetching data',
            context : err
        },500);
    }

    if(bookings.length == 0){
        Global.fail(res,{
            message : 'No results found',
            context : 'Database returns no data'
        },404);
    }

    bookings.forEach(booking => {
        response.push({
            id : booking.id,
            code : booking.code,
            booked_by : {
                first_name : booking.first_name,
                last_name : booking.last_name,
                username : booking.username,
            },
            booking_date : booking.booking_date,
            created : booking.created,
            updated : booking.updated,
            deleted : booking.deleted
        });
    });

    return Global.success(res,{
        data: response,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    },200);

}

const show = async (req,res,next)=>{
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
    

    let [err,booking] = await Global.exe(mysql.build(query).promise());
    let response = [];
    if(err){
        Global.fail(res,{
            message : 'Error fetching data',
            context : err
        },500);
    }

    if(!booking.length){
        return Global.fail(res,{
            message : 'No results found',
            context: 'Database returns no data'
        },404);
    }

 
    response.push({
        id : booking[0].id,
        code : booking[0].code,
        booked_by : {
            first_name : booking[0].first_name,
            last_name : booking[0].last_name,
            username : booking[0].username,
        },
        booking_date : booking[0].booking_date,
        created : booking[0].created,
        updated : booking[0].updated,
        deleted : booking[0].deleted
    });


    return Global.success(res,{
        data : response[0],
        message : 'Successfully fetched data',
        context: 'Successfully retrieved'
    },200);
}

const store = async (req,res,next)=>{
    const data = 
    util._get
        .form_data(reqBody)
        .from(req.body);

    let query = `INSERT INTO bookings SET ?`;

    if(data instanceof Error){
        return Global.fail(res,{
            message : 'Error in data inputs',
            context : data.message
        },500);
    }


    let [error, validate] = await Global.exe(Booking.validate(res,{
        code : data.code,
        email : data.email
    }));

    if(error){
        return Global.fail(res,{
            message : 'Error validating booking',
            context : error
        },500);
    }

    data.id = uuid();
    data.created = new Date();
    data.code = generate();
    
    
    let [err,booking] = await Global.exe(mysql.build(query,data).promise());
    
    if(err) {
        return Global.fail(res,{
            message : 'Error creating booking',
            context : err
        },500);
    }

    return Global.success(res,{
        message : 'Data successfully created',
        context : 'Successfully created'
    },200);
}



const update = async (req, res, next) => {
    const data =
    util._get
    .form_data(optBody)
    .from(req.body);


    let id = req.params.id;

    let query = `UPDATE bookings SET ? WHERE id = '${id}'`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    let [error, verify] = await Global.exe(Booking.verify(res, `id = '${id}'`));
    
    if (error) {
        return Global.fail(res, {
            message: 'Error verifying role',
            context: error
        }, 500);
    }

    data.updated = new Date();
    
    let [err, booking] = await Global.exe(mysql.build(query,data).promise());

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
    let query = `UPDATE bookings SET deleted = NOW() WHERE deleted IS NULL AND id = '${id}'`;
    let [error, verify] = await Global.exe(Booking.verify(res, `id = '${id}'`));

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