'use strict'

const express = require('express')
const router = express.Router()

const { success, error } = require('../util')
const converter = require('./convert_json')
const { verifyAuth } = require('../user/verifyAuth')
const elasticHelper = require('../../integrations/elasticsearch/elastic')

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


module.exports = function(app) {
    router.get('/entity', async function (req, res) {
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
        return success(data, res)
    })

    router.post('/entity', async function (req, res) {
        const ok = await converter.loadEntitiesFromData(req.body)
        if (ok) {
            return success('Uploaded successfully', res)
        }
        else {
            return error('An error occcured', res)
        }
    })

    // router.get('/search', async function(req, res) {
    //     //Endpoint to wrap elasticsearch queries: /data/search?q=<queryStr>
    //
    //     const queryStr = req.query.q
    //     console.log(queryStr)
    //
    //     const fullQuery = {
    //         index: "entities",
    //         body: {
    //             query: {
    //                 match: {
    //                     label: queryStr
    //                 }
    //             }
    //         }
    //     }
    //
    //     const data = await elasticHelper.search_ES(fullQuery)
    //     console.log(data)
    //
    //     return res.status(200).json(data)
    // })

    router.get('/search-graph', async function(req, res) {
        //Endpoint to wrap stardog search: /data/search-graph?q=<queryStr>
        //TODO: Add security for injection attack

        const queryStr = req.query.q
        console.log(`Searching graph for: ${queryStr}`)

        const data = await converter.getSearch(queryStr)
        return res.status(200).json(data)
    })

    return router
}