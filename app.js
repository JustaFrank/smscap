/* eslint-disable no-unused-vars */
const port = process.env.PORT || 6969

require('dotenv').config()

const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSid, authToken)
const signale = require('signale')
const VoiceResponse = require('twilio').twiml.VoiceResponse
const MessagingResponse = require('twilio').twiml.MessagingResponse
const rp = require('request-promise')

const express = require('express')
const cors = require('cors')
const twilio = require('twilio')
const urlencoded = require('body-parser').urlencoded
const app = express()
const session = require('express-session')
const captcha = require('./cap.js')
// Parse incoming POST params with Express middleware
app.use(urlencoded({ extended: false }))

const dbConnect = require('./models/db.js')

dbConnect()

app.use(cors())

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const user = require('./routes/user')

app.get('/', (req, res) => res.send('Teleguard: built at LA Hacks 2019'))

app.use('/user/', user)

// Create a route that will handle Twilio webhook requests, sent as an
// HTTP POST to /voice in our application

app.post('/call/incoming', (req, res) => {
  // Get information about the incoming call, like the city associated
  // with the phone number (if Twilio can discover it)

  const twiml = new VoiceResponse()
  // twiml.say('This call is being recorded for quality control measures')

  const caller = req.body.Caller
  signale.info(`Incoming call from ${caller}`)
  let randNum = getCode()

  const gather = twiml.gather({
    numDigits: 4,
    action: `/call/authcode/${randNum}`
  })

  gather.say(
    `This caller is being guarded by Tele-Guard. Please enter the following code: ${randNum}`
  )

  // twiml.hangup()
  // If the user doesn't enter input, loop
  // twiml.redirect('/call/incoming')

  // Render the response as XML in reply to the webhook request
  res.type('text/xml')
  res.send(twiml.toString())
})

app.post('/transcription', (req, res) => {
  const text = req.body.TranscriptionText
  const from = req.body.From
  const recording = req.body.RecordingUrl
  const to = req.body.To

  console.log({ from, to, text, recording })
  const twiml = new VoiceResponse()
  twiml.say('Thanks for your message.')
  twiml.hangup()
  res.type('text/xml')
  res.send(twiml.toString())
})
app.post('/call/authcode/:correctCode', (req, res) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()

  // If the user entered digits, process their request
  signale.info(`Recieved auth code: ${req.body.Digits}`)

  if (req.body.Digits) {
    if (req.body.Digits.toString() === req.params.correctCode) {
      signale.success('Auth code corrrect - redirecting to caller')
      twiml.say('Code is correct. Redirecting you to caller...')
      twiml.dial('5106405189')
    } else {
      signale.warn('Auth code incorrect - asking again')
      twiml.say(`The code ${req.body.Digits} is wrong.`)
      twiml.say('You have been blocked. If you would like to leave a message, please do so after the beep, and press star.')
      twiml.record({
        action: '/recordings',
        transcribe: true,
        transcribeCallback: '/transcriptions',
        finishOnKey: '*'
      })
      twiml.hangup()
    }
  } else {
    twiml.hangup()
  }

  // Render the response as XML in reply to the webhook request
  res.type('text/xml')
  res.send(twiml.toString())
  console.log(twiml.toString())
})

app.post('/recordings', (req, res) => {
  const twiml = new VoiceResponse()
  twiml.say('Thanks for your message')
  res.type('text/xml')
  res.send(twiml.toString())
})

app.post('/sms/incoming', async (req, res) => {
  const callerNumber = req.body.From
  const proxyNumber = req.body.To
  const content = req.body.Body

  const sendingUser = await getUserByNumber(callerNumber)
  const sender = sendingUser ? sendingUser.proxyNumber : proxyNumber
  const visibleNumber = sendingUser ? sendingUser.proxyNumber : callerNumber

  const reply = `${sendingUser ? '' : callerNumber + ': '}${content}`
  signale.note(reply)

  const ongoingSMS = await isOngoingSMS(proxyNumber, callerNumber, content)

  if (isBlacklisted(proxyNumber, callerNumber)) {
    signale.note(`${callerNumber} has been blacklisted by ${proxyNumber}`)
    sendSMS(proxyNumber, callerNumber, `You've been blacklisted! ❌`)
  } else if (ongoingSMS) {
    signale.note('Is an ongoing SMS')
    removeOngoingSMS(proxyNumber, callerNumber)
    addToWhitelist(proxyNumber, callerNumber)
    const userNumber = ongoingSMS.number
    sendSMS(sender, userNumber, ongoingSMS.message)
    sendSMS(proxyNumber, callerNumber, 'Your number has been whitelisted. 👌')
  } else if (ongoingSMS === false) {
    signale.note('Incorrect')
    sendSMS(proxyNumber, callerNumber, 'Incorrect! Resend your message. ❌')
    removeOngoingSMS(proxyNumber, callerNumber)
  } else {
    if (!(await isWhitelisted(proxyNumber, callerNumber))) {
      signale.note('Detected message as spam.')
      const cap = await captcha.getCaptcha()
      console.log(cap)
      sendSMS(
        proxyNumber,
        callerNumber,
        `This message was detected as spam. 🤨 Please answer the following question: ${
          cap.q
        }`
      )
      addOngoingSMS(proxyNumber, callerNumber, cap, reply)
    } else {
      signale.note('Message detected as not spam.')
      const user = await getUserByProxyNumber(proxyNumber)
      sendSMS(sender, user.number, reply)
    }
  }
})

async function getUserByProxyNumber (proxyNumber) {
  const options = {
    method: 'GET',
    url: `http://localhost:${port}/user/${proxyNumber}`,
    json: true
  }
  return rp(options)
}

async function getUserByNumber (number) {
  const options = {
    method: 'GET',
    url: `http://localhost:${port}/user`,
    json: true
  }
  return rp(options).then(users => {
    return users.filter(user => user.number === number)[0]
  })
}

async function isWhitelisted (proxyNumber, number) {
  const options = {
    method: 'GET',
    url: `http://localhost:${port}/user/${proxyNumber}`,
    json: true
  }
  return rp(options).then(user => {
    return user && user.whitelist.includes(number)
  })
}

async function isBlacklisted (proxyNumber, number) {
  const options = {
    method: 'GET',
    url: `http://localhost:${port}/user/${proxyNumber}`,
    json: true
  }
  return rp(options).then(user => {
    return user && user.blacklist.includes(number)
  })
}

async function isOngoingSMS (proxyNumber, callerNumber, content) {
  const options = {
    method: 'get',
    url: `http://localhost:${port}/user/${proxyNumber}`,
    json: true
  }
  return rp(options).then(user => {
    if (user) {
      const ongoingSMS = user.ongoingSMS.filter(
        sms => sms.callerNumber === callerNumber
      )[0]
      if (ongoingSMS) {
        console.log(ongoingSMS)
        if (captcha.validateAnswer(content, ongoingSMS.answers)) {
          return { number: user.number, message: ongoingSMS.message }
        } else {
          return false
        }
      }
    }
    return undefined
  })
}

async function addOngoingSMS (proxyNumber, callerNumber, cap, message) {
  const options = {
    method: 'post',
    url: `http://localhost:${port}/user/${proxyNumber}/ongoingSMS`,
    body: {
      ongoingSMS: { callerNumber, question: cap.q, answers: cap.a, message }
    },
    json: true
  }
  rp(options)
}

async function removeOngoingSMS (proxyNumber, callerNumber) {
  const options = {
    method: 'delete',
    url: `http://localhost:${port}/user/${proxyNumber}/ongoingSMS`,
    body: { callerNumber },
    json: true
  }
  rp(options)
}

async function addToWhitelist (proxyNumber, number) {
  const options = {
    method: 'post',
    url: `http://localhost:${port}/user/${proxyNumber}/whitelist`,
    body: { whitelist: [number] },
    json: true
  }
  rp(options)
}

async function removeFromWhitelist (proxyNumber, number) {
  const options = {
    method: 'delete',
    url: `http://localhost:${port}/user/${proxyNumber}/whitelist`,
    body: { whitelist: [number] },
    json: true
  }
  rp(options)
}

function sendSMS (from, to, body) {
  signale.info(`Sending from ${from} to ${to}: ${body}`)
  client.messages.create({
    from,
    to,
    body
  })
}

function getCode () {
  return Math.round(Math.random() * 8999 + 1000)
}
// Create an HTTP server and listen for requests on port 3000
app.listen(port, () => signale.start(`App running at port ${port}`))
