import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import Product from './../models/products';
import util from './../utils/util';
require('dotenv').config();

let cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name  : process.env.CLOUD_NAME,
    api_key     : process.env.API_KEY,
    api_secret  : process.env.API_SECRET
});

const reqBody = {
    name: '',
    price: 0.0,
    _description : '',
    _availability: 1,
    _image : ''
};

const optBody = {
    _name: '',
    _price: 0.0,
    _description: '',
    _availability: 0,
    _image : ''
};

const index = async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = `LIMIT ${(page - 1) * limit}, ${limit}`;
    const {
        name,
        price,
        availability,
        search,
        sort_desc,
        sort_id
    } = req.query;


    let where = ` WHERE product.deleted IS null  `;

    if (sort_id) {
        where += `
            ORDER BY ${sort_id} ${sort_desc ? sort_desc : ASC}
        `;
    }

    if (search) {
        where += `
            AND product.name LIKE '%${search}%' \
            OR product.price LIKE '%${search}%' \
            OR product.availability LIKE '%${search}%' \
        `;
    }

    if (name) {
        where += `
            AND product.name = '${name}'
        `;
    }

    if (price) {
        where += `
            AND product.price = '${price}'
        `;
    }

    if (availability) {
        where += `
            AND product.availability = '${availability}'
        `;
    }

    let [error, count] = await Global.exe(Product.count(res, where));

    if (error) {
        return Global.fail(res, {
            message: 'Error counting data',
            context: err
        }, 500);
    }

    let query = `
            SELECT \
            product.id AS id, \
            product.name, \
            product.price, \
            product.availability, \
            product.image, \
            product.created, \
            product.updated, \
            product.deleted \
            FROM products product \
            ${where} \
            ${offset}`;

    let [err, products] = await Global.exe(mysql.build(query)
        .promise());


    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (products.length == 0) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: products,
        count,
        page,
        limit,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);

}


const show = async (req, res, next) => {
    let id = req.params.id;
    let where = ` WHERE product.deleted is NULL AND product.id = '${id}'`;
    let query = `
            SELECT \
            product.id AS id, \
            product.name, \
            product.price, \
            product.availability, \
            product.image, \
            product.created, \
            product.updated, \
            product.deleted \
            FROM products product \
            ${where} `;



    let [err, product] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error fetching data',
            context: err
        }, 500);
    }

    if (!product.length) {
        return Global.fail(res, {
            message: 'No results found',
            context: 'Database returns no data'
        }, 404);
    }

    return Global.success(res, {
        data: product,
        message: 'Successfully fetched data',
        context: 'Successfully retrieved'
    }, 200);
}


const store = async (req, res, next) => {
    const data =
        util._get
            .form_data(reqBody)
            .from(req.body);

    let query = `INSERT INTO products SET ?`;
    let file = '';
 
    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }


    let [error, validate] = await Global.exe(Product.validate(res, {
        name: data.name,
    }));

    if (error) {
        return Global.fail(res, {
            message: 'Error validating user',
            context: error
        }, 500);
    }

    data.id = uuid();
    data.created = new Date();

    if(req.file){
        file = req.file.path

        let temp_holder = await cloudinary.uploader.upload(
            file,
            {
                public_id : file,
                tags : 'uploads'
            },
            (error,image)=>{
                if(err){
                    return Global.fail(res,{
                        message : "Error uploading to cloudinary",
                        context : error
                    },500);
                }

                return image;

            }
        );

    data.image =temp_holder? temp_holder.url : null;
    }
  
    let [err, product] = await Global.exe(mysql.build(query, data).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error creating product',
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
    let query = `UPDATE products SET ? WHERE id = '${id}'`;

    if (data instanceof Error) {
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }

    let [error, verify] = await Global.exe(Product.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying product',
            context: error
        }, 500);
    }

    data.updated = new Date();
    if(req.file){
        file = req.file.path

        let temp_holder = await cloudinary.uploader.upload(
            file,
            {
                public_id : file,
                tags : 'uploads'
            },
            (error,image)=>{
                if(err){
                    return Global.fail(res,{
                        message : "Error uploading to cloudinary",
                        context : error
                    },500);
                }

                return image;

            }
        );

    data.image =temp_holder? temp_holder.url : null;
    }



    let [err, product] = await Global.exe(mysql.build(query, data).promise());

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
    let query = `UPDATE products SET deleted = NOW() WHERE deleted IS NULL AND id = '${id}'`;
    let [error, verify] = await Global.exe(Product.verify(res, `id = '${id}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying data',
            context: error
        }, 500);
    }

    let [err, product] = await Global.exe(mysql.build(query).promise());

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