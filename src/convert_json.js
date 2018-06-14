const stdog = require('./index')

var global_id_count = 0;

async function convert(json_object) {
    //parses json in format specified in src/example_schema.json
    var nodes = json_object["nodes"];
    nodes.map(fixID);
    var links = json_object["links"];

    nodes.forEach(entity => {
        stdog.create_entity(entity["id"], entity["label"]);
        
    });

    links.forEach(link => {

    });
    
}

function fixID(node) {
    node["id"] = genID();
    return node;
}

function genID() {
    global_id_count += 1;
    return global_id_count;
}