/* Rules */

var fs = require("fs");
var ReadLine = require("readline");

/* Definição de uma regra
{
	ruleName: '',
	condition: '',
	commands: [
	]
}
*/

//Definição da classe
function Rules (fileName){
	this.fileName = fileName;
	this.rules = {};
	this.currentRule = {};
	this.currentCommandIndex = 0;
	
	this.load = function() {
		var reader = ReadLine.createInterface({input: fs.createReadStream(fileName)});
		
		reader.on('line', (line) => {
			//console.log("Line: " + line);

			if (line.length == 0){
				return;
			}//if
			
			if (line.charAt(0) == '#'){
				console.log("Comentário: " + line)

			}else{
				var splittedRule = line.split(':');

				// Carregar regra
				if (splittedRule.length == 2){
					this.currentRule = new Object();
					this.currentRule.ruleName = splittedRule[0];
					
					var conditionLine = this.parseConditionLine(splittedRule[1]);
					
					console.log("ConditionLine: " + conditionLine);
					this.currentRule.condition = new Function(
						"sensorsStatus",
						conditionLine
					);

					console.log("regra:" + this.currentRule.ruleName);
					//console.log("condição:" + this.currentRule.condition);
					this.rules[this.currentRule.ruleName] = this.currentRule;
					this.currentCommandIndex = 0;

				// Carregar comando
				}else if (splittedRule.length == 1){
					var splittedCommand = line.split(' ');
					
					// Se tem o número correto de parâmetros para o comando
					if (splittedCommand.length == 2){

						var splittedActuator = splittedCommand[0].split('.');

						// Se tem o número correto de parâmetros para identificar o atuador
						if (splittedActuator.length == 2){

							if (this.currentCommandIndex == 0){
								this.currentRule.commands = [];
							}//if
							this.currentRule.commands[this.currentCommandIndex] = {};
							this.currentRule.commands[this.currentCommandIndex].nodeId = splittedActuator[0];
							this.currentRule.commands[this.currentCommandIndex].actuatorId = splittedActuator[1];
							this.currentRule.commands[this.currentCommandIndex].value = splittedCommand[1];
							this.currentCommandIndex++;

						}else{
							console.log("ERRO ao ler atuador (linha): " + line);
						}//if-else
						
					}else{
						console.log("ERRO ao ler comando: " + line);
					}//if-else
				}else{
					console.log("WARNING linha: " + line);
				}//if
			}//if-else
		});
	};
	this.parseConditionLine = function(conditionString) {
		var chars =  conditionString.split('');
		var tokens = [];
		var token = "";
		var ok = true;
		var charIndex = 0;
		var conditionLine = "return ";

		// Para cada token na linha
		while(ok && charIndex < chars.length){
			switch (chars[charIndex]){
				case ' ':
					if (token != "") tokens.push(token);
					token = "";
				break;
				case '(':
					if (token != "") tokens.push(token);
					token = "";
					tokens.push("(");
				break;
				case ')':
					if (token != "") tokens.push(token);
					token = "";
					tokens.push(")");
				break;
				default:
					token = token + chars[charIndex];
				break;
			}//switch
			charIndex++;
		}//while

		if (token != "") tokens.push(token);

		ok = true;
		var tokenIndex = 0;
		var parenthesisCount = 0;
		var state = "initial";

		while(ok && tokenIndex < tokens.length){
			var token = tokens[tokenIndex];

			switch(token){
				case "(":
					if (state != "initial" && state != "expectingIdentifier"){
						console.log("ERRO - aguardando ATUADOR: " + conditionString);
						return null;
					}//if
					parenthesisCount++;
					conditionLine = conditionLine + "(";
					break;
				case ")":
					if (state != "expectingIdentifier" && parenthesisCount <= 0){
						console.log("ERRO - aguardando ATUADOR: " + conditionString);
						return null;
					}//if
					parenthesisCount--;
					conditionLine = conditionLine + ")";
					break;
				case "!=":
				case "==":
				case ">":
				case ">=":
				case "<":
				case "<=":
					if (state != "expectingValueOperator"){
						console.log("ERRO - aguardando comparador '" + token + "' linha: " + conditionString + " state: " + state);
						return null;
					}//if
					conditionLine = conditionLine + " " + token;
					state = "expectingValue";
					break;
				case "&&":
				case "||":
					if (state != "expectingIdentifier"){
						console.log("ERRO - aguardando comparador '" + token + "' linha: " + conditionString);
						return null;
					}//if
					conditionLine = conditionLine + " " + token;
					state = "expectingIdentifier";
					break;
				default:
					if (token.indexOf('.') > 0){
						if (state != "initial" && state != "expectingIdentifier"){
							console.log("ERRO - aguardando ATUADOR '" + token + "' linha: " + conditionString);
							return null;
						}//if
						conditionLine = conditionLine + " sensorsStatus['" + token + "']";
						state = "expectingValueOperator";
					}else{
						if (state != "expectingValue"){
							console.log("ERRO - aguardando valor: " + conditionString);
							return null;
						}//if
						conditionLine = conditionLine + " " + token;
						state = "expectingIdentifier";
					}//if-lese
					break;
			}//switch

			tokenIndex++;
		}//while

		return conditionLine + ";";
	};
	this.checkConditions = function(sensorsStatus, onMatchCallback){
		for(var ruleName in this.rules){
			var rule = this.rules[ruleName];
			if (rule.condition(sensorsStatus)){
				onMatchCallback(rule);
			}//if
		}//for
	};
};


module.exports.Rules = Rules;
