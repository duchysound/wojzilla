module.exports = {
    sendText: function(sender, text) {
        messageData = {
            text:text
        }
        sendObj(sender, messageData);
    },

    //function to send button
    sendButton: function(sender, type, url, title) {
        messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "buttons":[{
                        "type":type,
                        "url":url,
                        "title":title
                      }
                    ]
                }
            }
        }
        sendObj(sender, messageData);
    },

    // function to echo back messages
    sendGeneric: function(sender) {
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
        sendObj(sender, messageData);
    },

    sendJson: function(sender, jsonName) {
        var json = require("./" + jsonName);
        sendObj(sender, json);
    },

    sendProductSlider: function(sender, productArr) {
        messageData = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": []
                }
            }
        }

        for(var i = 0; i < productArr.length; i++) {
            messageData.attachment.payload.elements[i].title = productArr[i].value;
            messageData.attachment.payload.elements[i].image_url = config.imageUrl + productArr[i].image;
            if(productArr[i].price != null) {
                 messageData.attachment.payload.elements[i].subtitle = productArr[i].value + " | " + productArr[i].price.replace("&euro;", "€");
            }
            messageData.attachment.payload.elements[i].buttons[0].type = "web_url";
            messageData.attachment.payload.elements[i].buttons[0].url = config.productUrl + productArr[i].url;
            messageData.attachment.payload.elements[i].buttons[0].title = "Zum Produkt";
        }

        sendObj(sender, messageData);
    }
}

var request = require('request');
var config = require("./config.json");

function sendObj(sender, messageData) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:config.token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    })
    // for local testing - if sender == 0, print messageData to console
    if(sender === 0) {
        console.log(messageData);
    }
}