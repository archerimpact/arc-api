'use strict'

const stdog = require('./index')

var local_to_global_id_map;

async function convert(json_object) {
    //parses json in format specified in src/example_schema.json

    var nodes = json_object["nodes"];
    nodes = nodes.map(fixNodeID);
    var links = json_object["links"];
    links = links.map(fixLinkID);
    //load in links and nodes from JSON object. Fix id's to match global archer id's

    nodes.forEach(entity => {
        var entity_id = entity["id"]
        stdog.create_entity(entity_id, entity["label"]);
        //TODO: add typing

        var attributes = entity["attributes"]
        attributes.forEach(attr => {
            var claim_id = getNewClaimID()
            stdog.add_entity_claim(claim_id, entity_id)
            stdog.add_claim_key_and_value(claim_id, attr["key"], attr["value"])

            var attr_sources = attr["sources"]
            attr_sources.forEach(src_tuple => {
                stdog.add_claim_source(claim_id, src_tuple[0])
                //TODO: add claim user
            });

            var attr_metadata = attr["metadata"]
            attr_metadata.forEach(metadata => {
                //TODO: figure out which claim_id to use, then add metadata
                
            });
        });
    });

    links.forEach(link => {
        var claim_id = getNewClaimID()
        //TODO: figure out wtf to do with id's

        strdog.connect_entities(link["subjectID"],link["objectID"], claim_id)
        strdog.add_claim_relation(claim_id, link["predicate"])

        var data = link["data"]
        data.forEach(datapoint => {
            //TODO: handle metadata addition
        });
    });
    
}

function fixNodeID(node) {
    //TODO: Implement. Check if node's id is global. 
    //If not, assign new global id and create a temporary map from previous id to global id. <local_to_global_id_map>
    return node;
}

function fixLinkID(link) {
    //TODO: Implement. If id is non-global, use change to mapped value in <local_to_global_id_map>
    return link;
}

function getNewClaimID() {
    return 1;
}
