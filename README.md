# Wojzilla


Wojzilla ist ein Test-ChatBot für den Facebook-Messenger welcher zeigt, was für Firmen im eCommerce mögliche Optionen zur Verwendung von ChatBots sind.
Dazu gehören unter anderem folgende:
  - Suchergebnisse
  - Anzeigen von Highlights
  - Verfolgung des Lieferstatus
  - Kontakt mit dem Kundenservice aufnehmen

### Technische-Doku
#### index.js
Die Klasse "index.js" ist unsere Hauptklasse und hat eine Webhook implementiert, welche auf die Messenger-App horcht. Schickt der Messenger einen "post"-Request an unsere App/webhook mit dem entsprechenden Authentifizierungs-Token, wird der request geparsed und je nachdem passiert dann die entsprechende Business-Logik.

Momentan werden in der index.js folgende Methoden verwendet:
* includesCommand(text, commandJson) - prüft ob der Text ggf. ein Kommando beinhaltet was in der commands.csv gepflegt wurde
* getCommandFile(text, commandJson) - übergibt den Dateinamen des Kommando´s welcher in der commands.csv gepflegt wurde (wird bei message.js sendJson verwendet)
* includesSearchIdentifier(text) - in der words.json sind verschiedene Wörter hinterlegt welche sich um Such-Identifier handeln, hier wird geprüft ob unser Text eins dieser Wörter beinhaltet, falls ja wird eine Suche angestoßen
* doSearch(sender, text) - schickt eine Suche an die entsprechende Such-Schnittstelle, ruft zum bearbeiten des Queries folgende Methoden auf und bildet anschließend ein ProduktArray
    * convertTextToSearchQuery(text) - wandelt den übergebenen Text in ein validen Search-Query um.
    * cleanupSearchQuery - Hier werden unnötige Wörter (welche ebenfalls in der words.json gepflegt sind) heraus gefiltert etc.
* doSimilarSearch(sender, similarId) - schickt eine ProduktID an die Ähnlichkeitssuch-Schnittstelle und bildet anschließend wie in der doSearch ein ProduktArray
* userGreeting(sender) - schickt eine persönliche Begrüßungsnachricht an den entsprechenden Benutzer, fragt dazu die Facebook-API ab wie der Benutzer heißt
* csvToJSON(csv) - wandelt eine CSV-Datei in ein JSON um (bspw. commands.csv mit welcher in den Methoden includesCommand und getCommandFile bspw. gearbeitet wird)
 
#### message.js
Es gibt die Klasse "message.js" diese Bildet die verschiedenen Arten von Nachrichten ab, welche unser Chatbot schreiben kann.
message.js bietet folgende Methoden:
* sendText(sender, text) - schickt den übergebenen Text an den entsprechenden Sender
* sendButton(sender, type, url, title) - sendet einen Button mit ensprechenden Typ bspw. web_link, der Url des Ziels und der entsprechenden Benamung an den Sender
* sendGeneric(sender) - Test Methode welche verschiedene Objekte anzeigt.
* sendJson(sender, jsonName) - sendet ein entsprechendes Json (falls es den messageData-Standards von  FB entspricht) an den Benutzer
* sendProductSlider(sender, productArr) - iteriert über das übergebene ProduktArray und liefert einen ProduktSlider als ergebnis zurück


#### Facebook-API / Doku

See [Facebook-API](https://developers.facebook.com/products/messenger/)