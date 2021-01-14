'use strict'
const port = process.env.PORT || 7004;

const https = require('https');
const express = require('express');
const logger = require('morgan');
const mongojs = require('mongojs');
const fs = require('fs');

const opciones = {
    key: fs.readFileSync('./../api-rest/cert/key.pem'),
    cert: fs.readFileSync('./../api-rest/cert/cert.pem')
}

const app = express();

app.use(logger('dev'));
app.use(express.urlencoded( { extended: false } ));
app.use(express.json());

var db = mongojs('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority',["coches"]);     //Base de datos de la app
var id = mongojs.ObjectID;  //Convertir un id textual en un objeto mongojs

db.on("error",function(error) {
    console.log("Database error: ",error)
});

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


app.get('/api/:colecciones', (req, res, next) => {
    const queColeccion = req.params.colecciones;
    
    console.log(`GET /api/${queColeccion}`);
    //console.log(req.params);
    //console.log(req.collection);

    console.log(JSON.stringify(req.body));

    //console.log("Está llamando aquí, nose porque");

    req.collection.find((err, coleccion) => {
        if (err) return next(err);
        
        //console.log(coleccion);
        res.json({
            result: 'OK',
            colección: req.params.colecciones,
            elementos: coleccion
        })

    });

});


app.get('/api/:colecciones/:nombre', (req, res, next) => {
    //console.log('GET /api/:colecciones');
    //console.log(req.params);
    //console.log(req.collection);

    

    const queNombre = req.params.nombre;
    const queColeccion = req.params.colecciones;

    console.log(`GET /api/${queColeccion}/${queNombre}`);
    

    req.collection.findOne({nombre:  queNombre}, (err, elemento) => {
        if (err) return next(err);
        
        //console.log(elemento);
        res.json({
            result: 'OK',
            colección: queColeccion,
            elemento: elemento
        });

    });


});

app.get('/api/:colecciones/id/:id',(req,res,next) => {
    const queId = req.params.id;
    const queColeccion = req.params.colecciones;

    console.log(`GET /api/${queColeccion}/id/${queId}`);

    req.collection.find((err,coleccion) => {
        if (err) return next(err);

        res.json({
            result: 'OK',
            colección: req.params.colecciones,
            elemento: coleccion

        })

    });



});

app.put('/api/:colecciones/:nombre', auth, (req,res,next) => {

    const queNombre = req.params.nombre;
    const queColeccion = req.params.colecciones;
    const elementoNuevo = req.body;

    console.log(`PUT /api/${queColeccion}/${queNombre}`);

    req.collection.update(
        
        {nombre: queNombre},
        {$set: elementoNuevo},
        {safe: true, multi: false },
        (err, result) => {
            if(err) return next(err);

            console.log(result);
            res.json({
                result: 'OK',
                coleccion: queColeccion,
                nombre: queNombre,
                resultado: result
            });
        }

    );


});


app.delete('/api/:colecciones/:id', auth, (req,res,next) => {

    let queId = req.params.id;
    let queColeccion = req.params.colecciones;

    console.log(`DELETE /api/${queColeccion}/${queId}`);

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
    //console.log(req.body);
    
    const nuevoElemento = req.body;
    const queColeccion = req.params.colecciones;

    console.log(`POST /api/${queColeccion}`);

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
    console.log(`API RESTful de coches ejecutándose en https://localhost:${port}/api/:colecciones/:id`);
});
/*
app.listen(port, () => {
    console.log(`API RESTful ejecutándose en http://localhost:${port}/api/:colecciones/:id`);
});*/
