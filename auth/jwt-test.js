'use strict'

const tokenService = require('./services/token.service');
const moment = require('moment');

//Simular datos
const miPass = "12345";
const usuario = {
    _id: "1233432455654656645",
    email: "luisvr601@gmail.com",
    displayname: "luis",
    password: miPass,
    signupDate: moment().unix(),   //lo guardamos en formato numerito
    lastLogin: moment().unix()
};
console.log(usuario);

//Creamos un token
const token = tokenService.creaToken( usuario );
console.log(token);


//Decodificar token

console.log(tokenService.decodificaToken(token));
const tokenMal = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdhIiOiIxMjMzNDMyNDU1NjU0NjU2NjQ1IiwiaWF0IjoxNjA1NTE5Njg4LCJleHAiOjE2MDYxMjQ0ODh9.BAEZv6i5EIKhoGSbr8AtsufUJxkLHvOEdV-l_-jaHMk";
console.log(tokenService.decodificaToken(tokenMal));

/*tokenService.decodificaToken(token)
    .then(userID => {
        return console.log(`ID1: ${userID}`);

    }, err => { return console.log({Error1: err})})
    .catch(err => {

        return console.log({Error1: err});

    });

const badToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdhIiOiIxMjMzNDMyNDU1NjU0NjU2NjQ1IiwiaWF0IjoxNjA1NTE5Njg4LCJleHAiOjE2MDYxMjQ0ODh9.BAEZv6i5EIKhoGSbr8AtsufUJxkLHvOEdV-l_-jaHMk";

tokenService.decodificaToken(badToken)
    .then(userID => {
        return console.log(`ID2: ${userID}`);

    }, err => { return console.log({Error2: err})})
    .catch(err => {

        return console.log({Error2: err});

    });*/

console.log("esto es asincrono F");