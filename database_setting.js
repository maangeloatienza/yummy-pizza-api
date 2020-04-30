import mysql from 'anytv-node-mysql';


module.exports.connect = (settings)=>{
    return new Promise((success, error) => {

        if (!settings.host) throw new Error('MySQL host must be specified');
        if (!settings.user) throw new Error('MySQL user must be specified');
        if (!settings.password) throw new Error('MySQL password must be specified');
        if (!settings.database) throw new Error('MySQL database must be specified');

        success(mysql.add('master', settings));
    });
}