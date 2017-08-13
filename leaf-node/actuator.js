/*jshint esversion: 6*/

var Driver = require("rainfall-tcp");
var Leaf = require("rainfall-leaf");
var GPIO = require("./GPIO.js");

var dataTypeArray = [{
								id: 18,
								measureStrategy: "event",
								type: "bool",
								range: [0, 1],
								dataCategory: "pressed",
								unit: "" 
							}];

var commandTypeArray = [{
									id: 17,
									type: "bool",
									commandCategory: "toggle",
				               range: [0, 1],
				               unit: ""
								},{
									id: 22,
									type: "bool",
									commandCategory: "toggle",
				               range: [0, 1],
   				            unit: ""
								},{
									id: 27,
									type: "bool",
									commandCategory: "toggle",
				               range: [0, 1],
				               unit: ""
								}];

// Portas de Saída
var gpioPort17 = new GPIO.GPIOPort(17);
gpioPort17.open(GPIO.PORT_DIRECTION.OUTPUT, function(){console.log("Porta 17 pronta.")});

var gpioPort22 = new GPIO.GPIOPort(22);
gpioPort22.open(GPIO.PORT_DIRECTION.OUTPUT, function(){console.log("Porta 22 pronta.")});

var gpioPort27 = new GPIO.GPIOPort(27);
gpioPort27.open(GPIO.PORT_DIRECTION.OUTPUT, function(){console.log("Porta 27 pronta.")});

// Portas de Entrada
var gpioPort18 = new GPIO.GPIOPort(18);
gpioPort18.open(GPIO.PORT_DIRECTION.INPUT, function(){console.log("Porta 18 pronta.")});

var gpioPort23 = new GPIO.GPIOPort(23);
gpioPort23.open(GPIO.PORT_DIRECTION.INPUT, function(){console.log("Porta 23 pronta.")});

var gpioPort24 = new GPIO.GPIOPort(24);
gpioPort24.open(GPIO.PORT_DIRECTION.INPUT, function(){console.log("Porta 24 pronta.")});

// Array de sensores
var sensores = [];
sensores[18] = gpioPort18;
sensores[23] = gpioPort23;
sensores[24] = gpioPort24;

// Array com últimas leituras
var ultimasLeituras = [];

var localLeaf = null;

//Creates the TCP driver
Driver.createDriver({rport: 4568}, function (err, driver) {
	if (err)
        console.log(err);
	else {
	//Creates the Leaf
		Leaf.createLeaf(
			driver,
			{
            //This leaf receives one command
				dataType: dataTypeArray,
				commandType: commandTypeArray,
            path: '.'
			},
			function (err, leaf) {
				if (err)
                console.log(err);
				else {
					localLeaf = leaf;
               leaf.sendExternalCommand([{ id: 17, value: 0 }]);
               //leaf.sendData([{ id: 18, value: 0 }]);
					leaf.listenCommand(
						function (obj) {
							onCommand(obj.command[0]);
						},
						function() {
							if (err)
                     	console.log(err);
							else {
                        //Node is running
								console.log("[initialized] Dispositivo IoT iniciado");
							}
						});
					setInterval(lerSensores, 100);
				}
			});
	}
});

//Command callback
function onCommand(cmd) {
	console.log("[command received] id: " + cmd.id + ": " + (!cmd.value ? "Desligar" : "Ligar"));

	var boolValue = (!cmd.value)? false: true;

	switch(cmd.id){
	case 17:
		gpioPort17.setValue(boolValue);
		break;

	case 22:
		gpioPort22.setValue(boolValue);
		break;

	case 27:
		gpioPort27.setValue(boolValue);
		break;

	default:
		console.log("id:" + cmd.id + " não encontrado!");
	}
}



// Funções de leitura dos sensores
function lerSensores(){
	for(var sensorIndex =0; sensorIndex < sensores.length; sensorIndex++){
		var sensor = sensores[sensorIndex];
		if(sensor != null){
			lerSensor(sensorIndex);
		}//if
	}//for
}

function lerSensor(idSensor){
	var leitura = 0;
	var sensor = sensores[idSensor];	

	leitura = sensor.getValue();
	if (leitura != ultimasLeituras[idSensor]){
		console.log("Nova leitura de " + idSensor + ": " + leitura);
		localLeaf.sendData([{ id: idSensor, value: leitura }]);
		ultimasLeituras[idSensor] = leitura;
	}//if
}

