const express = require('express')
const router = express.Router()

const User = require('../models/user')

router
  .route('/')
  .post((req, res) => {
    const user = new User({
      number: req.body.number,
      proxyNumber: req.body.proxyNumber,
      whitelist: [req.body.number],
      callHistory: [],
      ongoingSMS: []
    })
    user
      .save()
      .then(result => res.send(result))
      .catch(error => res.send(error))
  })
  .get((req, res) => {
    User.find()
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
    User.findOne({ proxyNumber: req.params.proxyNumber })
      .exec()
      .then(document => {
        res.send(document)
      })
      .catch(error => {
        res.send(error)
      })
  })
  .patch((req, res) => {
    User.findOneAndUpdate({ proxyNumber: req.params.proxyNumber }, req.body)
      .exec()
      .then(result => {
        res.send(result)
      })
      .catch(error => {
        res.send(error)
      })
  })
  .delete((req, res) => {
    User.findOneAndDelete({ proxyNumber: req.params.proxyNumber })
      .exec()
      .then(result => {
        res.send(result)
      })
      .catch(error => {
        res.send(error)
      })
  })

router
  .route('/:proxyNumber/whitelist')
  .post((req, res) => {
    User.findOne({ proxyNumber: req.params.proxyNumber }).then(user => {
      const whitelist = user.whitelist.concat(req.body.whitelist)
      User.findOneAndUpdate(
        { proxyNumber: req.params.proxyNumber },
        { whitelist }
      )
        .exec()
        .then(result => {
          res.send(result)
        })
        .catch(error => {
          res.send(error)
        })
    })
  })
  .delete((req, res) => {
    User.findOne({ proxyNumber: req.params.proxyNumber }).then(user => {
      const whitelist = user.whitelist.filter(
        number => !req.body.whitelist.includes(number)
      )
      User.findOneAndUpdate(
        { proxyNumber: req.params.proxyNumber },
        { whitelist }
      )
        .exec()
        .then(result => {
          res.send(result)
        })
        .catch(error => {
          res.send(error)
        })
    })
  })

router
  .route('/:proxyNumber/ongoingSMS')
  .post((req, res) => {
    User.findOne({ proxyNumber: req.params.proxyNumber }).then(user => {
      const ongoingSMS = user.ongoingSMS.concat(req.body.ongoingSMS)
      User.findOneAndUpdate(
        { proxyNumber: req.params.proxyNumber },
        { ongoingSMS }
      )
        .exec()
        .then(result => {
          res.send(result)
        })
        .catch(error => {
          res.send(error)
        })
    })
  })
  .delete((req, res) => {
    User.findOne({ proxyNumber: req.params.proxyNumber }).then(user => {
      const ongoingSMS = user.ongoingSMS.filter(
        sms => sms.callerNumber !== req.body.callerNumber
      )
      User.findOneAndUpdate(
        { proxyNumber: req.params.proxyNumber },
        { ongoingSMS }
      )
        .exec()
        .then(result => {
          res.send(result)
        })
        .catch(error => {
          res.send(error)
        })
    })
  })

module.exports = router
