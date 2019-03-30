require('dotenv').config()


const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const signale = require('signale')
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const express = require('express');
const twilio = require('twilio');
const urlencoded = require('body-parser').urlencoded;
const app = express();
const session = require('express-session')


// Parse incoming POST params with Express middleware
app.use(urlencoded({ extended: false }));

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application


app.post('/call/incoming', (req, res) => {
    // Get information about the incoming call, like the city associated
    // with the phone number (if Twilio can discover it)

    const twiml = new VoiceResponse()
    const caller = req.body.Caller
    signale.info(`Incoming call from ${caller}`)
    let randNum = '1234'
    const gather = twiml.gather({
        numDigits: 4,
        action: `/call/authcode/${randNum}`,
    });
    gather.say(`Welcome to mobile captcha. Please enter the following code: ${randNum}`);
    // If the user doesn't enter input, loop
    twiml.redirect('/call/incoming');

    // Render the response as XML in reply to the webhook request
    res.type('text/xml');
    res.send(twiml.toString());
});


app.post('/call/authcode/:correctCode', (req, res) => {
    // Use the Twilio Node.js SDK to build an XML response
    const twiml = new VoiceResponse();

    // If the user entered digits, process their request
    signale.info(`Recieved auth code: ${req.body.Digits}`)

    if(req.body.Digits) {
    if (req.body.Digits == req.params.correctCode) {
        signale.success('Auth code corrrect - redirecting to caller')
        twiml.say('Code is correct. Redirecting you to caller...');
        twiml.dial('5106405189');
    } else {
        signale.warn('Auth code incorrect - asking again')
        twiml.say(`Sorry, the code ${req.body.Digits} is wrong :(`)
        twiml.redirect('/call/incoming');
    }
} else {
    twiml.redirect('/call/incoming');
}

// Render the response as XML in reply to the webhook request
res.type('text/xml');
res.send(twiml.toString());
});


app.post('/sms/incoming', (req, res) => {
    console.log(req.body)
    const number = req.body.From
    const content = req.body.Body
    const twiml = new MessagingResponse();
    console.log(number, content)
    console.log(req.cookies)

    if (isSpam(number, content)) {
        let authCode = getCode()
        twiml.message(`This message was detected as spam. Please reply with the following code: ${authCode}`);
        res.cookie({'authCode':authCode})
    }else{
        
    }
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());


})

function isSpam(number, content) {
    return true
}

function getCode(){
    return '1234'
}
// Create an HTTP server and listen for requests on port 3000
app.listen(3000, () => console.log('App running'));

