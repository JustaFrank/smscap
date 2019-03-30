require('dotenv').config()
const mongo_uri = process.env.MONGO
const mongoose = require('mongoose')
const db = mongoose.connection
const signale = require('signale')

const connect = () => {
  mongoose.connect(mongo_uri, { useNewUrlParser: true })

  db.on('connected', function() {
    signale.success('Mongoose default connection open to ' + mongo_uri)
  })

  db.on('error', function(err) {
    signale.error('Mongoose default connection error: ' + err)
  })

  db.on('disconnected', function() {
    signale.error('Mongoose default connection disconnected')
  })

  process.on('SIGINT', function() {
    mongoose.connection.close(function() {
      signale.error(
        'Mongoose default connection disconnected through app termination'
      )
      process.exit(0)
    })
  })
}

module.exports = connect
