'use strict'

const express = require('express')
const converter = require('./convert_json')
const router = express.Router()

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
        return res.status(200).json(data)
    })

    return router
}