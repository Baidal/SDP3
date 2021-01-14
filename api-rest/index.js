'use strict'
const port = process.env.PORT || 3000;

const https = require('https');
const express = require('express');
const logger = require('morgan');
const mongojs = require('mongojs');
const fs = require('fs');

const opciones = {
    key: fs.readFileSync('./cert/key.pem'),
    cert: fs.readFileSync('./cert/cert.pem')
}

const app = express();

app.use(logger('dev'));
app.use(express.urlencoded( { extended: false } ));
app.use(express.json());

var db = mongojs("SD");     //Base de datos de la app
var id = mongojs.ObjectID;  //Convertir un id textual en un objeto mongojs

//Cada vez que tengamos el parametro colecciones se llamará a esta funcion que conectará con la BD.
app.param("colecciones", (req, res, next, coleccion) => {
    console.log('param /api/:colecciones');
    console.log('coleccion: ', coleccion);

    req.collection = db.collection(coleccion); //Puntero a función que apunta a la BD y a la tabla indicada. 
    //Req es común a todas las funciones

    return next();
});

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
app.get('/api', (req, res, next) => {
    console.log('GET /api');
    console.log(req.params);
    console.log(req.collection);

    db.getCollectionNames((err, colecciones) => {

        if (err) return next(err);
        console.log(colecciones);
        res.json({result: 'OK', colecciones: colecciones});

    });
});

app.get('/api/:colecciones', (req, res, next) => {
    console.log('GET /api/:colecciones');
    console.log(req.params);
    console.log(req.collection);

    req.collection.find((err, coleccion) => {
        if (err) return next(err);
        
        console.log(coleccion);
        res.json({
            result: 'OK',
            colección: req.params.colecciones,
            elementos: coleccion
        })

    });

});

app.get('/api/:colecciones/:id', (req, res, next) => {
    //console.log('GET /api/:colecciones');
    //console.log(req.params);
    //console.log(req.collection);

    const queId = req.params.id;
    const queColeccion = req.params.colecciones;

    req.collection.findOne({_id: id(queId) }, (err, elemento) => {
        if (err) return next(err);
        
        console.log(elemento);
        res.json({
            result: 'OK',
            colección: queColeccion,
            elemento: elemento
        });

    });


});

app.put('/api/:colecciones/:id', auth, (req,res,next) => {

    const queId = req.params.id;
    const queColeccion = req.params.colecciones;
    const elementoNuevo = req.body;
    console.log("Me han llamado");


    req.collection.update(
        
        {_id: id(queId)},
        {$set: elementoNuevo},
        {safe: true, multi: false },
        (err, result) => {
            if(err) return next(err);

            console.log(result);
            res.json({
                result: 'OK',
                coleccion: queColeccion,
                _id: queId,
                resultado: result
            });
        }

    );


});


app.delete('/api/:colecciones/:id', auth, (req,res,next) => {

    let queId = req.params.id;
    let queColeccion = req.params.colecciones;

    req.collection.remove(
        
        {_id: id(queId)},
        (err, result) => {
            if(err) return next(err);

            console.log(result);
            
            res.json({
                result: 'OK',
                coleccion: queColeccion,
                _id: queId,
                resultado: result
            });
        }

    );


});


app.post('/api/:colecciones', auth, (req, res, next) => {
    console.log(req.body);
    
    const nuevoElemento = req.body;

    req.collection.save(nuevoElemento, (err, elementoGuardado) => {
        if (err) return next(err);

        res.json({
            result: 'OK',
            colección: req.params.colecciones,
            elemento: elementoGuardado
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