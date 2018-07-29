'use strict'

const OFAC = require('./ofac/sanctionsexplorer-parser')
const converter = require('./convert_json')

process.on('unhandledRejection', err => {
    console.log("Caught unhandledRejection: ")
    console.log(err)
})

async function loadOFAC() {
    console.log('Loading OFAC...')
    const entries = OFAC.getOFAC()
    converter.loadEntitiesFromData(entries)
}

async function main() {
    // const data = await converter.getEntityByName('KONY, Joseph')
    // console.log(JSON.stringify(data, null, 2))
}

// loadOFAC()

/**
 * Temporary method for mirroring the current ArchAPI response format.
 */
function zipForFrontend(data) {

    function mapKey(key) {
        const mapping = {
            has_alias: 'Aliases',
        }

        return mapping[key] || key
    }

    data.nodes = data.nodes.map(node => {
        const newNode = {
            id: node.id,
            name: node.label,
            type: node.type,
            dataset: 'OFAC SDN List',
            totalLinks: node.util[0].totalLinks,
        }

        node.attributes.forEach(attr => {
            const mappedKey = mapKey(attr.key)
            if (newNode[mappedKey]) {
                newNode[mappedKey].push(attr.value)
            }
            else {
                newNode[mappedKey] = [attr.value]
            }
        })

        return newNode
    })

    data.links = data.links.map(link => {
        return {
            id: link.claimID,
            type: link.relationshipType.replace('http://ont/', ''),
            source: link.sourceID,
            target: link.targetID,
        }
    })

    return data
}









// Express webserver.  Should be reorganized later.
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const app = express()

app.use(bodyParser.urlencoded({extended: true, limit: '100mb', parameterLimit: 50000}))
app.use(bodyParser.json({limit: '100mb'}))

const credentials = require('./server/credentials')
const mongoose = require('mongoose')
const mongoURL = 'mongodb://arch2:' + credentials.mongoPassword + '@ds263639.mlab.com:63639/architect'
mongoose.connect(mongoURL)

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



app.get('/data/entity', async function(req, res) {
    const id = req.query.id
    const name = req.query.name

    console.log(id)
    
    let data
    if (id) {
        data = await converter.getEntityByID(id)
    }
    else if (name) {
        data = await converter.getEntityByName(name)
    }

    data = zipForFrontend(data)
    // return res.status(200).json({ success: true, message: data })
    return res.status(200).json(data)
})


app.use('/auth', require('./server/user/index')(app))


/* ================ Data ================ */




/* ================ General ================ */
app.get('/', (req, res) => {
    return success('Server is running!', res)
})

app.get('*', (req, res) => {
    return res.status(404)
})