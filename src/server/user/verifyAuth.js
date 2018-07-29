'use strict'

const { authError } = require('../util')

module.exports = function verifyAuth(req, res) {
    if (!req.user) {
        authError('You must sign in to perform this action', res)
        return false
    }
    return true
}