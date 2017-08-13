
var fs = require("fs");

// Constantes para direção da porta
var PORT_DIRECTION = {
	INPUT: 'in',
	OUTPUT: 'out'
}

var PULL_MODE = {
	HIGH: 'high',
	LOW: 'low'
}

// Definição da classe
function GPIOPort (portNumber) {
	this.port = portNumber;
   this.valueFile = "/sys/class/gpio/gpio" + portNumber + "/value";
	this.directionFile = "/sys/class/gpio/gpio" + portNumber + "/direction";
	this.desiredDirection = null;
	this.desiredPullMode = null;
	this.configuredDirection = null;
	this.configuredPullMode = null;
	this.readyCallback = null;

	this.getPort = function(){
		return this.port;
	};
	this.isOpen = function(){
		return fs.existsSync(this.valueFile);
	};
	this.getDirection = function(){
		this.configuredDirection = fs.readFileSync(this.directionFile, "utf-8").trim();
		return this.configuredDirection;
	};
	this.open = function(direction, readyCallbackParam, pullMode){
		// Se o parâmetro não está adequado
		if (direction != PORT_DIRECTION.INPUT && direction != PORT_DIRECTION.OUTPUT){
			console.log("GPIOPort.open port:" + this.port + " - Parâmetro não reconhecido: " + direction);
			console.log("GPIOPort.open port:" + this.port + " - Parâmetros válidos: 'in' ou 'out'");
			return;
		}//if

		if(pullMode == null){
			pullMode = PULL_MODE.LOW;

		}else{
			if (pullMode != PULL_MODE.LOW && pullMode != PULL_MODE.HIGH){
				console.log("GPIOPort.open port:" + this.port + " - Parâmetro não reconhecido: " + pullMode);
				console.log("GPIOPort.open port:" + this.port + " - Parâmetros válidos: 'in' ou 'out'");
				return;
			}//if
		}//if

		this.readyCallback = readyCallbackParam;
		this.desiredDirection = direction;
		this.desiredPullMode = pullMode;

		// Async
		fs.access(this.valueFile, fs.constants.F_OK, (err) => {
			
			if (err){// porta fechada
				// Abrir porta
				fs.writeFileSync("/sys/class/gpio/export", this.port.toString(), "utf-8");
				setTimeout(this.asyncSetDirection.bind(this), 300);

			}else{// Porta aberta
				console.log("GPIOPort.open port:" + this.port + " - Porta já está aberta");
				this.asyncSetDirection();
			}//if-else
		});
	};
	this.asyncSetDirection = function(){
		fs.writeFile(this.directionFile, this.desiredDirection, "utf-8", (err) =>{
			if(err) throw err;
			this.configuredDirection = this.desiredDirection;
			this.asyncSetPullMode();
		});
	};
	this.asyncSetPullMode = function(){
		fs.writeFile(this.directionFile, this.desiredPullMode, "utf-8", (err) =>{
			if(err) throw err;
			this.configuredPullMode = this.desiredPullMode;
			setTimeout(this.readyCallback, 0);
		});
	};
	this.setValue = function(value){
		if (this.configuredDirection == PORT_DIRECTION.OUTPUT){
			var valueString = (value)? "1": "0";
			fs.writeFileSync(this.valueFile, valueString, "utf-8");
		}else{
			console.log("GPIOPort.setValue port:" + this.port + " ERROR - Tentativa de escrita em porta de INPUT: " + this.configuredDirection);
		}//if-else
	};
	this.getValue = function(){
		if (this.configuredDirection == PORT_DIRECTION.INPUT){
			var value = fs.readFileSync(this.valueFile, value, "utf-8");
			var booleanValue = (value == 1)? true : false;
			return booleanValue;
		}else{
			console.log("GPIOPort.getValue port:" + this.port + " ERROR - Tentativa de leitura em porta de OUTPUT");
		}//if-else
	}
}

module.exports.GPIOPort = GPIOPort;
module.exports.PORT_DIRECTION = PORT_DIRECTION;
module.exports.PULL_MODE = PULL_MODE;
