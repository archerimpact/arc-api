'use strict'

process.on('unhandledRejection', err => {
    console.log("Caught unhandledRejection: ")
    console.log(err)
})

const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const app = express()

app.use(bodyParser.urlencoded({extended: true, limit: '100mb', parameterLimit: 50000}))
app.use(bodyParser.json({limit: '100mb'}))

const credentials = require('./server/credentials')
const mongoose = require('./integrations/mongo/connect.js')(credentials.mongoPassword)

const { success, error, authError } = require('./server/util')

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Content-Type, Accept, Origin, Referer, Accept, User-Agent')
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true)
    // Pass to next layer of middleware
    next();
});

const sessionOptions = {
    resave: false,              // don't save session if unmodified
    saveUninitialized: false,   // don't create session until something stored
    secret: credentials.sessionSecret,
    proxy: false,
    name: 'sessionId',
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 10080000,       // 1000*60*60*24*7 // Note persistent vs session cookies
        expires: new Date(new Date().getTime() + (1000*60*60*24*7)) // 7 days
    },
}
app.use(session(sessionOptions))

app.listen(8080, '127.0.0.1', () => {
    console.log('Server has started')
})



app.use('/auth', require('./server/user/index')(app))
app.use('/data', require('./server/graph_data/index')(app))

app.get('/', (req, res) => {
    return success('Server is running!', res)
})

app.get('*', (req, res) => {
    return res.status(404)
})