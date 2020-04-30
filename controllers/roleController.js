import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import Role from './../models/roles';
import util from './../utils/util';

const reqBody = {
    name : ''
};

const optBody = {
    _name : ''
};

const index = async (req,res,next)=>{
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;

    const {
        name,
        sort_desc,
        sort_id
    } = req.query;

    let where = ` WHERE role.deleted IS null  `;

    if (name) {
        where += `
            ORDER BY ${name} ${sort_desc ? sort_desc : ASC}
        `;
    }

    let [error, count] = await Global.exe(Role.count(res, where));

    if (error) {
        return Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

    let query = `
            SELECT \
            role.* \
            FROM roles role\
            ${where} \
            ${offset}`;

    let [err, roles] = await Global.exe(mysql.build(query)
        .promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (roles.length == 0) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: roles,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);
}

const show = async (req, res, next) => {
    let id = req.params.id;
    let where = ` WHERE role.deleted is NULL AND role.id = '${id}'`;
    let query = `
            SELECT \
            role.* \
            FROM roles role \
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

    console.log(data);

    let query = `INSERT INTO roles SET ?`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }


    let [error, validate] = await Global.exe(Role.validate(res, {
        name: data.name
    }));

    if (error) {
        return Global.fail(res, {
            message: 'Error validating user',
            context: error
        }, 500);
    }

    data.id = uuid();
    data.created = new Date();

    console.log('store user: ', data);
    let [err, role] = await Global.exe(mysql.build(query,data).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error creating user',
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
    let query = `UPDATE roles SET deleted = NOW() WHERE deleted IS NULL AND id = '${id}'`;
    let [error, verify] = await Global.exe(Role.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying data',
            context: error
        }, 500);
    }

    let [err, role] = await Global.exe(mysql.build(query).promise());

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