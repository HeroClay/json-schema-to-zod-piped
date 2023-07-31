import { resolveRefs } from "json-refs";
import { jsonSchemaToZod, parseSchema } from "json-schema-to-zod";
import { z } from "zod";
import { parser } from "zod-opts";
import bsplit from "buffer-split";
import Ajv from "ajv";

let { output, multiline, name, module, deref, 'resolve-circulars': resolveCirculars, defaults, 'exit-on-error': exitOnError } =
	parser()
        .description('json-schema-to-zod with stdin & stdout, stderr used for errors')
		.options({
			output: {
				type: z.enum(["module", "schema"]).default("schema"),
				alias: "o",
				description:
					"output module (with import & export) or schema only",
			},
			multiline: {
				type: z.boolean().default(false),
				alias: "ml",
				description:
					"enable multiline: continues parsing, where each input/output schema is seperated with \\n\\n, only works with --output schema",
			},
			name: {
				type: z
					.string()
					.regex(/^[a-zA-Z$][a-zA-Z0-9$]*$/)
					.default('default'),
				alias: "n",
				description: "the name of the export",
			},
			module: {
				type: z.enum(["cjs", "esm"]).default("esm"),
				description: "whether to use cjs or esm",
				alias: "m",
			},
			deref: {
				type: z.boolean().default(false),
				description:
					"Use json-schema-ref-parser to dereference the schema",
				alias: "d",
			},
			'resolve-circulars': {
				type: z.boolean().default(true),
				alias: "rc",
				description:
					"Whether to resolve circular references while dereferencing",
			},
			defaults: {
				type: z.boolean().default(true),
				alias: "d",
				description:
					"use default values in the schema, only works with --output module",
			},
            'exit-on-error': {
                type: z.boolean().default(true),
                description: "exit on error instead of giving out z.any()",
                alias: "e"
            }
		})
		.parse(); // same with .parse(process.argv.slice(2))

const eprintln = (val: string = "") => process.stderr.write('ERR: ' + val + "\n");
const println = (val: string = "") => process.stdout.write(val + "\n");

if (multiline && output !== "schema") {
	eprintln(
		"WARN: multiline flag not working with --output module, ignoring it"
	);
	multiline = false;
}
if (name && output !== "module") {
	eprintln("WARN: name flag ignored when using --output schema");
}

async function read(stream: NodeJS.ReadStream) {
	const chunks = [];
	for await (const chunk of stream) chunks.push(chunk);
	return Buffer.concat(chunks).toString("utf8");
}

async function* readEach(stream: NodeJS.ReadStream) {
	const splitter = Buffer.from("\n\n", "utf8");
	let buffer = Buffer.alloc(0);
	for await (const chunk of stream) {
		buffer = Buffer.concat([buffer, chunk]);
		if (buffer.includes("\n\n")) {
			const splitted = bsplit(buffer, splitter);
			buffer = splitted.pop()!;
			yield* splitted.map((v) => v.toString("utf8"));
		}
	}
}

async function parse(data: any) {
    if (deref) {
		data = await resolveRefs(data, { resolveCirculars });
	}
    
    const avj = new Ajv.default({ allErrors: true });
    const result = await avj.validateSchema(data);
    if (!result) {
        if (exitOnError) {
            throw new Error("Invalid schema");
        } else {
            eprintln("Invalid schema");
            data = {}
        }
    }

	if (output === "schema") {
		return parseSchema(data, {
            module,
            name,
            path: [],
            seen: new Map(),
            withoutDefaults: !defaults,
        });
	} else {
		return jsonSchemaToZod(data, {
			module,
			name,
			withoutDefaults: !defaults,
		});
	}
}

if (multiline) {
	for await (const jsonRaw of readEach(process.stdin)) {
        try {
            const json = JSON.parse(jsonRaw);
            println((await parse(json)).trimEnd());
        } catch (e) {
            if (exitOnError) {
                throw e;
            }

            if (e instanceof Error) {
                eprintln(e.message.trim());
            } else {
                eprintln("Unknown error");
            }
            println(await parse({}));
        } finally {
            println()
        }
	}
} else {
	const jsonRaw = await read(process.stdin);
    try {
        const json = JSON.parse(jsonRaw);
        println(await parse(json));
    } catch (e) {
        if (exitOnError) {
            throw e;
        }

        if (e instanceof Error) {
            eprintln(e.message.trim());
        } else {
            eprintln("Unknown error");
        }
        println(await parse({}));
    }
}

export default 'this is a cli package, please use json-schema-to-zod as the libary' as const;
