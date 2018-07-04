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
    const query_string = this.generate_query()
    if (DEBUG) {
        console.log(query_string)
    }
    const response = await query.execute(conn, 'myDB', query_string)
    
    if (response.ok !== true) {
        // console.log(query_string)
        console.log(response)
    }

    return response
}

let CURRENT = new Q()
module.exports.current = CURRENT

module.exports.add_property_claim = async function(claim_id, entity_id) {
    CURRENT.insert_triple(entity_id, 'has_claimed_property', claim_id)
}

module.exports.add_claim_relation = async function(claim_id, relationship) {
    CURRENT.insert_triple(claim_id, 'relationship_type', relationship)
}

module.exports.add_claim_key_and_value = async function(claim_id, key, value) {
    CURRENT
        .insert_triple(claim_id, 'has_claim_type', `literal:${key}`)
        .insert_triple(claim_id, 'claim_value_of', `literal:${value}`)
}

module.exports.add_claim_source = async function(claim_id, source) {
    CURRENT.insert_triple(claim_id, 'references_document', `literal:${source}`)
}

module.exports.create_entity = async function(id, name, entity_type) {
    CURRENT.insert_triple(id, 'has_name', `literal:${name}`)
    CURRENT.insert_triple(id, 'is', entity_type)
}

module.exports.connect_entities = async function(subject_id, object_id, claim_id) {
    CURRENT
        .insert_triple(subject_id, 'has_claim', claim_id)
        .insert_triple(claim_id, 'makes_claim_about', object=object_id)
}

module.exports.execute = async function() {
    const response = await CURRENT.send()
    return response
}

module.exports.id_to_uri = async function(id) {
    return 'entity' + id
}

/*
 * Retrieval/Querying.
 * All of these functions send their query upon function call.
 */

module.exports.get_label = async function(entity_id) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entity_id, 'has_name', '?name')
        .send()

    return response
}

module.exports.get_type = async function(entity_id) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entity_id, 'is', '?type')
        .send()

    return response
}

module.exports.get_claims = async function(entity_id) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entity_id, 'has_claimed_property', '?claim_id')
        .where('?claim_id', 'has_claim_type', '?claim_type')
        .where('?claim_id', 'claim_value_of', '?claim_value')
        .send()

    return response
}

module.exports.get_outgoing_links = async function(entity_id) {
    const response = await (new Q())
        .selectStar()
        .where('entity' + entity_id, 'has_claim', '?claim_id')
        .where('?claim_id', 'makes_claim_about', '?entity_id')
        .where('?entity_id', 'has_name', '?name')
        .where('?claim_id', 'relationship_type', '?relationship')
        .send()
    
    return response
}

module.exports.get_incoming_links = async function(entity_id) {
    const response = await (new Q())
        .selectStar()
        .where('?entity_id', 'has_claim', '?claim_id')
        .where('?claim_id', 'makes_claim_about', 'entity' + entity_id)
        .where('?entity_id', 'has_name', '?name')
        .where('?claim_id', 'relationship_type', '?relationship')
        .send()
    
    return response
}

module.exports.select_all = async function() {
    const response = await (new Q())
        .selectStar()
        .where('?s', '?p', '?o')
        .send()

    return response
}

module.exports.name_to_id = async function(name) {
    const response = await (new Q())
        .selectStar()
        .where('?entity_id', 'has_name', `literal:${name}`)
        .send()

    return response
}

/*
module.exports.find_all_outgoing_relations = async function(subject_id) {
    const response = await (new Q())
        .select('*')
        .where(subject_id, 'has_claim', '?claim')
        .where('?claim', 'makes_claim_about', '?obj')
        .send()

    return response.body.results.bindings
}
*/
