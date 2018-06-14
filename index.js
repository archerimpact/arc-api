const { Connection, query } = require('stardog');
 
const conn = new Connection({
  username: 'admin',
  password: 'admin',
  endpoint: 'http://localhost:5820',
});
 
// query.execute(conn, 'myDB', 'select distinct ?s where { ?s ?p ?o }', 'application/sparql-results+json', {
//   limit: 10,
//   offset: 0,
// }).then(({ body }) => {
//   console.log(body.results.bindings);
// }); 


function send_query(query_string) {
    //param: query_string = String with full sparql query contained
    //executes given sparql query and logs response
    query.execute(conn, 'myDB', query_string, 'application/sparql-results+json', {
        limit: 10,
        offset: 0,
      }).then(({ body }) => {
        console.log("early results:" + body.results.bindings);
        return body.results.bindings;
      });
}

var print_val = send_query("select distinct ?s where { ?s ?p ?o }")
console.log("end results: " + print_val)
