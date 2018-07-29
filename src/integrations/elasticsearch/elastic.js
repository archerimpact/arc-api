const path = require('path');
const es = require('elasticsearch');
const client = new es.Client({
    host: 'localhost:9200',
});

async function delete_index(name) {
    try {
        console.log('Deleting ' + name + ' index...', 'info');
        return await client.indices.delete({ index: name });
    }
    catch (error) {
        console.log('Could not delete ' + name + ' index: ' + error, 'error');
    }
}

async function bulk_add(operations, index_name, index_type) {
    let body = [];

    for (let i = 0; i < operations.length; i++) {
        let index_statement = {
            index: {
                _index: index_name,
                _type: index_type,
                _id: i,
            }
        };
        body.push(index_statement);
        body.push(operations[i]);
    }

    try {
        console.log('Bulk loading...', 'info');
        const result = await client.bulk({
            body: body
        });

        result.items.forEach(i => {
            if (i.index.error) {
                console.log(JSON.stringify(i), 'error');
            }
        });

        return result;
    }
    catch (error) {
        console.log(error, 'error');
    }
}

async function bulk_update(operations, index_name, index_type) {
    let body = [];
    operations.forEach(op => {
        let update_statement = {
            update: {
                _index: index_name,
                _type: index_type,
                _id: parseInt(op.id),
            }
        };
        body.push(update_statement);
        body.push(op.body);
    });

    try {
        console.log('Bulk updating...', 'info');
        const result = await client.bulk({
	    timeout:"6s",
	    body: body
        });

        result.items.forEach(i => {
            if (i.update.error) {
                console.log(JSON.stringify(i), 'error');
            }
        });

        return result;
    }
    catch (error) {
        console.log(error, 'error');
    }
}

async function create_index(name) {
    console.log('Creating ' + name + ' index...', 'info');
    let created = await client.indices.exists({ index: name });
    if (!created) {
        return await client.indices.create({ index: name });
    }
    else {
        console.log('Index ' + name + ' already existed; deletion failed', 'error');
    }
}

async function indexing_stats(name) {
    let stats = await client.indices.stats({ index: name });
    let count = stats.indices[name].total.indexing.index_total;
    return count;
}

async function reload_index(operations, transform, index_name, index_type) {
    try {
        await delete_index(index_name);
        await create_index(index_name);
        await bulk_add(operations, transform, index_name, index_type, 0);
    } catch (error) {
        console.log(error, 'error');
    }
}


async function add_synonym_mappings(name){
    try{
        let map_body = {
            properties:{
                all_fields:{
		    type:"text",
                    analyzer:"synonym"
                },
                countries:{
		    type:"text",
                    analyzer:"synonym"
                },
                nationality_country:{
		    type:"text",
                    analyzer:"synonym"
                },
                citizenship_country:{
		    type:"text",
                    analyzer:"synonym"
                },
                nationality_of_registration:{
		    type:"text",
		    analyzer:"synonym"
                }
            }
        }
        await client.indices.putMapping({index:name, type:"_doc", body:map_body});
    }
    catch(error){
        console.log(error, 'error');
    }
}

async function search_ES(query, res) {
    try {
        const results = await client.search(query);
        let response = [];
        for (let i in results.hits.hits) {
            let score = results.hits.hits[i]['_score'];
            let source = results.hits.hits[i]['_source'];
            response.push([source, score]);
        }
        return {
            'response': response,
            'num_results': results.hits.total,
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports = {
    reload_index: reload_index,
    bulk_add: bulk_add,
    bulk_update: bulk_update,
    delete_index: delete_index,
    create_index: create_index,
    indexing_stats: indexing_stats,
    search_ES: search_ES
}
