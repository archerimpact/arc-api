'use strict'

const fs = require('fs')
const path = require('path')

const sdn = JSON.parse(fs.readFileSync(path.join(__dirname, 'sdn.json'), 'utf8'))
const results = []

let globalDocID = 100000

const OFAC_ARCHER_SOURCE = ['OFAC SDN', 'Archer']

function OFAC_TO_ARC_LINK(linkType) {
    return linkType.toUpperCase().split(' ').join('_')
}

module.exports.getOFAC = function() {
    const nodes = []
    const links = []

    sdn.forEach(entry => {
        const gid = entry.fixed_ref

        const currentNode = {
            id: gid,
            label: entry.identity.primary.display_name,
            type: entry.party_sub_type,
            attributes: [],
        }

        currentNode.attributes.push({
            key: 'OFAC List',
            value: entry.sanctions_entries[0].list
        })

        currentNode.attributes.push({
            key: 'OFAC Program',
            value: entry.sanctions_entries[0].program
        })

        entry.identity.aliases.forEach(alias => {
            currentNode.attributes.push({
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

                currentNode.attributes.push(attr)
            })
        })

        entry.documents.forEach(doc => {
            const docNode = {
                id: ++globalDocID,
                label: doc.id_number,
                type: 'document',
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
                docNode.attributes.push({
                    key: 'DOCUMENT_ISSUED_BY',
                    value: doc.issued_by,
                    sources: [ OFAC_ARCHER_SOURCE ],
                    metadata: []
                })
            }

            Object.keys(doc.relevant_dates).forEach(date => {
                docNode.attributes.push({
                    key: date,
                    value: doc.relevant_dates[date]
                })
            })

            nodes.push(docNode)
            links.push({
                sourceID: gid,
                targetID: globalDocID,
                relationshipType: 'has_document',
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
            if (!profile.is_reverse) {
                const profileLink = {
                    sourceID: gid,
                    targetID: profile.linked_id,
                    relationshipType: OFAC_TO_ARC_LINK(profile.relation_type),
                    data: [
                        {
                            metakey: 'is_true',
                            metavalue: true,
                            sources: [ OFAC_ARCHER_SOURCE ]
                        }
                    ],
                }
                links.push(profileLink)
            }
        })

        nodes.push(currentNode)
    })

    return {
        nodes: nodes,
        links: links,
    }
}
