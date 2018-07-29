'use strict'

const converter = require('../../server/graph_data/convert_json')
const OFAC = require('./sanctionsexplorer-parser')

async function loadOFAC() {
    console.log('Loading OFAC...')
    const entries = OFAC.getOFAC()
    converter.loadEntitiesFromData(entries)
}

loadOFAC()
