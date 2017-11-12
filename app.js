var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var app = express();
var contexid = "";
var Cloudant = require('cloudant');
 
var usernamedb = process.env.cloudant_username || '1f9656b7-5173-4606-89d2-e1f65033162f-bluemix';
var passworddb = process.env.cloudant_password || 'ebb7b2e28db4ada59d8c140b223b5ee2f90145b2bb49abe8720b5cf6e64d215f';
 
// Initialize the library with my account.
var cloudant = Cloudant({account:usernamedb, password:passworddb});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var conversation_id = "";
var w_conversation = watson.conversation({
    url: 'https://gateway.watsonplatform.net/conversation/api',
    username: process.env.CONVERSATION_USERNAME || '59333f9b-a64e-4448-a58f-2cf9b4b4648a',
    password: process.env.CONVERSATION_PASSWORD || 'k15NGKv4Jqdj',
    version: 'v1',
    version_date: '2016-07-11'
});
var workspace = process.env.WORKSPACE_ID || 'd8d214d0-d5ff-4c2e-b646-37fc8f57ce1d';

app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'EAACIoeAwV2EBAIBFBq0ZBcEdjnFGXRR7Uo1mW01ng4ZAxdSXM5CZBj4WerFFkLz4PtUzNZCzP6iqRii0fuomYFuZCVDZCCGDpN8cpVObbTVVuQN1bAZAImMwvVEj2fZAl8Un6VCKKyVT0KS3qHTsZAYqf6kbjYZAWvwrVZCFd1W3XpxWgZDZD') 
    {
        res.send(req.query['hub.challenge']);
    }
    res.send('Erro de validaçion no token.');
});

app.post('/webhook/', function (req, res) {
	var text = null;
	
    messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {	
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;
        
 if(sender)

        if (event.message && event.message.text) {
			text = event.message.text;
		}else if (event.postback && !text) {
			text = event.postback.payload;
		}else{
			break;
		}
		
		var params = {
			input: text,
			// context: {"conversation_id": conversation_id}
			context:contexid
		}

		var payload = {
			workspace_id: "d8d214d0-d5ff-4c2e-b646-37fc8f57ce1d"
		};

		if (params) {
			if (params.input) {
				params.input = params.input.replace("\n","");
				payload.input = { "text": params.input };
			}
			if (params.context) {
				payload.context = params.context;
			}
		}
		callWatson(payload, sender);
    }
    res.sendStatus(200);
});

function callWatson(payload, sender) {
	w_conversation.message(payload, function (err, convResults) {
		 console.log(convResults);
		contexid = convResults.context;
		
        if (err) {
            return responseToRequest.send("Erro.");
        }
		
		if(convResults.context != null)
    	   conversation_id = convResults.context.conversation_id;
        if(convResults != null && convResults.output != null){
			var i = 0;
			while(i < convResults.output.text.length){
				sendMessage(sender, convResults.output.text[i++]);
			}
		}
            
    });
}

function sendMessage(sender, text_) {
	text_ = text_.substring(0, 319);
	messageData = {	text: text_ };

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

var token = "EAACIoeAwV2EBAIBFBq0ZBcEdjnFGXRR7Uo1mW01ng4ZAxdSXM5CZBj4WerFFkLz4PtUzNZCzP6iqRii0fuomYFuZCVDZCCGDpN8cpVObbTVVuQN1bAZAImMwvVEj2fZAl8Un6VCKKyVT0KS3qHTsZAYqf6kbjYZAWvwrVZCFd1W3XpxWgZDZD";
var host = (process.env.VCAP_APP_HOST || 'localhost');
var port = (process.env.VCAP_APP_PORT || 3000);
app.listen(port, host);	