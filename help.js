import util from 'util';

class S {
    constructor(str) {
        this.str = str
    }
    [util.inspect.custom]() {
        return this.str
    }
}
function s(s) { return new S(s) }

const table = {
    build: {
        command: s('yarn build'),
    }, 'single line': {
        command: s(`cat << EOF | bash -c "node src/main.js"`),
        extra: s('enter + type EOF + enter to end input')
    }, 'multiline': {
        command: s(`cat | bash -c "node src/main.js --multiline"`),
        extra: s('2x enter to end input')
    }, 'show help': {
        command: s('yarn show-help'),
        extra: s(`get all options available for 'node src/main.js'`)
    }
}
console.table(table)
