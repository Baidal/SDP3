'use strict'
const port = process.env.PORT || 7007;
const https = require('https');
const express = require('express');
const logger = require('morgan');
const mongojs = require('mongojs');
const fs = require('fs');
const opciones = {
    key: fs.readFileSync('./../api-rest/cert/key.pem'),
    cert: fs.readFileSync('./../api-rest/cert/cert.pem')
}
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');
const { ObjectID } = require('mongodb');
const tokenService = require('./../auth/services/token.service');

const app = express();

app.use(logger('dev'));
app.use(express.urlencoded( { extended: false } ));
app.use(express.json());

mongoose.connect('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true});
const db_mongoose = mongoose.connection;


var db = mongojs('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority',["aviones"]);     //Base de datos de la app
var id = mongoose.ObjectId  //Convertir un id textual en un objeto mongojs

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

app.get('/api/paquetes',(req,res,next) => {
   
    var paquetes = mongojs('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority');
    req.collection = paquetes.collection("paquetes");

    req.collection.find((err, paquete) => {
        if (err) return next(err);
    
        console.log(paquete);

        res.json({
            result: 'OK',
            Paquetes:paquete
        });

    });

});


app.post('/api/paquetes',auth,(req,res,next) => {
    

    const search_params = req.body;

        var paquetes = mongojs('mongodb+srv://luis:luisSD2020@sd.7nmy6.mongodb.net/SD?retryWrites=true&w=majority');
        req.collection = paquetes.collection("aviones");

        var id_avion = null;
        var id_coche = "";
        var id_hotel = "";

        
        req.collection.findOne({ciudad_llegada: search_params.ciudad_avion,reservado: "no"}, (err,avion) => {
            if (err) return next(err);
        
            if(avion != null)
                id_avion = avion._id;
            
            req.collection = paquetes.collection("coches");

            req.collection.findOne({ciudad: search_params.ciudad_coche,reservado: "no"}, (error,coche) => {
                if (err) return next(err);

                if(coche != null)
                    id_coche = coche._id;
                
                //console.log("avion: " + id_avion + "coche: " + id_coche);
                req.collection = paquetes.collection("hoteles");

                req.collection.findOne({ciudad: search_params.ciudad_hotel,reservado: "no"}, (error_ciudad,hotel) => {
                    if (error_ciudad) return next(err);

                    if(hotel != null)
                        id_hotel = hotel._id;

                    
                    //console.log("avion: " + id_avion + "coche: " + id_coche + "ciudad: " + id_hotel);

                    req.collection = paquetes.collection("paquetes");

                    req.collection.findOne({id_avion: id_avion.toString(),id_coche: id_coche.toString(),id_hotel: id_hotel.toString()}, (error_paquete,existe) => {
                        if(error_paquete) return next(error_paquete);

                        //console.log(existe);

                        if(existe != null){
                            res.json({Error: "Ya existe el paquete en el sistema."});
                        }else{
                            var json_string = '{"id_avion":"' + id_avion + '", "id_coche":"' + id_coche + '", "id_hotel":"' + id_hotel +'", "reservado":"no", "coche":' + JSON.stringify(coche) + ', "avion":' + JSON.stringify(avion) + ', "hotel": '+ JSON.stringify(hotel)+'}';
                    
                            console.log(json_string);

                            var json_file = JSON.parse(json_string);

                            req.collection.save(json_file,(err,elementoGuardado) => {
                                if(err) return next(err);

                                res.json({
                                    Error: 'Paquete guardado.',
                                    IDs: json_file,
                                    coche: coche,
                                    hotel: hotel,
                                    avion: avion
                                });

                            });
                        }
                    });

                });




            });

        });
    



});

async function reservarPaquete(id_avion,id_coche,id_hotel,id_paquete,email){

    var devolver;

    const avionSchema = new mongoose.Schema({
        reservado: String
    });

    const paqueteSchema = new mongoose.Schema({
        reservado: String,
        email: String
    });

    const cocheSchema = new mongoose.Schema({
        reservado: String
    });

    const hotelSchema = new mongoose.Schema({
        reservado: String
    });

    paqueteSchema.set('collection','paquetes');
    const paquete = mongoose.model('paquetes',paqueteSchema);

    avionSchema.set('collection','aviones');
    const avion = mongoose.model('aviones',avionSchema);

    cocheSchema.set('collection','coches');
    const coche = mongoose.model('coches',cocheSchema);

    hotelSchema.set('collection','hoteles');
    const hotel = mongoose.model('hoteles',hotelSchema)

    const session = await db_mongoose.startSession();
    session.startTransaction();

    const avion_mod = await avion.updateOne({_id: mongoose.Types.ObjectId(id_avion)},{reservado: "si"},{session: session}).exec();
    const coche_mod = await coche.updateOne({_id: mongoose.Types.ObjectId(id_coche)},{reservado: "si"},{session: session}).exec();
    const hotel_mod = await hotel.updateOne({_id: mongoose.Types.ObjectId(id_hotel)},{reservado: "si"},{session: session}).exec();

    //Si los 3 se han modificado, la suma de sus nModified será 3, por lo que se habrán
    //reservado correctamente
    if((avion_mod.nModified + coche_mod.nModified + hotel_mod.nModified) == 3){
        await session.commitTransaction();
        await paquete.updateOne({_id: mongoose.Types.ObjectId(id_paquete)},{reservado: "si",email: email}).exec();
        devolver = true;
    }else{
        await session.abortTransaction();
        devolver = false;
    }
    session.endSession();

    mongoose.models = {};
    mongoose.modelSchemas = {};

    return devolver;

    
}

app.post('/api/paquetes/reservar/:id',auth,(req,res,next) => {

    const paqueteSchema = new mongoose.Schema({});

    const paquete = mongoose.model('Paquete',paqueteSchema);

    const queID = req.params.id;

    const cuerpo = req.body;
    const jwt = cuerpo.jwt;
    const email = cuerpo.email;

    paquete.findOne({_id: mongoose.Types.ObjectId(queID)}, (err, paq) => {
        if(err) return next(err);

        if(paq == null)
            res.json({
                Respuesta: 'Error. Se ha introducido un id de un paquete que no existe'
            });

        if(!tokenService.decodificaToken(jwt)) //Hay que enviar un token valido para poder reservar un paquete
            res.json({
                Respuesta: 'Error. No se ha introducido el token o este es incorrecto (mal formato/expirado)'
            });


        paq = JSON.stringify(paq);
        paq = JSON.parse(paq);

        reservarPaquete(paq.id_avion,paq.id_coche,paq.id_hotel,paq._id,email).then(resultado => {

            if(resultado){ //se ha completado correctamente la reserva

                res.json({
                    Respuesta: "Correcto. El paquete se ha reservado con éxito."
                });

            }else{

                res.json({
                    Respuesta: "Error. Uno de los paquetes ya ha sido reservado."
                });

            }

        });


        mongoose.models = {};
        mongoose.modelSchemas = {};
    
    });

    

});



https.createServer(opciones, app).listen(port, () => {
    console.log(`API RESTful para la reserva de paquetes ejecutándose en https://localhost:${port}/api/:colecciones/:id`);
});
