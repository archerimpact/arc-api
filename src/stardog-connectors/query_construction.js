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
    CURRENT = new Q()   /* this must go here! Since it's async, CURRENT needs to be cleared before this long call is made. */
    let response = await query.execute(conn, 'myDB', query_string, {})
    
    if (response.ok !== true) {
        console.log(query_string)
        console.log(response)
    }

    return response
}

let CURRENT = new Q()

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

module.exports.create_entity = async function(id, name) {
    CURRENT.insert_triple(id, 'has_name', `literal:${name}`)
}

module.exports.connect_entities = async function(subject_id, object_id, claim_id) {
    CURRENT
        .insert_triple(subject_id, 'has_claim', claim_id)
        .insert_triple(claim_id, 'makes_claim_about', object=object_id)
}

module.exports.execute = async function() {
    // console.log('executing...')
    // console.log(CURRENT)
    const response = await CURRENT.send()
    // console.log('\n\n\n\n Current value = ')
    // console.log(CURRENT)
    return response
}

/*
module.exports.select_all = async function() {
    CURRENT
        .select('*')
        .where('{ ?s ?p ?o }')

    return response.body.results.bindings
}

module.exports.find_all_outgoing_relations = async function(subject_id) {
    const response = await (new Q())
        .select('*')
        .where(subject_id, 'has_claim', '?claim')
        .where('?claim', 'makes_claim_about', '?obj')
        .send()

    return response.body.results.bindings
}
*/