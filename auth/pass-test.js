'use strict'

const passService = require('./services/pass.service');
const moment = require('moment');

const miPass = "12345";
const badPass = "6789";
const usuario = {
    _id: "1233432455654656645",
    email: "luisvr601@gmail.com",
    displayname: "luis",
    password: miPass,
    signupDate: moment().unix(),   //lo guardamos en formato numerito
    lastLogin: moment().unix()
}

console.log(usuario);

passService.encriptaPassword( usuario.password )
    .then(hash => {
        usuario.password = hash;
        console.log( usuario );

        passService.comparaPassword(miPass, usuario.password)
            .then( isOK => {
                
                if(isOK){
                    console.log('p1: El password es correcto.');
                }else{
                    console.log('p1: El password no es correcto');
                }
                
            });

            passService.comparaPassword(badPass, usuario.password)
            .then( isOK => {
                
                if(isOK){
                    console.log('p2: El password es correcto.');
                }else{
                    console.log('p2: El password no es correcto');
                }
                
            });


    });