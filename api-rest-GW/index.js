'use strict'
const port = process.env.PORT || 7003;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";                 //IGNORAR TODOS LOS CERTIFICADOS
const https = require('https');
const express = require('express');
const logger = require('morgan');
const fetch = require('node-fetch');
const fs = require('fs');
const mongojs = require('mongojs');
const bcrypt = require('bcrypt');
const moment = require('moment');
const { Console } = require('console');
const passService = require('./../auth/services/pass.service');
const tokenService = require('./../auth/services/token.service');
const url = require('url');
const mongoose = require('mongoose');
const { homedir } = require('os');


const opciones = {
    key: fs.readFileSync('./../api-rest/cert/key.pem'),
    cert: fs.readFileSync('./../api-rest/cert/cert.pem')
}

const URL_WS = "https://localhost:3000/api";
const URL_Coches = "https://" + require("./config").ip_equipo1 + ":7004/api";
const URL_Aviones = "https://" + require("./config").ip_equipo2 + ":7005/api";
const URL_Hoteles = "https://" +require("./config").ip_equipo3+":7006/api";
const URL_Paquetes = "https://" +require("./config").ip_equipo3+":7007/api";

const app = express();

app.use(logger('dev'));
app.use(express.urlencoded( { extended: false } ));
app.use(express.json());



//Autorización
function auth(req, res, next) {

    if(!req.headers.authorization) {
        res.status(401).json({result: 'KO', mensajes:'No has enviado el token en la cabecera.'});
        return next(); 
    }

    console.log(req.headers.authorization);

    if(req.headers.authorization.split(" ")[1] === "MITOKEN123456789"){ //token en formate JWT

        return next();

    }

    res.status(401).json({result: 'KO', mensajes:'Acceso no autorizado al servicio'});
    return next(new Error("dad"));
    
}

//Rutas y controladores
/*
app.get('/api', (req, res, next) => {
    

    db.getCollectionNames((err, colecciones) => {

        if (err) return next(err);
        console.log(colecciones);
        res.json({result: 'OK', colecciones: colecciones});

    });
});*/

app.get('/api/paquetes',auth,(req,res,next) => {
    const queURL = URL_Paquetes + "/paquetes";
    const queToken = req.headers.authorization.split(" ")[1];

    fetch(queURL).then(res => res.json()).then(json => 
        {res.json({
            result: 'OK',
            paquetes:json.Paquetes
        });
    });


});


app.post('/api/paquetes',auth,(req,res,next) => {

    const queURL = URL_Paquetes + "/paquetes";
    const queToken = req.headers.authorization.split(" ")[1];

    const current_url = url.parse(req.url,true);
    const search_params = current_url.query;

    if(!(search_params.ciudad_avion && search_params.ciudad_hotel && search_params.ciudad_coche)){

        res.json({Error: "No has introducido uno de los nombres en la URL."});

    }else{

        const cuerpo = {ciudad_coche: search_params.ciudad_coche,
                        ciudad_hotel: search_params.ciudad_hotel,
                        ciudad_avion: search_params.ciudad_avion};

        fetch(queURL,{
                    method: 'POST',
                    body: JSON.stringify(cuerpo),
                    headers:{
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${queToken}`
                    }
        })
        .then(res => res.json())
        .then(
            json => 
            {res.json({
                result: json.Error,
                IDs: json.IDs,
                coche: json.coche,
                hotel: json.hotel,
                avion: json.avion
            });
        }
        )
    }


});

app.post('/api/paquetes/reservar/:id',auth,(req,res,next) => {

    const queId = req.params.id;
    const queToken = req.headers.authorization.split(" ")[1];
    const queURL = URL_Paquetes + `/paquetes/reservar/${queId}`

    const email = req.body.email;
    const jwt = req.body.jwt;

    const cuerpo = {
        email: email,
        jwt: jwt
    };

    fetch(queURL,{
                method: 'POST',
                body: JSON.stringify(cuerpo),
                headers:{
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${queToken}`
                }
    })
    .then(res => res.json())
    .then(
        json => 
        
        {res.json({
            resultado: json.Respuesta
        });
        
        }
    )


});


app.post('/api/:colecciones', auth, (req, res, next) => {
    
    
    const queColeccion = req.params.colecciones;
    const nuevoElemento = req.body;
    const queToken = req.headers.authorization.split(" ")[1];
    let queURL = ``;

    if(queColeccion == "coches"){
        //LLAMAMOS AL ENDPOINT DE COCHES
        queURL = `${URL_Coches}/${queColeccion}`;

    }else if(queColeccion == "aviones"){
        //LLAMAMOS AL ENDPOINT DE AVIONES
        queURL = `${URL_Aviones}/${queColeccion}`;

    }else if(queColeccion== "hoteles"){
        //LLAMAMOS AL ENDPOINT DE HOTELES
        queURL = `${URL_Hoteles}/${queColeccion}`;

    }else{

        return next(new Error("No se ha introducido una colleción adecuada"));

    }

    
    console.log(queURL);
    console.log(nuevoElemento);

    fetch(queURL, {
                            method: 'POST',
                            body: JSON.stringify(nuevoElemento),
                            headers:{
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${queToken}`
                                    }
                            }
    )
    .then(res => res.json())
    .then(json => 
    {res.json({
            result: 'OK',
            coleccion: queColeccion,
            elemento: json.elemento
        });
    }); 


});


//METODO LOGIN A LA PAGINA WEB
app.post('/login', (req,res,next) => {
    //CREAMOS LA CONEXION
    var users = mongojs('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority');
    req.collection = users.collection("users");
    let body = req.body;

    req.collection.findOne({email: body.email}, (err, usuario) => { //BUSCAMOS EL USUARIO EN LA BD
        if(err) return next(err);

        //NO existe el usuario en la DB
        if(!usuario){
            return res.status(400).json({
                ok: false,
                Error: "No existe el usuario."


            });
        }

        
        passService.comparaPassword(body.password,usuario.password)
            .then(isOK => {

                if(!isOK)
                    return res.status(400).json({
                        ok: false,
                        err: {
                        message: "Usuario o contraseña incorrectos."
                        }
                    });
                else{
                    //TODO OK: CREAMOS EL TOKEN Y LO DEVOLVEMOS
                    let token = tokenService.creaToken(usuario);
                    let string = '{"token":"'+token+'"}'; 
                    let token_guardar = JSON.parse(string);

                    req.collection.update(  //guardamos el token
                        {email: body.email},
                        {$set: token_guardar},
                        {safe: true, multi: false },
                        (err, result) => {
                            if(err) return next(err);
                        }
                

                    );

                    res.json({
                        ok: true,
                        Usuario: usuario,
                        Token: token
                     });

                }
        
        
        
            });
    });

});


app.post('/register', (req,res,next) => {

    var users = mongojs('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority');
    req.collection = users.collection("users");

    let nuevoElemento = req.body;
    

    req.collection.findOne({email: nuevoElemento.email}, (err, usuario) => {
        if(err) return next(err);

        console.log("usuario:");
        console.log(usuario);

        if(usuario){
            return res.status(400).json({
                error: "Ya existe el ususario en la bd."
            });
    
        }else{
    
            nuevoElemento.password = bcrypt.hashSync(nuevoElemento.password,10);
    
            console.log(nuevoElemento);
    
            req.collection.save(nuevoElemento, (err, nuevoUsuario) => {
                if(err) return next(err);
    
                res.json({
                    ok: true,
                    usuario: nuevoUsuario
                })
    
            });    
        }

    });

    



});



app.get('/api/:colecciones', (req, res, next) => {
    
    const queColeccion = req.params.colecciones;
    let queURL = "";

    if(queColeccion == "coches"){
        //LLAMAMOS AL ENDPOINT DE COCHES
        queURL = `${URL_Coches}/${queColeccion}`;
        
    }else if(queColeccion == "aviones"){
        //LLAMAMOS AL ENDPOINT DE AVIONES
        queURL = `${URL_Aviones}/${queColeccion}`;

    }else if(queColeccion == "hoteles"){
        //LLAMAMOS AL ENDPOINT DE HOTELES
        queURL = `${URL_Hoteles}/${queColeccion}`;

    }else{

        return next(new Error("No se ha introducido una colleción adecuada"));

    }
    
    

    
    fetch(queURL).then(res => res.json()).then(json => 
        {res.json({
            result: 'OK',
            coleccion: queColeccion,
            elementos: json.elementos
        });
    });
   
});

app.get('/api/:colecciones/:id', (req, res, next) => {
    //console.log('GET /api/:colecciones');
    //console.log(req.params);
    //console.log(req.collection);

    const queId = req.params.id;
    const queColeccion = req.params.colecciones;
    let queURL = `${URL_WS}/${queColeccion}/${queId}`;

    if(queColeccion == "coches"){
        //LLAMAMOS AL ENDPOINT DE COCHES
        queURL = `${URL_Coches}/${queColeccion}/${queId}`;

    }else if(queColeccion == "aviones"){
        //LLAMAMOS AL ENDPOINT DE AVIONES
        queURL = `${URL_Aviones}/${queColeccion}/${queId}`;

    }else if(queColeccion== "hoteles"){
        //LLAMAMOS AL ENDPOINT DE HOTELES
        queURL = `${URL_Hoteles}/${queColeccion}/${queId}`;

    }else{

        return next(new Error("No se ha introducido una colleción adecuada"));

    }


    fetch(queURL).then(res => res.json()).then(json => 
        {res.json({
            result: 'OK',
            coleccion: queColeccion,
            elemento: json.elemento
        });
    }); 
   

});

app.get('/api/:colecciones/id/:id', (req,res,next) => {
    
    const queId = req.params.id;
    const queColeccion = req.params.colecciones;
    let queURL = "";

    if(queColeccion == "coches"){
        //LLAMAMOS AL ENDPOINT DE COCHES
        queURL = `${URL_Coches}/${queColeccion}/id/${queId}`;

    }else if(queColeccion == "aviones"){
        //LLAMAMOS AL ENDPOINT DE AVIONES
        queURL = `${URL_Aviones}/${queColeccion}/id/${queId}`;

    }else if(queColeccion== "hoteles"){
        //LLAMAMOS AL ENDPOINT DE HOTELES
        queURL = `${URL_Hoteles}/${queColeccion}/id/${queId}`;

    }else{

        return next(new Error("No se ha introducido una colleción adecuada"));

    }

    fetch(queURL).then(res => res.json()).then(json => 
        {res.json({
            result: 'OK',
            coleccion: queColeccion,
            elemento: json.elemento
        });
    }); 


});

app.put('/api/:colecciones/:id', auth, (req,res,next) => {

    
    const queId = req.params.id;
    const queColeccion = req.params.colecciones;
    const elementoNuevo = req.body;
    let queURL = "";
    const queToken = req.headers.authorization.split(" ")[1];

    if(queColeccion == "coches"){
        //LLAMAMOS AL ENDPOINT DE COCHESS
        queURL = `${URL_Coches}/${queColeccion}/${queId}`;

    }else if(queColeccion == "aviones"){
        //LLAMAMOS AL ENDPOINT DE AVIONES
        queURL = `${URL_Aviones}/${queColeccion}/${queId}`;

    }else if(queColeccion == "hoteles"){
        //LLAMAMOS AL ENDPOINT DE HOTELES
        queURL = `${URL_Hoteles}/${queColeccion}/${queId}`;

    }else{

        return next(new Error("No se ha introducido una colleción adecuada"));

    }


    fetch(queURL, {
        method: 'PUT',
        body: JSON.stringify(elementoNuevo),
        headers:{
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${queToken}`

                }

    })
    .then(res => res.json())
    .then(json => 
    {res.json({
                result: 'OK',
                coleccion: queColeccion
                
            });
    });


});


app.delete('/api/:colecciones/:id', auth, (req,res,next) => {

    let queId = req.params.id;
    const queColeccion = req.params.colecciones;
    const elementoEliminar = req.body;
    let queURL = "";
    const queToken = req.headers.authorization.split(" ")[1];

    if(queColeccion == "coches"){
        //LLAMAMOS AL ENDPOINT DE COCHES
        queURL = `${URL_Coches}/${queColeccion}/${queId}`;

    }else if(queColeccion == "aviones"){
        //LLAMAMOS AL ENDPOINT DE AVIONES
        queURL = `${URL_Aviones}/${queColeccion}/${queId}`;

    }else if(queColeccion== "hoteles"){
        //LLAMAMOS AL ENDPOINT DE HOTELES
        queURL = `${URL_Hoteles}/${queColeccion}/${queId}`;

    }else{

        return next(new Error("No se ha introducido una colleción adecuada"));

    }



    fetch(queURL, {
        method: 'DELETE',
        body: JSON.stringify(elementoEliminar),
        headers:{
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${queToken}`

                }

    })
    .then(res => res.json())
    .then(json => 
    {res.json({
                result: 'OK',
                coleccion: queColeccion,
                elemento: json.elemento,
                
            });
    });
    


});






https.createServer(opciones, app).listen(port, () => {
    console.log(`API RESTful ejecutándose en https://localhost:${port}/api/:colecciones/:id`);
});

/*
app.listen(port, () => {
    console.log(`API RESTful ejecutándose en http://localhost:${port}/api/:colecciones/:id`);
});*/
