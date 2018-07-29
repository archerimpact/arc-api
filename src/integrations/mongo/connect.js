const mongoose = require('mongoose')

module.exports = function(password) {
    const mongoURL = 'mongodb://arch2:' + password + '@ds263639.mlab.com:63639/architect'
    return mongoose.connect(mongoURL)
}
