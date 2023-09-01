import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { Refs } from '../Types.js';
import { parseSchema } from './parseSchema.js';

export const parseNot = (
    schema: JSONSchema7 & { not: JSONSchema7Definition },
    refs: Refs,
    is_input: boolean
) => {
    return `z.any().refine((value) => !${parseSchema(
        schema.not,
        {
            ...refs,
            path: [...refs.path, 'not'],
        },
        is_input
    )}.safeParse(value).success, "Invalid input: Should NOT be valid against schema")`;
};
