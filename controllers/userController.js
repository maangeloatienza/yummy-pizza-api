import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import User from './../models/users';
import util from './../utils/util';
import bcrypt from 'bcryptjs';


const reqBody = {
    username : '',
    first_name : '',
    last_name : '',
    email : '',
    password : '',
    phone_number : ''
};

const optBody = {
    _username : '',
    _first_name : '',
    _last_name : '',
    _email : '',
    _password : '',
    _phone_number: ''
};

const index = async(req,res,next)=>{
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;
    const {
        username,
        first_name,
        last_name,
        search,
        sort_desc,
        sort_id,
        role
    } = req.query;


    let where = ` WHERE user.deleted IS null  `;

    if (sort_id) {
        where += `
            ORDER BY ${sort_id} ${sort_desc ? sort_desc : ASC}
        `;
    }

    if (search) {
        where += `
            AND first_name LIKE '%${search}%' \
            OR last_name LIKE '%${search}%' \
            OR username LIKE '%${search}%' \
        `;
    }

    if (role) {
        where += `
            AND role.name = '${role}'
        `;
    }

    let [error, count] = await Global.exe(User.count(res,where));
    
    if (error) {
        return Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

    let query = `
            SELECT \
            user.id AS id, \
            first_name,\
            last_name, \
            username, \
            email, \
            phone_number, \
            name AS role, \
            user.created, \
            user.updated, \
            user.deleted \
            FROM users user \
            LEFT JOIN roles role \
            ON role.id = user.role_id \
            ${where} \
            ${offset}`;

    let [err, users] = await Global.exe(mysql.build(query)
        .promise());
                
    
    if(err){
        return Global.fail(res,{
            message : 'Error fetching data',
            context : err
        },500);
    }

    if(users.length == 0){
        return Global.fail(res,{
            message : 'No results found',
            context : 'Database returns no data'
        },404);
    }

    return Global.success(res,{
        data: users,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    },200);

}


const show = async (req,res,next)=>{
    let id = req.params.id;
    let where = ` WHERE user.deleted is NULL AND user.id = '${id}' `;
    let query = `
            SELECT \
            user.id AS id, \
            first_name,\
            last_name, \
            username, \
            email, \
            phone_number, \
            name AS role, \
            user.created, \
            user.updated, \
            user.deleted \
            FROM users user \
            LEFT JOIN roles role \
            ON role.id = user.role_id \
            ${where} `;

    let [err,user] = await Global.exe(mysql.build(query).promise());

    if(err){
        return Global.fail(res,{
            message : 'Error fetching data',
            context : err
        },500);
    }

    if(!user.length){
        return Global.fail(res,{
            message : 'No results found',
            context: 'Database returns no data'
        },404);
    }

    return Global.success(res,{
        data : user,
        message : 'Successfully fetched data',
        context: 'Successfully retrieved'
    },200);
}

const store = async (req,res,next)=>{
    const data = 
    util._get
        .form_data(reqBody)
        .from(req.body);

    let query = `INSERT INTO users SET ?`;

    if(data instanceof Error){
        return Global.fail(res,{
            message : 'Error in data inputs',
            context : data.message
        },500);
    }


    let [error, validate] = await Global.exe(User.validate(res,{
        username : data.username,
        email : data.email
    }));

    if(error){
        return Global.fail(res,{
            message : 'Error validating user',
            context : error
        },500);
    }

    data.id = uuid();
    data.created = new Date();

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(data.password, salt, async function (err, hash) {
            data.password = hash;


            let [er, user] = await Global.exe(mysql.build(query, data).promise());

            if (er) {
                return Global.fail(res, {
                    message: 'Error creating user',
                    context: er
                }, 500);
            }

            return Global.success(res, {
                message: 'Data successfully created',
                context: 'Successfully created'
            }, 200);
        });
    });

    
}


const update = async (req,res,next)=>{
    const data = 
    util._get
    .form_data(optBody)
    .from(req.body);
    

    let id = req.params.id;

    let query = `UPDATE users SET ? WHERE id = '${id}'`;

    if(data instanceof Error){
        return Global.fail(res,{
            message : 'Error in data inputs',
            context : data.message
        },500);
    }

    let [error,verify] = await Global.exe(User.verify(res,`id = '${id}'`));
    
    if(error){
        return Global.fail(res,{
            message : 'Error verifying user',
            context : error
        },500);
    }

    data.updated = new Date();

    if(data.password) {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(data.password, salt, async function (err, hash) {
                data.password = hash;


                let [er, user] = await Global.exe(mysql.build(query, data).promise());

                if (er) {
                    return Global.fail(res, {
                        message: 'Error creating user',
                        context: er
                    }, 500);
                }

                return Global.success(res, {
                    message: 'Data successfully updated',
                    context: 'Successfully updated'
                }, 200);
            });
        });
    }
    
   

    let [err,user] = await Global.exe(mysql.build(query,data).promise());

    if(err) {
        return Global.fail(res,{
            message : 'Failed to update',
            context : err
        },500);
    }

    return Global.success(res,{
        message : 'Data updated successfully',
        context : 'Successfully updated'
    },200);
}

const remove = async (req,res,next)=>{
    let id = req.params.id;
    let query = `UPDATE users SET deleted = NOW() WHERE deleted IS NULL AND id = '${id}'`;
    let [error, verify] = await Global.exe(User.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying data',
            context: error
        }, 500);
    }

    let [err, user] = await Global.exe(mysql.build(query).promise());

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