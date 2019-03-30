const rp = require('request-promise')
const md5 = require('md5')
const signale = require('signale')
// const readline = require('readline').createInterface({
//   input: process.stdin,
//   output: process.stdout
// })

module.exports = {}

module.exports.getCaptcha = async () => {
  let cap = await rp({
    uri: 'http://api.textcaptcha.com/mirror.json',
    json: true
  })
  signale.log(`Retrieved captcha: ${cap.q}`)
  return cap
}

module.exports.validateAnswer = (answer, correctAnswers) => {
  console.log('User answered: ' + md5(answer.toLowerCase()))
  signale.log(`Answer: ${answer} is ${correctAnswers.includes(md5(answer.toLowerCase())) ? 'correct!' : 'incorrect!'}`)
  return correctAnswers.includes(md5(answer.toLowerCase()))
}

// async function main () {
//   let cap = await module.exports.getCaptcha()

//   readline.question(cap.q, (answer) => {
//     console.log(module.exports.validateAnswer(cap, answer))
//     readline.close()
//   })
// }

// main()
