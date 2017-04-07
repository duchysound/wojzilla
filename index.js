var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var token = "EAAC6ygZBGWZBUBAH1Msr2r49NdZBjYCOlxay8hWgKcUo5ZAsZAOB5FZCxlA3r912Cr17ZB7ZAlAYy32oLoPUs79OaXBq9xDO6TGF5zmZBQoPieY5jMA7d1ONEx71sB8J3dOrf1j3ebjROOMfq6YocCthNiuZBJe2NOCPrYy2ACSoP7SQZDZD";
var parsedWords = require('./words.json');


app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot');

    for (var i = 0; i < parsedWords.nouns.length; i++) {
      console.log(parsedWords.nouns[i]);
    }
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
				var searchWord = text;
                for (var i = 0; i < parsedWords.nouns.length; i++) {
                    if(text.includes(parsedWords.nouns[i])) {
                        text = parsedWords.nouns[i];
                        continue;
                    }
                }


                sendTextMessage(sender, "Wie wärs wenn de selber suchst? Kannst alternativ auch hier drauf klicken: https://www.baur.de/s/" + encodeURI(text));
                for (var i = 0; i < parsedWords.nouns.length; i++) {
                  sendTextMessage(sender, parsedWords.nouns[i]);
                }
				continue;
			}
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200));
        }
        if (event.postback) {
            text = JSON.stringify(event.postback);
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token);
            continue;
        }
    }
    res.sendStatus(200);
})

// function to echo back messages
function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// function to echo back messages
function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}




// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})