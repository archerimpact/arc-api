'use strict'

const OFAC = require('./ofac/sanctionsexplorer-parser')
const converter = require('./convert_json')
const elasticHelper = require('./elastic-connectors/elastic.js')

process.on('unhandledRejection', err => {
    console.log("Caught unhandledRejection:")
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

loadOFAC()

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
const app = express()

app.use(bodyParser.urlencoded({extended: true, limit: '100mb', parameterLimit: 50000}))
app.use(bodyParser.json({limit: '100mb'}))

app.listen(8080, '127.0.0.1', () => {
    console.log('Server has started')
})

app.get('/', (req, res) => {
    return res.status(200).json({ success: true, message: 'Server is running!' })
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

app.get('/search', async function(req, res) {
    const queryStr = req.query.q
    console.log(queryStr)

    const fullQuery = {
        index: "entities",
        body: {
            multi_match: {
                query: queryStr,
                fields: ["name"],
            }
        }
    };

    const data = await elasticHelper.search_ES(fullQuery)
    console.log(data)

    return res.status(200).json(data)
})
