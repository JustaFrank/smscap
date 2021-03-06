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

const automl = require('@google-cloud/automl')

const mlClient = new automl.v1beta1.PredictionServiceClient({
  projectId: 'ringed-magpie-220504',
  credentials: {
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
    client_email: 'lahacks2@ringed-magpie-220504.iam.gserviceaccount.com'
  }
})

// Parse incoming POST params with Express middleware
app.use(urlencoded({ extended: false }))

const dbConnect = require('./models/db.js')

dbConnect()

app.use(cors())

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))

const path = require('path')
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, './views/index.html'))
)

const phoneNumber = require('./routes/phoneNumber')
app.use('/number/', phoneNumber)

const user = require('./routes/user')
app.use('/user/', user)

app.get('/dashboard/:proxyNumber/account', (req, res) =>
  res.sendFile(path.join(__dirname, './views/account.html'))
)
app.get('/dashboard/:proxyNumber/whitelist', (req, res) =>
  res.sendFile(path.join(__dirname, './views/whitelist.html'))
)
app.get('/dashboard/:proxyNumber/blacklist', (req, res) =>
  res.sendFile(path.join(__dirname, './views/blacklist.html'))
)
app.get('/dashboard/:proxyNumber/history', (req, res) =>
  res.sendFile(path.join(__dirname, './views/history.html'))
)
app.get('/signup', (req, res) =>
  res.sendFile(path.join(__dirname, './views/signup.html'))
)

app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, './views/login.html'))
)

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
app.post('/call/authcode/:correctCode', async (req, res) => {
  // Use the Twilio Node.js SDK to build an XML response
  const twiml = new VoiceResponse()
  const proxyNum = req.body.To
  const targetUser = await getUserByProxyNumber(proxyNum)
  console.log(targetUser)
  // If the user entered digits, process their request
  signale.info(`Recieved auth code: ${req.body.Digits}`)

  if (req.body.Digits) {
    if (req.body.Digits.toString() === req.params.correctCode) {
      signale.success('Auth code corrrect - redirecting to caller')
      twiml.say('Code is correct. Redirecting you to caller...')
      twiml.dial(targetUser.number)
    } else {
      signale.warn('Auth code incorrect - asking again')
      twiml.say(`The code ${req.body.Digits} is wrong.`)
      twiml.say(
        'You have been blocked. If you would like to leave a message, please do so after the beep, and press star.'
      )
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
  console.time(`Full Request: ${callerNumber} => ${proxyNumber}: ${content}`)

  const sendingUserPromise = getUserByNumber(callerNumber)
  const ongoingSMSPromise = isOngoingSMS(proxyNumber, callerNumber, content)
  const userPromise = getUserByProxyNumber(proxyNumber)
  const isBlacklistedPromise = isBlacklisted(proxyNumber, callerNumber)
  const isWhitelistedPromise = isWhitelisted(proxyNumber, callerNumber)
  const isSpamPromise = isSpam(content)
  const capPromise = captcha.getCaptcha()

  if (await isBlacklistedPromise) {
    signale.note(`${callerNumber} has been blacklisted by ${proxyNumber}`)
    sendSMS(proxyNumber, callerNumber, `You've been blacklisted! ❌`)
  } else {
    const sendingUser = await sendingUserPromise
    const sender = sendingUser ? sendingUser.proxyNumber : proxyNumber
    const reply = `${sendingUser ? '' : callerNumber + ': '}${content}`
    signale.note(reply)

    if (await ongoingSMSPromise) {
      signale.note('Is an ongoing SMS')
      removeOngoingSMS(proxyNumber, callerNumber)
      addToWhitelist(proxyNumber, callerNumber)
      let ongoingSMS = await ongoingSMSPromise
      const userNumber = ongoingSMS.number
      sendSMS(sender, userNumber, ongoingSMS.message)
      sendSMS(proxyNumber, callerNumber, 'Your number has been whitelisted. 👌')
    } else if ((await ongoingSMSPromise) === false) {
      signale.note('Incorrect')
      sendSMS(proxyNumber, callerNumber, 'Incorrect! Resend your message. ❌')
      removeOngoingSMS(proxyNumber, callerNumber)
    } else {
      let r = await Promise.all([isWhitelistedPromise, isSpamPromise])
      if (!r[0] && r[1]) {
        signale.note('Detected message as spam.')
        const cap = await capPromise
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
        let user = await userPromise
        sendSMS(sender, user.number, reply)
      }
    }
  }
  console.timeEnd(`Full Request: ${callerNumber} => ${proxyNumber}: ${content}`)
  res.end()
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
  let user = await rp(options)
  console.log(user)
  const blacklist = user && user.blacklist.includes(number)
  console.log(blacklist)
  return blacklist
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
  }).then(res => {
    console.log(res)
  }).catch(err => {
    console.log(err)
  })
}

async function isSpam (text) {
  const formattedName = mlClient.modelPath(
    'ringed-magpie-220504',
    'us-central1',
    'TCN1208361503398118068'
  )
  const request = {
    name: formattedName,
    payload: {
      textSnippet: {
        content: text,
        mimeType: 'text/plain'
      }
    }
  }
  try {
    let response = (await mlClient.predict(request))[0]
    let score = response.payload.filter(x => x.displayName === 'spam')[0]
      .classification.score
    signale.info(`${text} got a spam detection score of ${score}`)
    return score > 0.5
  } catch (e) {
    console.log(e)
    return true
  }
}
function getCode () {
  return Math.round(Math.random() * 8999 + 1000)
}
// Create an HTTP server and listen for requests on port 3000
app.listen(port, async () => {
  signale.start(`App running at port ${port}`)
  // console.log(await isSpam('fsalkdjfkldsjfkldskf'))
})
