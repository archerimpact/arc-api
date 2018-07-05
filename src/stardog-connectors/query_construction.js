const { Connection, query, db } = require('stardog')
const Q = require('./RDFQuery')
const DEBUG = false

const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:5820',
})

// connect the RDFQuery object to the instance of the db
Q.prototype.send = async function() {
    const queryString = this.generateQuery()
    if (DEBUG) {
        console.log(queryString)
    }
    const response = await query.execute(conn, 'myDB', queryString)
    
    if (response.ok !== true) {
        // console.log(queryString)
        console.log(response)
    }

    return response
}

let CURRENT = new Q()
module.exports.current = CURRENT

module.exports.addPropertyClaim = async function(claimID, entityID) {
    CURRENT.insertTriple(entityID, 'has_claimed_property', claimID)
}

module.exports.addClaimRelation = async function(claimID, relationship) {
    CURRENT.insertTriple(claimID, 'relationship_type', relationship)
}

module.exports.addClaimKeyAndValue = async function(claimID, key, value) {
    CURRENT
        .insertTriple(claimID, 'has_claim_type', `literal:${key}`)
        .insertTriple(claimID, 'claim_value_of', `literal:${value}`)
}

module.exports.add_claim_source = async function(claimID, source) {
    CURRENT.insertTriple(claimID, 'references_document', `literal:${source}`)
}

module.exports.createEntity = async function(id, name, entity_type) {
    CURRENT.insertTriple(id, 'has_name', `literal:${name}`)
    CURRENT.insertTriple(id, 'is', entity_type)
}

module.exports.connectEntities = async function(subject_id, object_id, claimID) {
    CURRENT
        .insertTriple(subject_id, 'has_claim', claimID)
        .insertTriple(claimID, 'makes_claim_about', object=object_id)
}

module.exports.execute = async function() {
    const response = await CURRENT.send()
    return response
}

/*
 * Retrieval/Querying.
 * All of these functions send their query upon function call.
 */

module.exports.getLabel = async function(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'has_name', '?name')
        .send()

    return response
}

module.exports.getType = async function(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'is', '?type')
        .send()

    return response
}

module.exports.getClaims = async function(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'has_claimed_property', '?claimID')
        .where('?claimID', 'has_claim_type', '?claimType')
        .where('?claimID', 'claim_value_of', '?claimValue')
        .send()

    return response
}

module.exports.getOutgoingLinks = async function(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'has_claim', '?claimID')
        .where('?claimID', 'makes_claim_about', '?entityID')
        .where('?entityID', 'has_name', '?name')
        .where('?claimID', 'relationship_type', '?relationship')
        .send()
    
    return response
}

module.exports.getIncomingLinks = async function(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('?entityID', 'has_claim', '?claimID')
        .where('?claimID', 'makes_claim_about', 'entity' + entityID)
        .where('?entityID', 'has_name', '?name')
        .where('?claimID', 'relationship_type', '?relationship')
        .send()
    
    return response
}

module.exports.selectAll = async function() {
    const response = await (new Q())
        .selectStar()
        .where('?s', '?p', '?o')
        .send()

    return response
}

module.exports.findIDByName = async function(name) {
    const response = await (new Q())
        .selectStar()
        .where('?entityID', 'has_name', `literal:${name}`)
        .send()

    return response
}
