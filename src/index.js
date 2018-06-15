const { Connection, query, db } = require('stardog')
const Q = require('./RDFQuery')

const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:5820',
})

// connect the RDFQuery object to the instance of the db
Q.prototype.send = async function() {
    let response = await query.execute(conn, 'myDB', this.generate_query(), {})
    return response
}

async function add_claim_relation(claim_id, relationship) {
    const response = (new Q())
        .insert_SPO(claim_id, 'relationship_type', relationship)
        .send()

    return response
}

async function add_claim_key_and_value(claim_id, key, value) {
    const response1 = (new Q())
        .insert_SPO(claim_id, 'has_claim_type', key)
        .send()

    const response2 = (new Q())
        .insert_SPLit(claim_id, 'claim_value_of', value)
        .send()

    return response1.ok && response2.ok
}

async function add_claim_source(claim_id, source) {
    const response = (new Q())
        .insert_SPLit(claim_id, 'references_document', source)
        .send()

    return response.ok
}

async function select_all() {
    const response = (new Q())
        .select('*')
        .where('{ ?s ?p ?o }')
        .send()

    return response.body.results.bindings
}

async function create_entity(id, name) {
    const response = (new Q())
        .insert_SPLit(id, 'has_name', name)
        .send()

    return response
}

async function connect_entities(subject_id, object_id, claim_id) {
    const response1 = (new Q())
        .insert_SPO(subject_id, 'has_claim', claim_id)
        .send()
    
    const response2  = (new Q())
        .insert_SPO(claim_id, 'makes_claim_about', object=object_id)
        .send()

    return response1.ok && response2.ok
}

async function find_all_outgoing_relations(subject_id) {
    const response = (new Q())
        .select('*')
        .where(subject_id, 'has_claim', '?claim')
        .where('?claim', 'makes_claim_about', '?obj')
        .send()

    return response.body.results.bindings
}

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

async function main() {
    await seed()
}

main()
