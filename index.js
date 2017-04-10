// required imports
var config = require("./config.json");
var message = require("./message.js");
var parsedWords = require('./words.json');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var FileReader = require('filereader');
var fileReader = new FileReader();
var FileAPI = require('file-api');
var File = FileAPI.File;
var path = require('path');

var pub = __dirname + '/public';
app.use(express.static(pub));
app.use("/csv", express.static(__dirname + '/csv'));

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

//reads command file on app startup
fileReader.readAsText (new File(__dirname + '/csv/commands.csv'),"UTF-8");

// Index route
app.get('/', function (req, res) {

    //console.log(message.sendJson(0, "./highlights.json"));
    res.send('Hello world, I am a chat bot ' + fileReader.result );
    var text = "zeig mir die highlights";
    var commandJson = csvToJSON(fileReader.result);
    JSON.stringify(commandJson)
    console.log(JSON.stringify(commandJson));

    
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'] + " " + fileReader.result);
    }
    res.send('Error, wrong token');
})

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text.toLowerCase();
            var commandJson = csvToJSON(fileReader.result);
            if(includesCommand(text, commandJson)) {
                message.sendJson(sender, getCommandFile(text, commandJson));
                continue;
            } else if(includesSearchIdentifier(text)) {
				text = convertTextToSearchQuery(cleanupSearchQuery(text));
                message.sendText(sender, "Wie wärs wenn de selber suchst? Kannst alternativ auch hier drauf klicken: https://www.baur.de/s/" + encodeURI(text));
				continue;
			} else if(text === 'generic') {
                message.sendGeneric(sender);
                continue;
            } else if(text.includes("du bist krass")) {
                message.sendText(sender, "Danke ich weiß (Y)!");
            } else if(text.includes("orakel") || text.includes("frage")) {
                var tempNumber = Math.floor((Math.random() * 100) + 1);
                if(text.includes("erik")) {
                    message.sendText(sender, "Ich darf Fragen über Götter nicht beantworten! ")
                } else if(tempNumber < 40) {
                    message.sendText(sender, "Die Antwort ist definitiv: NEIN! >:o"); 
                } else if(tempNumber >= 40 && tempNumber <= 60 ) {
                   message.sendText(sender, "Keine Ahnung... Frag nochmal! :-/"); 
                } else {
                    message.sendText(sender, "JA! Auf jeden Fall! (Y)")
                }
            }
        }
        if (event.postback) {
            text = JSON.stringify(event.postback);
            message.sendText(sender, "Postback received: "+text.substring(0, 200), token);
            continue;
        }
    }
    res.sendStatus(200);
})

function convertTextToSearchQuery(text) {
    var adjectives = "";
    var nouns = "";
    var wordArray = text.split(" ");

    for (var i = 0; i < wordArray.length; i++) {
        for (var j = 0; j < parsedWords.adjectives.length; j++) {
            if(wordArray[i].includes(parsedWords.adjectives[j])) {
                 if(adjectives.length < 1) {
                    adjectives = wordArray[i];
                } else {
                    adjectives = adjectives + " " + wordArray[i];
                }
                continue;
            }
        }
        for (var k = 0; k< parsedWords.nouns.length; k++) {
            if(wordArray[i].includes(parsedWords.nouns[k])) {
                if(nouns.length < 1) {
                    nouns = wordArray[i];
                } else {
                    nouns = nouns + " " + wordArray[i];
                }
                continue;
            }
        }
    }
    if(nouns.length < 1) {
        return text;
    }
    return adjectives + " " + nouns;
}

function includesCommand(text, commandJson) {
    for (var i = 0; i < commandJson.length; i++) {
        if(text.includes(commandJson[i].command)) {
            return true;
        }
    }
    return false;
}

function includesSearchIdentifier(text) {
    for (var j = 0; j < parsedWords.searchIdentifier.length; j++) {
        if(text.includes(parsedWords.searchIdentifier[j])) {
            return true;
        }
    }
    return false;
}

function cleanupSearchQuery(text) {
    for (var j = 0; j < parsedWords.unusedWords.length; j++) {
        if(text.includes(parsedWords.unusedWords[j])) {
            text = text.replace(parsedWords.unusedWords[j], "");
        }
    }
    return text;
}

function getCommandFile(text, commandJson) {
    for (var i = 0; i < commandJson.length; i++) {
        if(text.includes(commandJson[i].command)) {
            return commandJson[i].fileName;
        }
    }
    return false;
}

function csvToJSON(csv) {
    var lines=csv.split("\n");
    var result = [];
    var headers=lines[0].split(",");
    for(var k=1;k<lines.length;k++){
        var obj = {};
        var currentline=lines[k].split(",");
        for(var j=0;j<headers.length;j++){
          obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    return result; //JavaScript object
    //return JSON.stringify(result); //JSON
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
})