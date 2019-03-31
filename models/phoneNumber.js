const mongoose = require('mongoose')
const Schema = mongoose.Schema

const phoneNumberSchema = new Schema({
  number: String
})

const PhoneNumber = mongoose.model('PhoneNumber', phoneNumberSchema)

module.exports = PhoneNumber
