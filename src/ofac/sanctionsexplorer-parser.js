'use strict'

const fs = require('fs')
const path = require('path')

const sdn = JSON.parse(fs.readFileSync(path.join(__dirname, 'sdn.json'), 'utf8'))
const results = []

let global_doc_id = 100000

const OFAC_ARCHER_SOURCE = ['OFAC SDN', 'Archer']

function OFAC_TO_ARC_LINK(linkType) {
    return linkType.toUpperCase().split(' ').join('_')
}

module.exports.getOFAC = function() {
    sdn.forEach(entry => {
        const gid = entry.fixed_ref

        let result = {
            nodes: [{
                id: gid,
                label: entry.identity.primary.display_name,
                type: entry.party_sub_type,
                attributes: [],
            }],
            links: [],
        }

        entry.identity.aliases.forEach(alias => {
            result.nodes[0].attributes.push({
                key: 'has_alias',
                value: alias.display_name,
                sources: [ OFAC_ARCHER_SOURCE ],
                metadata: [
                    {
                        metakey: 'ALIAS_TYPE',
                        metavalue: alias.alias_type,
                        sources: [ OFAC_ARCHER_SOURCE ]
                    },
                    {
                        metakey: 'DATE_PERIOD',
                        metavalue: alias.date_period,   // is often null
                        sources: [ OFAC_ARCHER_SOURCE ]
                    },
                ]
            })
        })

        Object.keys(entry.features).forEach(feature_name => {
            const feature = entry.features[feature_name]

            feature.forEach(f_entry => {    
                const attr = {
                    key: f_entry.feature_type,
                    value: f_entry.date || 
                        f_entry.details || 
                        (f_entry.location ? f_entry.location.COMBINED : null),
                    sources: [ OFAC_ARCHER_SOURCE ],
                    metadata: [],
                }

                if (f_entry.reliability && f_entry.reliability !== 'Unknown') {
                    attr.metadata.push({
                        metakey: 'RELIABILITY',
                        metavalue: f_entry.reliability,
                        sources: [ OFAC_ARCHER_SOURCE ]
                    })
                }

                if (f_entry.comment) {
                    attr.metadata.push({
                        metakey: 'COMMENT',
                        metavalue: f_entry.comment,
                        sources: [ OFAC_ARCHER_SOURCE ]
                    })
                }

                result.nodes[0].attributes.push(attr)

            })
        })

        entry.documents.forEach(doc => {
            const doc_node = {
                id: ++global_doc_id,
                label: doc.id_number,
                attributes: [
                    {
                        key: 'DOCUMENT_TYPE',
                        value: doc.type,
                        sources: OFAC_ARCHER_SOURCE,
                        metadata: [],
                    },
                    {
                        key: 'DOCUMENT_VALIDITY',
                        value: doc.validity,
                        sources: [ OFAC_ARCHER_SOURCE ],
                        metadata: [],
                    },
                ]
            }

            const doc_attrs = {
                'DOCUMENT_ISSUED_BY': doc.issued_by,
                'DOCUMENT_ISSUED_IN': doc.issued_in,
                'DOCUMENT_ISSUING_AUTHORITY': doc.issuing_authority,
            }

            if (doc.issued_by && doc.issued_by !== 'None') {
                doc_node.attributes.push({
                    key: 'DOCUMENT_ISSUED_BY',
                    value: doc.issued_by,
                    sources: [ OFAC_ARCHER_SOURCE ],
                    metadata: []
                })
            }

            Object.keys(doc.relevant_dates).forEach(date => {
                doc_node.attributes.push({
                    key: date,
                    value: doc.relevant_dates[date]
                })
            })

            result.nodes.push(doc_node)
            result.links.push({
                subjectID: gid,
                objectID: global_doc_id,
                predicate: 'has_document',
                data: [
                    {
                        metakey: 'is_true',
                        metavalue: true,
                        sources: [ OFAC_ARCHER_SOURCE ],
                    }
                ]
            })

        })

        entry.linked_profiles.forEach(profile => {
            const details = {
                subjectID: gid,
                objectID: profile.linked_id,
                predicate: OFAC_TO_ARC_LINK(profile.relation_type),
                data: [
                    {
                        metakey: 'is_true',
                        metavalue: true,
                        sources: [ OFAC_ARCHER_SOURCE ]
                    }
                ],
            }
            result.links.push(details)
        })

        results.push(result)
    })

    return zipResults(results)
}

function zipResults(results) {
    const res = {
        nodes: [],
        links: [],
    }

    results.forEach(r => {
        res.nodes = res.nodes.concat(r.nodes)
        res.links = res.links.concat(r.links)
    })

    return res
}
