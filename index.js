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

var request = require('request');

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
    
    var text = "zeig mir schwarze schuhe von adidas";
    //console.log(convertTextToSearchQuery(cleanupSearchQuery("suche nach einer gelben hose")))
    //var commandJson = csvToJSON(fileReader.result);
    //JSON.stringify(commandJson)
    //console.log(JSON.stringify(commandJson));
    //var query = convertTextToSearchQuery(cleanupSearchQuery(text));
    res.send("Test");
    existSimilarProducts("723499");
    //res.redirect('your/404/path.html');
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
                doSearch(sender, text);
				continue;
			} else if(text === 'generic') {
                message.sendGeneric(sender);
                continue;
            } else if(text.includes("du bist krass")) {
                message.sendText(sender, "Danke ich weiß (Y)!");
            } else if(text.includes("orakel") || text.includes("frage")) {
                var tempNumber = Math.floor((Math.random() * 100) + 1);
                if(text.includes("erik")) {
                    message.sendText(sender, "Ich darf Fragen über Götter nicht beantworten! 😯🙊")
                } else if(tempNumber < 40) {
                    message.sendText(sender, "Die Antwort ist definitiv: NEIN! >:o"); 
                } else if(tempNumber >= 40 && tempNumber <= 60 ) {
                   message.sendText(sender, "Keine Ahnung... Frag nochmal! :-/"); 
                } else {
                    message.sendText(sender, "JA! Auf jeden Fall! (Y)")
                }
            } else {
                 userGreeting(sender);
            }
        }
        if (event.postback) {
            payload = event.postback.payload;
            if(payload.includes("similar_products")) {
                message.sendText(sender, "Ähnlichkeitssuche wurde angestoßen");
                doSimilarSearch(sender, payload.substring(payload.indexOf(":") + 1));       
                continue;
            }
        }
    }
    res.sendStatus(200);
})


function includesCommand(text, commandJson) {
    for (var i = 0; i < commandJson.length; i++) {
        if(text.includes(commandJson[i].command)) {
            return true;
        }
    }
    return false;
}

function getCommandFile(text, commandJson) {
    for (var i = 0; i < commandJson.length; i++) {
        if(text.includes(commandJson[i].command)) {
            return commandJson[i].fileName;
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

function doSearch(sender, text) {
    var query = encodeURI(convertTextToSearchQuery(cleanupSearchQuery(text)));
    var url = config.searchUrl + query;

    request({ 
        url: url, 
        followRedirect: false,
        json: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if(body != null && body.searchresult != null && body.searchresult.result != null) {
                var productArr = [];
                var products = body.searchresult.result.styles;
                for(var i = 0; i < products.length; i++) {
                    product = {};
                    product.title = products[i].name;
                    product.id = products[i].masterSku;
                    if(products[i].similarId != null) {
                        product.similarId = products[i].similarId;
                    }
                    if(products[i].images != null) {
                      product.image_url = config.imageUrl + products[i].images[0];  
                    }
                    product.subtitle = products[i].description;
                    if(products[i].oldPrice != null) {
                        product.oldPrice = products[i].oldPrice.value; 
                    }
                    product.price = products[i].price.value;
                    productArr.push(product);
                }

                if(productArr.length < 1) {
                    message.sendText(sender, "Leider konnte ich keine Produkte für dich finden :'( aber ich bin mir sicher hier wirst du fündig -> www.baur.de/s" + query + " 😊 ");
                } else {
                    message.sendProductSlider(sender, productArr);
                }
            }
        }
    });
}

function doSimilarSearch (sender, similiarProductId) {
    var url = config.similarSearchUrl + similiarProductId;

    request({ 
        url: url, 
        followRedirect: false,
        json: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.116 Safari/537.36'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if(body != null && body.productROs != null) {
                var productArr = [];
                var products = body.productROs;
                for(var i = 0; i < products.length; i++) {
                    product = {};
                    product.title = products[i].productName;
                    product.id = products[i].masterSku;
                    orderNumber = products[i].orderNumberWithPromotion;
                    if(products[i].similarId != null) {
                        product.similarId = products[i].similarId;
                    } else {
                        product.similarId = orderNumber.substring(0, orderNumber.length - 2);
                    }
                    if(products[i].image != null) {
                      product.image_url = config.imageUrl + products[i].image;  
                    }
                    product.subtitle = products[i].description;
                    if(products[i].oldPrice != null) {
                        product.oldPrice = products[i].oldPrice; 
                    }
                    product.price = products[i].price;
                    productArr.push(product);
                }

                if(productArr.length < 1) {
                    message.sendText(sender, "Leider konnte ich keine Produkte für dich finden :'( aber ich bin mir sicher hier wirst du fündig -> www.baur.de/s" + query + " 😊 ");
                } else {
                    message.sendProductSlider(sender, productArr);
                }
            }
        }
    });
}


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
            if(wordArray[i].includes(parsedWords.nouns[k]) && parsedWords.nouns[k].trim().length > 1) {
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
    if(adjectives.length < 1) {
        return nouns;
    }
    return adjectives + " " + nouns;
}


function cleanupSearchQuery(text) {
    var wordArray = text.replace(/\W+/g, " ").split(" ");
    var newText = "";
    for (var i = 0; i < wordArray.length; i++) {
        var remove = false;
        for (var j = 0; j < parsedWords.unusedWords.length; j++) {
            if(wordArray[i] == parsedWords.unusedWords[j]) {
                remove = true;
                continue;
            }
        }
        if(!remove) {
            if(newText.length < 1) {
                newText = wordArray[i];
            } else {
               newText = newText + " " + wordArray[i]; 
            }
        }
    }
    return newText;
}

function userGreeting(sender) {
    var url = "https://graph.facebook.com/v2.6/"+sender+"?access_token="+ config.token;
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
             message.sendText(sender, "Hey " + body.first_name +", wie kann ich dir weiterhelfen? :)");
             message.sendText(sender, "Du kannst zum Beispiel sagen \"Zeig mir aktuelle Highlights\" oder \"Ich suche schwarze Schuhe von Adidas\" dann versuch ich dir zu helfen. :)");
        } 
    })
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
    return result; 
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'));
})