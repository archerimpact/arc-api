'use strict'

const OFAC = require('./ofac/sanctionsexplorer-parser')
const converter = require('./convert_json')

async function load_ofac() {
    let entries = OFAC.getOFAC()
    console.log('entries are done')
    converter.fromJSON(entries)
}

const TEST_ENTITY_ID = 'bc0076c4-59cd-4da1-ae77-2b8b9ecadde0'
async function main() {
    // const r = await qc.get_linked_entities(TEST_ENTITY_ID)
    // console.log(JSON.stringify(r, null, 2))

    // const e = await converter.toJSON(TEST_ENTITY_ID)
    // console.log(JSON.stringify(e, null, 2))

    // await seed()
    // await load_ofac()
}

main()



// Express webserver.  Should be reorganized later.
/*
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.urlencoded({extended: true, limit: '100mb', parameterLimit: 50000}))
app.use(bodyParser.json({limit: '100mb'}))

app.listen(8080, '127.0.0.1', () => {
    console.log('Server has started')
})

app.get('/', (req, res) => {
    return res.status(200).json({ success: true, message: 'Server is running!' })       // this is how you send a response to the client
})

// e.g. curl -XGET "localhost:8080/data/entity?id=5"
app.get('/data/entity', async function(req, res) {
    const id = req.query.id     // the id field of the GET request (i.e. the param in the URL)
    return res.status(200).json(id)
})

// e.g. curl -XPOST "localhost:8080/data/userSubmit" -H "Content-Type: application/json" -d '{"someKey":"abc","password":"abc"}'
app.post('/data/userSubmit', async function(req, res) {
    const data = req.body.someKey      // the `someKey` field of the user's POST request
    return res.status(200).json(data)
})
*/
