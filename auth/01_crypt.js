'use strict'

// $2b$10$4aU7/v8dud4pj2rG2RV9MOMUf80oNj7SApX3GP8KWTLLKgsFjdxtm
// ----***----------------------*******************************
// Alg Cos         Salt                        Hash

const bcrypt = require('bcrypt');

const miPass = "miConstraseña";
const badPass = "otropassword";

// Creamos salt
bcrypt.genSalt(15, (err, salt) =>{
    console.log(`Salt1: ${salt}`);
    
    bcrypt.hash(miPass,salt,(err, hash) => {
        if (err) console.log(err);
        else console.log(`Hash1: ${hash}`);
    });

});

bcrypt.hash(miPass,10,(err, hash) => {
    if (err) console.log(err);
    else{ 
        console.log(`Hash2: ${hash}`);
        
        bcrypt.compare(miPass, hash, (err, result) => {

            console.log(`Result 2.1: ${result}`);

        });

        bcrypt.compare(badPass, hash, (err, result) => {

            console.log(`Result 2.2: ${result}`);

        });

    }
});