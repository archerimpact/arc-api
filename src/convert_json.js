'use strict'

const stardog = require('./stardog-connectors/query_construction')
const uuid = require('node-uuid')

const localToGlobalIDMap = {}

async function loadEntitiesFromData(data) {
    let nodes = data['nodes']
    let links = data['links']

    nodes = nodes.map(fixNodeID)
    links = links.map(fixLinkID)

    await nodes.forEach(entity => {
        const entityID = entity['id']
        stardog.createEntity(entityID, entity['label'], entity['type'])

        const attributes = entity['attributes']
        attributes.forEach(attr => {
            const claimID = getNewClaimID()
            stardog.addPropertyClaim(claimID, entityID)
            stardog.addClaimKeyAndValue(claimID, attr['key'], attr['value'])

            // var attr_sources = attr["sources"]
            // attr_sources.forEach(src_tuple => {
            //     stdog.add_claim_source(claimID, src_tuple[0])
            //     //TODO: add claim user
            // });

            // var attr_metadata = attr["metadata"]
            // attr_metadata.forEach(metadata => {
            //     //TODO: figure out which claimID to use, then add metadata
                
            // });
        })
    })

    await stardog.execute()

    await links.forEach(link => {
        const claimID = getNewClaimID()

        stardog.connectEntities(link['sourceID'],link['targetID'], claimID)
        stardog.addClaimRelation(claimID, link['relationshipType'])

        // var data = link["data"]
        // data.forEach(datapoint => {
        //     //TODO: handle metadata addition
        // });
    })

    await stardog.execute()
    
}

function fixNodeID(node) {
    const givenID = node.id
    if (!localToGlobalIDMap[givenID]) {
        const newID = getNewEntityID()
        localToGlobalIDMap[givenID] = newID
        node.id = newID
    }

    return node
}

function fixLinkID(link) {
    const sid = link.sourceID
    const tid = link.targetID

    const mappedSourceID = localToGlobalIDMap[sid]
    const mappedTargetID = localToGlobalIDMap[tid]

    if (mappedSourceID) {
        link.sourceID = mappedSourceID
    }
    if (mappedTargetID) {
        link.targetID = mappedTargetID
    }

    return link
}

function getNewClaimID() {
    const claimID = 'claim' + uuid.v4()
    return claimID
}

function getNewEntityID() {
    const entityID = 'entity' + uuid.v4()
    return entityID
}

async function getEntityByID(entityID) {
    // grab the entity ID without boilerplate namespacing
    entityID = entityID.replace('http://ont/entity', '')

    const labelResponse = await stardog.getLabel(entityID)
    const typeResponse = await stardog.getType(entityID)
    const claimsResponse = await stardog.getClaims(entityID)
    const incomingResponse = await stardog.getIncomingLinks(entityID)
    const outgoingResponse = await stardog.getOutgoingLinks(entityID)

    const label = labelResponse.body.results.bindings[0].name.value
    const type = typeResponse.body.results.bindings[0].type.value
    const properties = claimsResponse.body.results.bindings
    const incoming = incomingResponse.body.results.bindings
    const outgoing = outgoingResponse.body.results.bindings

    const data = {
        nodes: [{
            id: entityID,
            label: label,
            type: type,
            attributes: [],
        }],
        links: [],
    }

    const propertyList = data.nodes[0].attributes
    const linksList = data.links

    properties.forEach(p => {
        propertyList.push({
            claimID: p.claimID.value,
            key: p.claimType.value,
            value: p.claimValue.value,
        })
    })

    incoming.forEach(inLink => {
        linksList.push({
            claimID: inLink.claimID.value,
            sourceID: 'http://ont/entity' + entityID,       /* TODO this should be changed to be flexible with the namespace */
            targetID: inLink.entityID.value,
            relationshipType: inLink.relationship.value
        })
    })

    outgoing.forEach(outLink => {
        linksList.push({
            claimID: outLink.claimID.value,
            sourceID: outLink.entityID.value,
            targetID: 'http://ont/entity' + entityID,     /* TODO this should be changed to be flexible with the namespace */
            relationshipType: outLink.relationship.value
        })
    })
    
    return data
}

async function getEntitiesByIDs(entityIDs) {
    const jsons = []

    const waiting = entityIDs.map(async (id) => {
        const json = await getEntityByID(id)
        jsons.push(json)
    })

    await Promise.all(waiting)

    return zipResults(jsons)
}

function zipResults(results) {
    const res = {
        nodes: [],
        links: [],
    }

    results.forEach(r => {
        res.nodes = res.nodes.concat(r.nodes)
        res.links = res.links.concat(r.links)
    })

    return res
}

async function getEntityByName(name) {
    const response = await stardog.findIDByName(name)
    const id = response.body.results.bindings[0].entityID.value
    const data = await getEntityByID(id)

    return data
}

module.exports = {
    loadEntitiesFromData: loadEntitiesFromData,
    getEntityByID: getEntityByID,
    getEntitiesByIDs: getEntitiesByIDs,
    getEntityByName: getEntityByName,
}
