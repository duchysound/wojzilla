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

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

//reads command file on app startup
fileReader.readAsText (new File("commands.csv"),"UTF-8");

// Index route
app.get('/', function (req, res) {

    //console.log(message.sendJson(0, "./highlights.json"));
    res.send('Hello world, I am a chat bot');
    var text = "zeig mir die highlights";

   console.log(path.dirname(require.main.filename));
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
})

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging;
    var commandJson = csvToJSON(fileReader.result);
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text.toLowerCase();
            if(includesSearchIdentifier(text)) {
				text = convertTextToSearchQuery(text);
                message.sendText(sender, "Wie wärs wenn de selber suchst? Kannst alternativ auch hier drauf klicken: https://www.baur.de/s/" + encodeURI(text));
				continue;
			} else if(text === 'generic') {
                message.sendGeneric(sender);
                continue;
            } 
            //else if(includesCommand(text)) {
             //   message.sendJson(sender, getCommandFile(text));
               // continue;
            //}
            message.sendText(sender, "includesCommand: " + path.dirname(require.main.filename));
            message.sendText(sender, "Text received, echo: " + text.substring(0, 200));
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
    var query = "";
    var wordArray = text.split(" ");

    for (var i = 0; i < wordArray.length; i++) {
        for (var j = 0; j < parsedWords.adjectives.length; j++) {
            if(wordArray[i].includes(parsedWords.adjectives[j])) {
                 if(query.length < 1) {
                    query = wordArray[i];
                } else {
                    query = query + " " + wordArray[i];
                }
                continue;
            }
        }
        for (var k = 0; k< parsedWords.nouns.length; k++) {
            if(wordArray[i].includes(parsedWords.nouns[k])) {
                if(query.length < 1) {
                    query = wordArray[i];
                } else {
                    query = query + " " + wordArray[i];
                }
                continue;
            }
        }
    }
    if(query < 1) {
        query = text;
    }
    return query;
}

function includesCommand(text) {
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

function getCommandFile(text) {
    for (var i = 0; i < commandJson.length; i++) {
        if(text.includes(commandJson[i].command)) {
            return commandJson[i].fileName;
        }
    }
    return false;
}

function csvToJSON(csv) {
    var lines=csv.split("\r\n");
    var result = [];
    var headers=lines[0].split(",");

    for(var i=1;i<lines.length;i++){
        var obj = {};
        var currentline=lines[i].split(",");

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