const { Connection, query, db } = require('stardog')
 
const conn = new Connection({
  username: 'admin',
  password: 'admin',
  endpoint: 'http://localhost:5820',
})

const PREFIX =
    `PREFIX arc: <http://ont/>
    PREFIX org: <http://org#>`

const CLAIM_KEYS = {

}

function generate_insert_string(subject, predicate, literal) {
    return `${PREFIX} INSERT { arc:${subject} org:${predicate} "${literal}" }`
}

function generate_insert_triple(subject, predicate, object) {
    return `${PREFIX} INSERT { arc:${subject} org:${predicate} arc:${object} }`
}

async function add_claim_relation(claim_id, relationship) {
    const ADD_RELATION = generate_insert_triple(claim_id, 'relationship_type', relationship) + ' WHERE {}'
    let response = await query.execute(conn, 'myDB', ADD_RELATION)
    return response
}

async function add_claim_key_and_value(claim_id, key, value) {
    const ADD_KEY = generate_insert_triple(claim_id, 'has_claim_type', key) + ' WHERE {}'
    let key_response = await query.execute(conn, 'myDB', ADD_KEY)

    const ADD_VALUE = generate_insert_string(claim_id, 'claim_value_of', value) + ' WHERE {}'
    let val_response = await query.execute(conn, 'myDB', ADD_VALUE)

    return key_response.ok && val_response.ok
}

async function add_claim_source(claim_id, source) {
    const ADD_SOURCE = generate_insert_string(claim_id, 'sourced_from', source) + ' WHERE {}'
    let response = await query.execute(conn, 'myDB', ADD_SOURCE)
    return response.ok
}

async function select_all() {
    const SELECT_ALL = 'SELECT * where { ?s ?p ?o }'
    let response = await query.execute(conn, 'myDB', SELECT_ALL)
    return response.body.results.bindings
}

async function create_entity(id, name) {
    const CREATE_ENTITY = generate_insert_string(id, 'has_name', name) + ' WHERE {}'
    let response = await query.execute(conn, 'myDB', CREATE_ENTITY)
    return response
}

async function connect_entities(subject_id, object_id, claim_id) {
    const SUBJ_TO_CLAIM = generate_insert_triple(subject_id, 'has_claim', object=claim_id) + ' WHERE {}'
    const CLAIM_TO_OBJ  = generate_insert_triple(claim_id, 'makes_claim_about', object=object_id) + ' WHERE {}'

    let insert1 = await query.execute(conn, 'myDB', SUBJ_TO_CLAIM, {} )
    let insert2 = await query.execute(conn, 'myDB', CLAIM_TO_OBJ, {} )
}

async function find_all_outgoing_relations(subject_id) {
    const OUT_CLAIMS = 
        `${PREFIX}
        SELECT *
        WHERE {
            arc:${subject_id} org:has_claim ?claim .
            ?claim org:makes_claim_about ?obj
        }`
    
    const response = await query.execute(conn, 'myDB', OUT_CLAIMS)
    return response.body.results.bindings
}

async function seed() {
    let joseph = await create_entity('0', 'KONY, Joseph')
    let ali = await create_entity('1', 'KONY, Ali')

    const c = 'claim1'
    let connect = await connect_entities('0', '1', c)
    let r = await add_claim_relation(c, 'HAS_BROTHER')
    let kv = await add_claim_key_and_value(c, 'START_DATE', '06/08/13')
    let src = await add_claim_source(c, 'OFAC:7')
    // let sa = await select_all()
    // let out = await find_all_outgoing_relations(0)

}


async function main() {
    await seed()
}

main()
