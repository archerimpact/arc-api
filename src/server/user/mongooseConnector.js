'use strict'

const mongoose = require('mongoose')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
    username: {
        type: String,
        index: { unique: true },
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: String,
    email: String,
})
userSchema.plugin(passportLocalMongoose)

exports.User = mongoose.model('User', userSchema)
