import { JSONSchema7 } from 'json-schema';
import { Refs } from '../Types.js';
import { omit } from '../utils/omit.js';
import { parseSchema } from './parseSchema.js';

/**
 * For compatibility with open api 3.0 nullable
 */
export const parseNullable = (
    schema: JSONSchema7 & { nullable: true },
    refs: Refs,
    is_input: boolean
) => {
    return `${parseSchema(
        omit(schema, 'nullable'),
        refs,
        is_input
    )}.nullable()`;
};
