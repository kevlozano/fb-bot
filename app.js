// Importar las dependencias para configurar el servidor
var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// configurar el puerto y el mensaje en caso de exito
app.listen((process.env.PORT || 5000), () => console.log('El servidor webhook esta escuhando!'));

// Ruta de la pagina index
app.get("/", function (req, res) {
    res.send("Se ha desplegado de manera exitosa el CMaquera ChatBot :D!!!");
});

// Facebook Webhook

// Usados para la verificacion
app.get("/webhook", function (req, res) {
    // Verificar la coincidendia del token
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        // Mensaje de exito y envio del token requerido
        console.log("webhook verificado!");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        // Mensaje de fallo
        console.error("La verificacion ha fallado, porque los tokens no coinciden");
        res.sendStatus(403);
    }
});

// Todos eventos de mesenger sera apturados por esta ruta
app.post("/webhook", function (req, res) {
    // Verificar si el vento proviene del pagina asociada
    if (req.body.object == "page") {
        // Si existe multiples entradas entraas
        req.body.entry.forEach(function(entry) {
            // Iterara todos lo eventos capturados
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    process_event(event);
                }
            });
        });
        res.sendStatus(200);
    }
});

function handleMessage(mssg) {
    let precio = mssg.includes("precio");
    let cuanto = mssg.includes("cuanto");
    let venta = mssg.includes("venta");
    let direccion = mssg.includes("direccion");
    let ubicacion = mssg.includes("ubicacion");
    let talla = mssg.includes("talla");
    let hora = mssg.includes("hora");
    let slim = mssg.includes("slim");
    let promo = mssg.includes("promo");

    console.log("in handleMessage");

    if (slim > 0)
        return "La renta de trajes slim fit va desde 800$. Manejamos en negro, azul, gris y rojo."
    else if ((precio > 0 || cuanto > 0) && venta != 1)
        return "Buen día, la renta va desde 600$. Incluye saco, camisa, pantalon y corbata";
    else if (venta > 0)
        return "La renta va desde 600$. No manejamos ventas.";
    else if (promo > 0)
        return "Por la temporada manejamos la renta de dos o más trajes slim fit con 10% de descuento. Y la renta de 3 o más smoking también con 10% de descuento.";
    else if (direccion > 0 || ubicacion > 0)
        return "Avenida general Nicolas Bravo 619, colonia La Huerta. Guadalupe, NL. A un lado de Soriana Guadalupe.";
    else if (talla > 0)
        return "Manejamos desde talla 1 para niños hasta la 60 para adultos.";
    else if (hora > 0)
        return "Estamos abiertos de 10am a 8pm de Lunes a Sábado (sábados hasta las 7pm).";
}

// Funcion donde se procesara el evento
function process_event(event){
    // Capturamos los datos del que genera el evento y el mensaje 
    var senderID = event.sender.id;
    var message = event.message;
    console.log("in process event: " + event.message.text);
    // Si en el evento existe un mensaje de tipo texto
    if(message.text){
        var response = {
            "text": handleMessage(message.text)
        }
    }
    console.log("response is: " + response.text);
    // Enviamos el mensaje mediante SendAPI
    enviar_texto(senderID, response);
}

// Funcion donde el chat respondera usando SendAPI
function enviar_texto(senderID, response){
    // Construcicon del cuerpo del mensaje
    let request_body = {
        "recipient": {
          "id": senderID
        },
        "message": response
    }
    
    // Enviar el requisito HTTP a la plataforma de messenger
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
          console.log('Mensaje enviado!')
        } else {
          console.error("No se puedo enviar el mensaje:" + err);
        }
    }); 
}