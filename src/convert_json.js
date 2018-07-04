'use strict'

const stdog = require('./stardog-connectors/query_construction')
const uuid = require('node-uuid')
const sleep = require('sleep')

const local_to_global_id_map = {}

module.exports.fromJSON = async function(json_object) {
    //parses json in format specified in src/example_schema.json

    var nodes = json_object["nodes"];
    nodes = nodes.map(fixNodeID);
    var links = json_object["links"];
    links = links.map(fixLinkID);
    console.log('Nodes and links fixed!')

    await nodes.forEach(entity => {
        const entity_id = entity["id"]
        stdog.create_entity(entity_id, entity["label"])
        //TODO: add type

        var attributes = entity["attributes"]
        attributes.forEach(attr => {
            const claim_id = get_new_claim_id()
            stdog.add_property_claim(claim_id, entity_id)
            stdog.add_claim_key_and_value(claim_id, attr["key"], attr["value"])

            // var attr_sources = attr["sources"]
            // attr_sources.forEach(src_tuple => {
            //     stdog.add_claim_source(claim_id, src_tuple[0])
            //     //TODO: add claim user
            // });

            // var attr_metadata = attr["metadata"]
            // attr_metadata.forEach(metadata => {
            //     //TODO: figure out which claim_id to use, then add metadata
                
            // });
        });
    });

    await stdog.execute()

    await links.forEach(link => {
        var claim_id = get_new_claim_id()

        stdog.connect_entities(link["subjectID"],link["objectID"], claim_id)
        stdog.add_claim_relation(claim_id, link["predicate"])

        // var data = link["data"]
        // data.forEach(datapoint => {
        //     //TODO: handle metadata addition
        // });
    });

    await stdog.execute()
    
}

function fixNodeID(node) {
    const given_id = node.id
    if (!local_to_global_id_map[given_id]) {
        const new_id = get_new_entity_id()
        local_to_global_id_map[given_id] = new_id
        node.id = new_id
    }

    return node
}

function fixLinkID(link) {
    const sid = link.subjectID
    const oid = link.objectID

    const mapped_sid = local_to_global_id_map[sid]
    const mapped_oid = local_to_global_id_map[oid]

    if (mapped_sid) {
        link.subjectID = mapped_sid
    }
    if (mapped_oid) {
        link.objectID = mapped_oid
    }

    return link
}

function get_new_claim_id() {
    const claim_id = 'claim' + uuid.v4()
    return claim_id
}

function get_new_entity_id() {
    const entity_id = 'entity' + uuid.v4()
    return entity_id
}

module.exports.toJSON = async function(entity_id) {
    const label_response = await stdog.get_label(entity_id)
    const claims_response = await stdog.get_claims(entity_id)
    const links_response = await stdog.get_linked_entities(entity_id)

    const label = label_response.body.results.bindings
    const properties = claims_response.body.results.bindings
    const links = links_response.body.results.bindings

    const json = {
        nodes: [{
            id: entity_id,
            label: label,
            attributes: [],
        }],
        links: [],
    }

    const prop_list = json.nodes[0].attributes
    const link_list = json.links

    properties.forEach(p => {
        prop_list.push({
            claim_id: p.claim_id.value,
            key: p.claim_type.value,
            value: p.claim_value.value,
        })
    })

    links.forEach(l => {
        link_list.push({
            claim_id: p.claim_id.value,
            subjectID: 'http://ont/entity' + entity_id,       /* TODO this should be changed to be flexible with the namespace */
            objectID: l.entity_id.value,
            predicate: l.relationship.value
        })
    })
    
    return json
}