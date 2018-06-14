const { Connection, query, db } = require('stardog')
 
const conn = new Connection({
  username: 'admin',
  password: 'admin',
  endpoint: 'http://localhost:5820',
})

const PREFIX = 'PREFIX arc: <http://ont/> ' +
               'PREFIX org: <http://org#>'

const INSERT = 'PREFIX dc: <http://hi/> INSERT { <book3> dc:has_price 33 } WHERE {}'

async function select_all() {
    const SELECT_ALL = 'select * where { ?s ?p ?o }'
    let response = await query.execute(conn, 'myDB', SELECT_ALL, 'application/sparql-results+json', {})
    return response.body.results.bindings
}

async function create_entity(id, name) {
    const CREATE_ENTITY = `${PREFIX} INSERT { arc:${id} org:has_name "${name}" } WHERE {}`
    console.log(CREATE_ENTITY)
    let response = await query.execute(conn, 'myDB', CREATE_ENTITY)
    return response
}

async function main() {
    let response = await query.execute(conn, 'myDB', INSERT, 'application/sparql-results+json', {})
    console.log(response)

    let sa = await select_all()
    console.log(sa)

    let c = await create_entity('0', 'KONY, Joseph')
    console.log(c)

}

main()
