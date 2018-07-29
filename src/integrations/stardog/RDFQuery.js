class Q {
    constructor() {
        this.prefixes = ['PREFIX arc: <http://ont/>', 'PREFIX org: <http://org#>']
        this.selects = []
        this.inserts = []
        this.wheres = []
    }
    prefix(key, namespace) {
        this.prefixes.push(`PREFIX ${key} <${namespace}>`)
        return this
    }
    selectTriple(subject, predicate, object) {
        if (!subject.startsWith('?')) {
            subject = `${this.strconv(subject)}`
        }
        if (!predicate.startsWith('?')) {
            predicate = `org:${predicate}`
        }
        if (!object.startsWith('?')) {
            object = `${this.strconv(subject)}`
        }

        this.selects.push(`${subject} ${predicate} ${object}`)
        return this
    }
    selectStar() {
        this.selects.push('*')
        return this
    }
    insertTriple(subject, predicate, object) {
        this.inserts.push(`${this.strconv(subject)} org:${predicate} ${this.strconv(object)}`)
        return this
    }
    where(subject, predicate, object) {
        if (!subject.startsWith('?')) {
            subject = `${this.strconv(subject)}`
        }
        if (!predicate.startsWith('?')) {
            predicate = `org:${predicate}`
        }
        if (!object.startsWith('?')) {
            object = `${this.strconv(object)}`
        }
        
        this.wheres.push(`${subject} ${predicate} ${object}`)
        return this
    }
    generateQuery() {
        const prefixStmts = this.prefixes.join(' ')

        let selectStmts = ''
        if (this.selects.length > 0) {
            selectStmts = 'SELECT ' + this.selects.join(' . ') + ''
        }

        let insertStmts = ''
        if (this.inserts.length > 0) {
            insertStmts = 'INSERT DATA { ' + this.inserts.join(' . ') + ' }'
        }

        let whereStmts = ''
        if (this.wheres.length > 0) {
            whereStmts = 'WHERE { ' + this.wheres.join(' . ') + ' }'
        }

        return prefixStmts + ' ' + selectStmts + ' ' + insertStmts + ' ' + whereStmts
    }
    strconv(str, prefix) {
        if (typeof str !== 'string') {
            return str
        }

        if (prefix == null) {
            prefix = 'arc'
        }
        const LIT_IDENTIFIER = 'literal:'

        if (str.startsWith(LIT_IDENTIFIER)) {
            const sliced = str.slice(LIT_IDENTIFIER.length)
            if (isNaN(Number(sliced))) {
                return `"${sliced.split('"').join('\\"')}"`
            } else {
                return Number(sliced)
            }
        }
        else {
            return `${prefix}:${str}`
        }
    }
    c(str) {
        if (str.startsWith('?')) {
            return `${str}`
        }
    }
}

module.exports = Q
