'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');

const SECRET = require('../config').SECRET;
const EXP_TIME = require('../config').TOKEN_EXP_TIME;

//Crear token
//
//FORMATO JWT:
//      HEADER.PAYLOAD.VERIFY_SIGNATURE
//
// Donde
//      HEADER (Objeto JSON con algoritmo y ... codificado en formato base64Url)
//      {
//          "typ"
//...
//      VERIFY_SIGNATURE: 
//          HMACSHA256( base64UrlEncode(HEADER) + "." base64UrlEnconde(PAYLOAD), SECRET )
//

function creaToken(user){

    const payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(EXP_TIME, 'minutes').unix()
    };

    return jwt.encode( payload, SECRET );

}

function decodificaToken(token){

    var devolver;

    try{
        const payload = jwt.decode(token, SECRET, true); //Ponemos true para que, si falla porque el token ha expirado, no mande una excepción.

        if(payload.exp <= moment().unix()){ //el token ha expirado
            devolver = false;
        }else
            devolver = true; //todo OK
    }catch(err){
        devolver = false; //token no valido
    }

    return devolver;

    /*
    return new Promise((resolve, reject) => {
        try{
            const payload = jwt.decode(token, SECRET, true); //Ponemos true para que, si falla porque el token ha expirado, no mande una excepción.
            
            if(payload.exp <= moment().unix()){
            
                reject( {
                    status: 401,
                    message: 'El token ha expirado'
                });
            
            }

            resolve(payload.sub);
        
        } catch(err){
            
            reject( {
                status: 500,
                message: "El token no es válido",
                err: err
            });
        
        }

    });*/

}

module.exports = {
    creaToken,
    decodificaToken
};