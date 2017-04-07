var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var token = "EAAC6ygZBGWZBUBAH1Msr2r49NdZBjYCOlxay8hWgKcUo5ZAsZAOB5FZCxlA3r912Cr17ZB7ZAlAYy32oLoPUs79OaXBq9xDO6TGF5zmZBQoPieY5jMA7d1ONEx71sB8J3dOrf1j3ebjROOMfq6YocCthNiuZBJe2NOCPrYy2ACSoP7SQZDZD";

var message = require("./message.js");
var parsedWords = require('./words.json');



app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');
    console.log(convertTextToSearchQuery("Suche nach einen großen schwarzen pullover"));
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
})

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        if (event.message && event.message.text) {
            text = event.message.text;
            if (text === 'Generic') {
                sendGenericMessage(sender);
                continue;
            } else if(text.toLowerCase().includes("suche")) {
				text = convertTextToSearchQuery(text);
                message.sendText(sender, "Wie wärs wenn de selber suchst? Kannst alternativ auch hier drauf klicken: https://www.baur.de/s/" + encodeURI(text));
                message.sendButton(sender, "web_type", "http://www.google.de", "Wie wärs mit Google?");
				continue;
			}
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
    return query;
}

function includesSearchIdentifier(text) {
    for (var j = 0; j < parsedWords.searchIdentifier.length; j++) {
        if(text.includes(parsedWords.searchIdentifier[j])) {
            return true;
        }
    }
    return false;
}
// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
})