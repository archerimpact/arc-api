const { Connection, query, db } = require('stardog')
const Q = require('./RDFQuery')

const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://localhost:5820',
})

async function add_claim_relation(claim_id, relationship) {
    const ADD_RELATION = (new Q()).insert_SPO(claim_id, 'relationship_type', relationship).generate_query()
    let response = await query.execute(conn, 'myDB', ADD_RELATION)
    return response
}

async function add_claim_key_and_value(claim_id, key, value) {
    const ADD_KEY = (new Q()).insert_SPO(claim_id, 'has_claim_type', key).generate_query()
    let key_response = await query.execute(conn, 'myDB', ADD_KEY)

    const ADD_VALUE = (new Q()).insert_SPLit(claim_id, 'claim_value_of', value).generate_query()
    let val_response = await query.execute(conn, 'myDB', ADD_VALUE)

    return key_response.ok && val_response.ok
}

async function add_claim_source(claim_id, source) {
    const q = (new Q()).insert_SPLit(claim_id, 'references_document', source).generate_query()
    let response = await query.execute(conn, 'myDB', q)
    return response.ok
}

async function select_all() {
    const SELECT_ALL = (new Q()).select('*').where('{ ?s ?p ?o }').generate_query()
    let response = await query.execute(conn, 'myDB', SELECT_ALL)
    return response.body.results.bindings
}

async function create_entity(id, name) {
    const CREATE_ENTITY = (new Q()).insert_SPLit(id, 'has_name', name).generate_query()
    console.log(CREATE_ENTITY)
    let response = await query.execute(conn, 'myDB', CREATE_ENTITY)
    return response
}

async function connect_entities(subject_id, object_id, claim_id) {
    const SUBJ_TO_CLAIM = (new Q()).insert_SPO(subject_id, 'has_claim', claim_id).generate_query()
    const CLAIM_TO_OBJ  = (new Q()).insert_SPO(claim_id, 'makes_claim_about', object=object_id).generate_query()

    let insert1 = await query.execute(conn, 'myDB', SUBJ_TO_CLAIM, {} )
    let insert2 = await query.execute(conn, 'myDB', CLAIM_TO_OBJ, {} )

    return insert1.ok && insert2.ok
}

async function find_all_outgoing_relations(subject_id) {
    const OUT_CLAIMS = (new Q())
        .select('*')
        .where(subject_id, 'has_claim', '?claim')
        .where('?claim', 'makes_claim_about', '?obj')
        .generate_query()
    console.log(OUT_CLAIMS)
    
    const response = await query.execute(conn, 'myDB', OUT_CLAIMS)
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
