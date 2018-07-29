'use strict'

const stardog = require('../../integrations/stardog/query_construction')
const uuid = require('node-uuid')
const es = require('elasticsearch')
const elasticHelper = require('../../integrations/elasticsearch/elastic')

const localToGlobalIDMap = {}

async function loadEntitiesFromData(data) {
    let nodes = data['nodes']
    let links = data['links']

    nodes = nodes.map(fixNodeID)
    links = links.map(fixLinkID)

    await Promise.all(nodes.map(async (entity) => {
        const entityID = entity['id']
        await stardog.createEntity(entityID, entity['label'], entity['type'])

        const attributes = entity['attributes']
        await Promise.all(attributes.map(async attr => {
            const claimID = getNewClaimID()
            await stardog.addPropertyClaim(claimID, entityID)
            await stardog.addClaimKeyAndValue(claimID, attr['key'], attr['value'])
        }))
    }))

    await stardog.execute()

    await Promise.all(links.map(async link => {
        const claimID = getNewClaimID()

        await stardog.connectEntities(link['sourceID'],link['targetID'], claimID)
        await stardog.addClaimRelation(claimID, link['relationshipType'])
    }))

    await stardog.execute()

    //TODO: calculate link count for each node

    //load nodes into elastic
    try {
        await elasticHelper.delete_index('entities');
    } catch(err) {
        console.log("Unable to delete index. Error: " + err)
    }

    await elasticHelper.create_index('entities');
    await elasticHelper.bulk_add(nodes, 'entities', 'entry', 'fixed_ref');
    let count = await elasticHelper.indexing_stats('entities');
    console.log(count)

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

async function getEntityPropertiesByID(entityID) {
    // grab the entity ID without boilerplate namespacing
    entityID = entityID.replace('http://ont/entity', '')

    const labelResponse = await stardog.getLabel(entityID)
    const typeResponse = await stardog.getType(entityID)
    const claimsResponse = await stardog.getClaims(entityID)

    const label = labelResponse.body.results.bindings[0].name.value
    const type = typeResponse.body.results.bindings[0].type.value
    const properties = claimsResponse.body.results.bindings

    const node = {
        id: entityID,
        label: label,
        type: type,
        attributes: [],
        util: [],
    }

    properties.forEach(p => {
        node.attributes.push({
            claimID: p.claimID.value,
            key: p.claimType.value,
            value: p.claimValue.value,
        })
    })

    node.util.push({
        totalLinks: await getLinkCount(entityID)
    })

    return node
}


async function getEntityByID(entityID) {
    // grab the entity ID without boilerplate namespacing
    entityID = entityID.replace('http://ont/entity', '')

    const json = {
        nodes: [],
        links: []
    }
    const data = await getEntityPropertiesByID(entityID)
    json.nodes.push(data)
    
    const incomingResponse = await stardog.getIncomingLinks(entityID)
    const outgoingResponse = await stardog.getOutgoingLinks(entityID)

    const incoming = incomingResponse.body.results.bindings
    const outgoing = outgoingResponse.body.results.bindings

    await Promise.all(incoming.map(async inLink => {
        const linked = inLink.entityID.value
        console.log('incoming linked: ' + linked)
        const linkedData = await getEntityPropertiesByID(linked)

        json.nodes.push(linkedData)
        json.links.push({
            claimID: inLink.claimID.value,
            sourceID: 'http://ont/entity' + entityID,
            targetID: linked,
            relationshipType: inLink.relationship.value
        })
    }))

    await Promise.all(outgoing.map(async (outLink) => {
        const linked = outLink.entityID.value
        const linkedData = await getEntityPropertiesByID(linked)

        json.nodes.push(linkedData)
        json.links.push({
            claimID: outLink.claimID.value,
            sourceID: linked,
            targetID: 'http://ont/entity' + entityID,
            relationshipType: outLink.relationship.value
        })
    }))

    return json
}

async function getEntitiesByIDs(entityIDs) {
    const jsons = []

    await Promise.all(entityIDs.map(async id => {
        const json = await getEntityByID(id)
        jsons.push(json)
    }))

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

async function getLinkCount(entityID) {
    const incoming = await stardog.getIncomingLinks(entityID)
    const outgoing = await stardog.getOutgoingLinks(entityID)

    return incoming.body.results.bindings.length + outgoing.body.results.bindings.length
}

module.exports = {
    loadEntitiesFromData: loadEntitiesFromData,
    getEntityByID: getEntityByID,
    getEntitiesByIDs: getEntitiesByIDs,
    getEntityByName: getEntityByName,
}
