#!/usr/bin/env node
import { resolveRefs } from 'json-refs';
import { jsonSchemaToZod, parseSchema } from './index.js';
import { z } from 'zod';
import { parser } from 'zod-opts';
import bsplit from 'buffer-split';
import Ajv from 'ajv';

let {
    output,
    multiline,
    name,
    module,
    deref,
    'resolve-circulars': resolveCirculars,
    defaults,
    'exit-on-error': exitOnError,
    input,
} = parser()
    .description(
        'json-schema-to-zod with stdin & stdout, stderr used for errors'
    )
    .options({
        output: {
            type: z.enum(['module', 'schema']).default('schema'),
            alias: 'o',
            description: 'output module (with import & export) or schema only',
        },
        multiline: {
            type: z.boolean().default(false),
            alias: 'ml',
            description:
                'enable multiline: continues parsing, seperated with \\n\\n',
        },
        name: {
            type: z
                .string()
                .regex(/^[a-zA-Z$][a-zA-Z0-9$]*$/)
                .default('default'),
            alias: 'n',
            description: 'the name of the export',
        },
        module: {
            type: z.enum(['cjs', 'esm']).default('esm'),
            description: 'whether to use cjs or esm',
            alias: 'm',
        },
        input: {
            type: z.boolean().default(false),
            description: 'If the schema should be in or output of json',
            alias: 'i',
        },
        deref: {
            type: z.boolean().default(false),
            description: 'Use json-schema-ref-parser to dereference the schema',
            alias: 'd',
        },
        'resolve-circulars': {
            type: z.boolean().default(true),
            alias: 'rc',
            description:
                'Whether to resolve circular references while dereferencing',
        },
        defaults: {
            type: z.boolean().default(true),
            alias: 'd',
            description: 'use default values in the schema',
        },
        'exit-on-error': {
            type: z.boolean().default(true),
            description: 'exit on error instead of giving out z.any()',
            alias: 'e',
        },
    })
    .parse(); // same with .parse(process.argv.slice(2))

const eprintln = (val: string = '') =>
    process.stderr.write('ERR: ' + val + '\n');
const println = (val: string = '') => process.stdout.write(val + '\n');

if (multiline && output !== 'schema') {
    eprintln(
        'WARN: multiline flag not working with --output module, switching to --output schema'
    );
    output = 'schema';
}

async function read(stream: NodeJS.ReadStream) {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
}

async function* readEach(stream: NodeJS.ReadStream) {
    const splitter = Buffer.from('\n\n', 'utf8');
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
        if (buffer.includes('\n\n')) {
            const splitted = bsplit(buffer, splitter);
            buffer = splitted.pop()!;
            yield* splitted.map((v) => v.toString('utf8'));
        }
    }
}

async function parse(data: any, is_input: boolean) {
    if (deref) {
        data = await resolveRefs(data, { resolveCirculars });
    }

    const avj = new Ajv.default({ allErrors: true });
    const result = await avj.validateSchema(data);
    if (!result) {
        if (exitOnError) {
            throw new Error('Invalid schema');
        } else {
            eprintln('Invalid schema');
            data = {};
        }
    }

    if (output === 'schema') {
        return parseSchema(
            data,
            {
                module,
                name,
                path: [],
                seen: new Map(),
                withoutDefaults: !defaults,
            },
            is_input
        );
    } else {
        return jsonSchemaToZod(
            data,
            {
                module,
                name,
                withoutDefaults: !defaults,
            },
            is_input
        );
    }
}

if (multiline) {
    for await (let jsonRaw of readEach(process.stdin)) {
        if (jsonRaw.trim() === ';;exit') {
            break;
        }

        try {
            let is_input;
            if (jsonRaw.startsWith(';;true;;')) {
                jsonRaw = jsonRaw.replace(';;true;;', '');
                is_input = true;
            } else if (jsonRaw.startsWith(';;false;;')) {
                jsonRaw = jsonRaw.replace(';;false;;', '');
                is_input = false;
            } else {
                is_input = input;
            }

            const json = JSON.parse(jsonRaw);
            println((await parse(json, is_input)).trimEnd());
        } catch (e) {
            if (exitOnError) {
                throw e;
            }

            if (e instanceof Error) {
                eprintln(e.message.trim());
            } else {
                eprintln('Unknown error');
            }
            println(await parse({}, false));
        } finally {
            println();
        }
    }
} else {
    const jsonRaw = await read(process.stdin);
    try {
        const json = JSON.parse(jsonRaw);
        println(await parse(json, input));
    } catch (e) {
        if (exitOnError) {
            throw e;
        }

        if (e instanceof Error) {
            eprintln(e.message.trim());
        } else {
            eprintln('Unknown error');
        }
        println(await parse({}, input));
    }
}

export default 'this is a cli package, please use json-schema-to-zod as the libary' as const;
