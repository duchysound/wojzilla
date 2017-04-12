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
    res.send('Hello world, I am a chat bot ' + fileReader.result );
    var text = "zeig mir schwarze schuhe von adidas";
    doNewSearch(0, text);
    //console.log(convertTextToSearchQuery(cleanupSearchQuery("suche nach einer gelben hose")))
    //var commandJson = csvToJSON(fileReader.result);
    //JSON.stringify(commandJson)
    //console.log(JSON.stringify(commandJson));
    //var query = convertTextToSearchQuery(cleanupSearchQuery(text));
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
                doNewSearch(sender, text);
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

function doSearch(sender, text) {
    var query = encodeURI(convertTextToSearchQuery(cleanupSearchQuery(text)));
    var url = config.magellanUrl + query;
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if(body != null && body.suggestresult != null && body.suggestresult.result != null) {
                var productArr = [];
                for(var i = 0; i < body.suggestresult.result.length; i++) {
                    var suggestCategoryResult = body.suggestresult.result[i].suggestCategoryResult;
                    for(var j = 0; j < suggestCategoryResult.suggests.length; j++) {
                        var suggest = suggestCategoryResult.suggests[j];
                        if(suggest.url != null && suggest.image != null && suggest.value != null) {
                            product = {};
                            product.title = suggest.value;
                            product.url = productUrl + suggest.url;
                            if(styles[i].images != null) {
                              product.image_url = config.imageUrl + styles[i].images[0];  
                            }
                            product.price = suggest.price.replace("&euro;", "€");
                            product.subtitle = product.title + " | " + product.price;
                            productArr.push(product);
                        }
                    }
                }
            }
            if(productArr.length < 1) {
                message.sendText(sender, "Leider konnte ich keine Produkte für dich finden :'( aber ich bin mir sicher hier wirst du fündig -> www.baur.de/s" + query + " 😊 ");
            } else {
                message.sendProductSlider(sender, productArr);
            }
        }
        message.sendText(sender, "Such url: " + url);
       
    })

}

function doNewSearch(sender, text) {
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
            console.log("searchresult: " + body.searchresult);
            if(body != null && body.searchresult != null && body.searchresult.result != null) {
                var productArr = [];
                var styles = body.searchresult.result.styles;
                for(var i = 0; i < styles.length; i++) {
                    product = {};
                    product.title = styles[i].name;
                    product.url = productUrl + styles[i].masterSku;
                    if(styles[i].images != null) {
                      product.image_url = styles[i].images[0];  
                    }
                    product.subtitle = styles[i].description;
                    if(styles[i].oldPrice != null) {
                        product.oldPrice = styles[i].oldPrice.value; 
                    }
                    product.price = styles[i].price.value;
                    productArr.push(product);
                }

                if(productArr.length < 1) {
                    message.sendText(sender, "Leider konnte ich keine Produkte für dich finden :'( aber ich bin mir sicher hier wirst du fündig -> www.baur.de/s" + query + " 😊 ");
                } else {t
                    message.sendProductSlider(sender, productArr);
                }
                
                console.log(JSON.stringify(productArr));
            }
        }
    });
}


function getCommandFile(text, commandJson) {
    for (var i = 0; i < commandJson.length; i++) {
        if(text.includes(commandJson[i].command)) {
            return commandJson[i].fileName;
        }
    }
    return false;
}

function userGreeting(sender) {
    var url = "https://graph.facebook.com/v2.6/"+sender+"?access_token="+ config.token;
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        //console.log(response);
        console.log(body);
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