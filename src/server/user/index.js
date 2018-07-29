'use strict'

const User = require('./model').User
const { success, error } = require('../util')

const passport = require('passport')
const LocalStrategy = require('passport-local')

const express = require('express')
const router = express.Router()


// TODO validate usernames
function usernameIsValid(str) {
    return true
}


async function login(req, res, next) {
    // this check should probably never evaluate, since passport.authenticate will have already failed.
    if (!req.user) { return error('Invalid login attempt', res) }
    return success('Logged in successfully', res)
}


async function logout(req, res) {
    req.logout()
    return success('Logged out successfully', res)
}


async function verify(req, res) {
    if (!req.isAuthenticated()) { return error('Invalid authentication', res) }
    return success('Valid authentication', res)
}


async function register(req, res) {
    const username = req.body.username
    const password = req.body.password

    if (!username || !usernameIsValid(username)) { return error('Invalid username', res) }
    if (!password) { return error('Invalid password', res) }

    const newUser      = new User({ username: username, password: password })
    const registration = await User.register(newUser, password)

    if (!registration) { return error('Registration failed; please try again', res) }

    return success('Registered successfully', res)
}


module.exports = function(app) {
    passport.use(new LocalStrategy(User.authenticate()))
    passport.serializeUser(User.serializeUser())
    passport.deserializeUser(User.deserializeUser())
    app.use(passport.initialize())
    app.use(passport.session())

    router.post('/login', passport.authenticate('local'), login)
    router.get('/logout', logout)
    router.get('/verify', verify)
    router.post('/register', register)

    return router
}