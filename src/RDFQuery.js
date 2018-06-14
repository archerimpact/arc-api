class Q {
    constructor() {
        this.q = ''
        this.prefixes = ['PREFIX arc: <http://ont/>', 'PREFIX org: <http://org#>']
        this.select_str = ''
        this.inserts = []
        this.wheres = []
    }
    prefix(key, namespace) {
        this.prefixes.push(`PREFIX ${key} <${namespace}>`)
        return this
    }
    select(text) {
        this.select_str = 'SELECT ' + text
        return this
    }
    insert_SPO(subject, predicate, object) {
        this.inserts.push(`arc:${subject} org:${predicate} arc:${object}`)
        return this
    }
    insert_SPLit(subject, predicate, literal) {
        this.inserts.push(`arc:${subject} org:${predicate} "${literal}"`)
        return this
    }
    where(subject, predicate, object) {
        if (!subject.startsWith('?')) {
            subject = `arc:${subject}`
        }

        if (!predicate.startsWith('?')) {
            predicate = `org:${predicate}`
        }

        if (!object.startsWith('?')) {
            object = `arc:${object}`
        }
        
        this.wheres.push(`${subject} ${predicate} ${object}`)
        return this
    }
    generate_query() {
        const prefix_stmts = this.prefixes.join(' ')

        let insert_stmts = ''
        if (this.inserts.length > 0) {
            insert_stmts = 'INSERT { ' + this.inserts.join(' . ') + ' }'
        }

        const where_stmts  = 'WHERE { ' + this.wheres.join(' . ') + ' }'

        return prefix_stmts + ' ' + this.select_str + ' ' + insert_stmts + ' ' + where_stmts
    }
}

module.exports = Q
