const { Connection, query, db } = require('stardog')
const Q = require('./RDFQuery')
const DEBUG = false

const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:5820',
})

// connect the RDFQuery object to the instance of the db
Q.prototype.send = async function () {
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

async function addPropertyClaim(claimID, entityID) {
    CURRENT.insertTriple(entityID, 'has_claimed_property', claimID)
}

async function addClaimRelation(claimID, relationship) {
    CURRENT.insertTriple(claimID, 'relationship_type', relationship)
}

async function addClaimKeyAndValue(claimID, key, value) {
    CURRENT
        .insertTriple(claimID, 'has_claim_type', `literal:${key}`)
        .insertTriple(claimID, 'claim_value_of', `literal:${value}`)
}

async function add_claim_source(claimID, source) {
    CURRENT.insertTriple(claimID, 'references_document', `literal:${source}`)
}

async function createEntity(id, name, entity_type) {
    CURRENT.insertTriple(id, 'has_name', `literal:${name}`)
    CURRENT.insertTriple(id, 'is', entity_type)
}

async function connectEntities(subject_id, object_id, claimID) {
    CURRENT
        .insertTriple(subject_id, 'has_claim', claimID)
        .insertTriple(claimID, 'makes_claim_about', object = object_id)
}

async function execute() {
    const response = await CURRENT.send()
    return response
}

/*
 * Retrieval/Querying.
 * All of these functions send their query upon function call.
 */

async function getLabel(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'has_name', '?name')
        .send()

    return response
}

async function getType(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'is', '?type')
        .send()

    return response
}

async function getClaims(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'has_claimed_property', '?claimID')
        .where('?claimID', 'has_claim_type', '?claimType')
        .where('?claimID', 'claim_value_of', '?claimValue')
        .send()

    return response
}

async function getOutgoingLinks(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entityID, 'has_claim', '?claimID')
        .where('?claimID', 'makes_claim_about', '?entityID')
        .where('?entityID', 'has_name', '?name')
        .where('?claimID', 'relationship_type', '?relationship')
        .send()

    return response
}

async function getIncomingLinks(entityID) {
    const response = await (new Q())
        .selectStar()
        .where('?entityID', 'has_claim', '?claimID')
        .where('?claimID', 'makes_claim_about', 'entity' + entityID)
        .where('?entityID', 'has_name', '?name')
        .where('?claimID', 'relationship_type', '?relationship')
        .send()

    return response
}

async function selectAll() {
    const response = await (new Q())
        .selectStar()
        .where('?s', '?p', '?o')
        .send()

    return response
}

async function findIDByName(name) {
    const response = await (new Q())
        .selectStar()
        .where('?entityID', 'has_name', `literal:${name}`)
        .send()

    return response
}


module.exports = {
    addPropertyClaim: addPropertyClaim,
    addClaimRelation: addClaimRelation,
    addClaimKeyAndValue: addClaimKeyAndValue,
    createEntity: createEntity,
    connectEntities: connectEntities,
    execute: execute,
    getLabel: getLabel,
    getType: getType,
    getClaims: getClaims,
    getIncomingLinks: getIncomingLinks,
    getOutgoingLinks: getOutgoingLinks,
    selectAll: selectAll,
    findIDByName: findIDByName,
}