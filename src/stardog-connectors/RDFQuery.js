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
    select_triple(subject, predicate, object) {
        if (!subject.startsWith('?')) {
            subject = `${this.strconv(subject)}`
        }
        if (!predicate.startsWith('?')) {
            predicate = `org:${predicate}`
        }
        if (!object.startsWith('?')) {
            object = `org:${object}`
        }

        this.selects.push(`${subject} ${predicate} ${object}`)
        return this
    }
    selectStar() {
        this.selects.push('*')
        return this
    }
    insert_triple(subject, predicate, object) {
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
            object = `org:${object}`
        }
        
        this.wheres.push(`${subject} ${predicate} ${object}`)
        return this
    }
    generate_query() {
        const prefix_stmts = this.prefixes.join(' ')

        let select_stmts = ''
        if (this.selects.length > 0) {
            select_stmts = 'SELECT ' + this.selects.join(' . ') + ''
        }

        let insert_stmts = ''
        if (this.inserts.length > 0) {
            insert_stmts = 'INSERT DATA { ' + this.inserts.join(' . ') + ' }'
        }

        let where_stmts  = ''
        if (this.wheres.length > 0) {
            where_stmts = 'WHERE { ' + this.wheres.join(' . ') + ' }'
        }

        return prefix_stmts + ' ' + select_stmts + ' ' + insert_stmts + ' ' + where_stmts
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
