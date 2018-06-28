'use strict'

const OFAC = require('./ofac/sanctionsexplorer-parser')
const converter = require('./convert_json')

async function seed() {
    let joseph = await create_entity('2', 'HEINTZ, Tyler')
    let ali = await create_entity('3', 'PATEL, Nikhil')

    console.log(joseph)

    const c = 'claim2'
    let connect = await connect_entities('2', '3', c)
    let r = await add_claim_relation(c, 'IS_COWORKER_OF')
    let kv = await add_claim_key_and_value(c, 'START_DATE', '01/01/16')
    let src = await add_claim_source(c, 'ARCHERLEAKS:90')

    // let sa = await select_all()
    let out = await find_all_outgoing_relations('2')
    console.log(out)
}

async function load_ofac() {
    let entries = OFAC.getOFAC()
    entries = entries.slice(0, 10)
    console.log('entries are done')
    entries.map(e => converter.convert(e))
    console.log('loaded all ' + entries.length)
}

async function main() {
    // await seed()
    await load_ofac()
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
