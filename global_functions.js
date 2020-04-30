import pe from 'parse-error';

module.exports = {
    exe(promise) {
        return promise
            .then(data => {
                return [null, data];
            }).catch(err =>
                [pe(err)]
            );
    },
    
    fail(res, err, code){

        res.json({
            success: false,
            error: err
        }).status(code);
    },

    success(res, data, code){
        let send_data = { success: true };

        if (typeof data === 'object') {
            send_data = Object.assign(data, send_data);
        }

        if (typeof code !== 'undefined') {
            res.statusCode = code;
        }

        res.json(send_data).status(code);
    }
};