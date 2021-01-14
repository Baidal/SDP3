'use strict'

// $2b$10$4aU7/v8dud4pj2rG2RV9MOMUf80oNj7SApX3GP8KWTLLKgsFjdxtm
// ----***----------------------*******************************
// Alg Cos         Salt                        Hash

const bcrypt = require('bcrypt');

function encriptaPassword(password)
{

    return bcrypt.hash(password, 10);

}

function comparaPassword(password, hash)
{

    return bcrypt.compare(password,hash);

}

//exportamos los servicios
module.exports = {
    encriptaPassword, 
    comparaPassword
};

