const { Connection, query } = require('stardog');
 
const conn = new Connection({
  username: 'admin',
  password: 'admin',
  endpoint: 'http://localhost:5820',
});
 
query.execute(conn, 'myDB', 'select distinct ?s where { ?s ?p ?o }', 'application/sparql-results+json', {
  limit: 10,
  offset: 0,
}).then(({ body }) => {
  console.log(body.results.bindings);
});