import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import Banner from './../models/banners';
import util from './../utils/util';
require('dotenv').config();

let cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const reqBody = {
    name: '',
    _showcase: 1,
    _image: ''
};

const optBody = {
    name: '',
    _showcase: 1,
    _image: ''
};

const index = async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;
    const {
        name,
        showcase,
        search,
        sort_desc,
        sort_id
    } = req.query;


    let where = ` WHERE banner.deleted IS null  `;

    if (search) {
        where += `
            AND banner.name LIKE '%${search}%' \
            OR banner.price LIKE '%${search}%' \
            OR banner.availability LIKE '%${search}%' \
        `;
    }

    if (name) {
        where += `
            AND banner.name = '${name}'
        `;
    }

    if (showcase) {
        where += `
            AND banner.showcase = '${showcase}'
        `;
    }

    if (sort_id) {
        where += `
            ORDER BY ${sort_id} ${sort_desc ? sort_desc : ASC}
        `;
    }

    let [error, count] = await Global.exe(Banner.count(res, where));

    if (error) {
        return Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

    let query = `
            SELECT \
            banner.id AS id, \
            banner.name, \
            banner.showcase, \
            banner.image, \
            banner.created, \
            banner.updated, \
            banner.deleted \
            FROM banners banner \
            ${where} \
            ${offset}`;

    let [err, banners] = await Global.exe(mysql.build(query)
        .promise());


    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (banners.length == 0) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: banners,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);

}

const show = async (req, res, next) => {
    let id = req.params.id;
    let where = ` WHERE banner.deleted is NULL AND banner.id = '${id}'`;
    let query = `
            SELECT \
            banner.id AS id, \
            banner.name, \
            banner.showcase, \
            banner.image, \
            banner.created, \
            banner.updated, \
            banner.deleted \
            FROM banners banner \
            ${where} `;



    let [err, banner] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!banner.length) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: banner,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);
}

const store = async (req, res, next) => {
    const data =
        util._get
            .form_data(reqBody)
            .from(req.body);

    let query = `INSERT INTO banners SET ?`;
    let file = '';

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    let [error, validate] = await Global.exe(Banner.validate(res, {
        name: data.name,
    }));

    if (error) {
        return Global.fail(res, {
            message: 'Error validating banner',
            context: error
        }, 500);
    }

    data.id = uuid();
    data.created = new Date();

    if (req.file) {
        file = req.file.path

        let temp_holder = await cloudinary.uploader.upload(
            file,
            {
                public_id: file,
                tags: 'uploads'
            },
            (error, image) => {
                if (err) {
                    return Global.fail(res, {
                        message: "Error uploading to cloudinary",
                        context: error
                    }, 500);
                }

                return image;

            }
        );

        data.image = temp_holder ? temp_holder.url : null;
    }

    let [err, banner] = await Global.exe(mysql.build(query, data).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error creating banner',
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
    let file = '';
    let query = `UPDATE banners SET ? WHERE id = '${id}'`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    let [error, verify] = await Global.exe(Banner.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying banner',
            context: error
        }, 500);
    }

    data.updated = new Date();
    if (req.file) {
        file = req.file.path

        let temp_holder = await cloudinary.uploader.upload(
            file,
            {
                public_id: file,
                tags: 'uploads'
            },
            (error, image) => {
                if (err) {
                    return Global.fail(res, {
                        message: "Error uploading to cloudinary",
                        context: error
                    }, 500);
                }

                return image;

            }
        );

        data.image = temp_holder ? temp_holder.url : null;
    }



    let [err, banner] = await Global.exe(mysql.build(query, data).promise());

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
    let query = `UPDATE banners SET deleted = NOW() WHERE deleted IS NULL AND id = '${id}'`;
    let [error, verify] = await Global.exe(Banner.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying data',
            context: error
        }, 500);
    }

    let [err, banner] = await Global.exe(mysql.build(query).promise());

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