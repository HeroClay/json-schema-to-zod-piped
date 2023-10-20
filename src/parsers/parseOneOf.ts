import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { Refs } from '../Types.js';
import { parseSchema } from './parseSchema.js';

export const parseOneOf = (
    schema: JSONSchema7 & { oneOf: JSONSchema7Definition[] },
    refs: Refs,
    is_input: boolean
) => {
    if (!schema.oneOf.length) {
        return 'z.any()';
    }
    if (schema.oneOf.length === 1) {
        return parseSchema(
            schema.oneOf[0],
            {
                ...refs,
                path: [...refs.path, 'oneOf', 0],
            },
            is_input
        );
    }

    let keys: string[] = [];
    for (const s of schema.oneOf) {
        if (
            !(
                s instanceof Object &&
                s.type === 'object' &&
                s.properties !== undefined
            )
        ) {
            keys = [];
            break;
        }

        if (!keys.length) {
            keys = Object.keys(s.properties);
        } else {
            for (const key of keys) {
                if (!(key in s.properties)) {
                    const index = keys.indexOf(key);
                    keys.splice(index, 1);
                } else {
                    const schema = s.properties[key];
                    if (
                        !(
                            schema instanceof Object &&
                            schema.type === 'string' &&
                            Array.isArray(schema.enum) &&
                            schema.enum.length === 1
                        )
                    ) {
                        const index = keys.indexOf(key);
                        keys.splice(index, 1);
                    }
                }
            }
        }
    }
    const isDiscriminated = keys.length === 1;

    return `z.${
        isDiscriminated
            ? `discriminatedUnion(${JSON.stringify(keys[0])}, `
            : 'union('
    }[${schema.oneOf
        .map((schema, i) =>
            parseSchema(
                schema,
                {
                    ...refs,
                    path: [...refs.path, 'oneOf', i],
                },
                is_input
            )
        )
        .join()}])`;
};
