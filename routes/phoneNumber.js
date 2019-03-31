const express = require('express')
const router = express.Router()

const PhoneNumber = require('../models/phoneNumber')

router
  .route('/')
  .post((req, res) => {
    const number = new PhoneNumber({
      number: req.body.number
    })
    number
      .save()
      .then(result => res.send(result))
      .catch(error => res.send(error))
  })
  .get((req, res) => {
    PhoneNumber.find()
      .exec()
      .then(document => {
        res.send(document)
      })
      .catch(error => {
        res.send(error)
      })
  })

router
  .route('/:proxyNumber')
  .get((req, res) => {
    PhoneNumber.findOne({ number: req.params.number })
      .exec()
      .then(document => {
        res.send(document)
      })
      .catch(error => {
        res.send(error)
      })
  })
  .patch((req, res) => {
    PhoneNumber.findOneAndUpdate({ number: req.params.number }, req.body)
      .exec()
      .then(result => {
        res.send(result)
      })
      .catch(error => {
        res.send(error)
      })
  })
  .delete((req, res) => {
    PhoneNumber.findOneAndDelete({ number: req.params.number })
      .exec()
      .then(result => {
        res.send(result)
      })
      .catch(error => {
        res.send(error)
      })
  })

module.exports = router
