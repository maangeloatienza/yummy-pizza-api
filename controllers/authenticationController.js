import mysql from 'anytv-node-mysql';
import uuid from 'uuid/v4';
import Global from './../global_functions';
import User from './../models/users';
import util from './../utils/util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const reqBody = {
    username : '',
    password : ''
}

const login = async(req,res,next)=>{
    const data =
        util._get
        .form_data(reqBody)
        .from(req.body);

    let query = `SELECT \
            user.id, \
            user.first_name,\
            user.last_name, \
            user.username, \
            user.email, \
            user.phone_number, \
            user.role_id, \
            role.name AS role, \
            user.created, \
            user.updated, \
            user.password, \
            user.deleted \
            FROM users user \
            LEFT JOIN roles role \
            ON role.id = user.role_id \
            WHERE user.username = '${data.username}'`;

    if (data instanceof Error){
        return Global.fail(res, {
            message: 'Error in data inputs',
            context: data.message
        }, 500);
    }
    
    let [error, verify] = await Global.exe(User.verify(res, `username = '${data.username}'`));

    if (error) {
        return Global.fail(res, {
            message: 'Error verifying user',
            context: error
        }, 500);
    }

    let [err,user] = await Global.exe(mysql.build(query).promise());

    if (err) {
        return Global.fail(res, {
            message: 'Error logging in user',
            context: error
        }, 500);
    }

    bcrypt.compare(data.password, user[0].password, (fail, success) => {
        
        if (fail) {
            return Global.fail(res, {
                message: 'Error validating user',
                context: fail
            }, 500);
        }


        if(!success){

            console.log(data.password,user[0].password)
            return Global.fail(res, {
                message: 'Error validating user',
                context: 'Failed to login'
            }, 500);
        }

        
        if(success){
            const token = jwt.sign({
                id: user[0].id,
                first_name: user[0].first_name,
                last_name: user[0].last_name,
                username: user[0].username,
                role: {
                    id: user[0].role_id,
                    name: user[0].role
                },
                email: user[0].email,
                phone_number: user[0].phone_number,
                role: user[0].role
            }, 'secret');

            return Global.success(res, {
                data: {
                    id: user[0].id,
                    first_name: user[0].first_name,
                    last_name: user[0].last_name,
                    username: user[0].username,
                    email: user[0].email,
                    role: {
                        id: user[0].role_id,
                        name: user[0].role
                    },
                    phone_number: user[0].phone_number

                },
                token: `Bearer ${token}`,
                message: 'User logged in successfully',
                context: 'Successfully logged in'
            }, 200);
        }

       
    });

    

}

const logout = async (req, res, next) => {
    return Global.success(res, {
        message: 'User logged out successfully',
        context: 'Successfully logged out'
    }, 200);
}




module.exports = {
    login,
    logout
}