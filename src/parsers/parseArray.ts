import { JSONSchema7 } from 'json-schema';
import { Refs } from '../Types.js';
import { parseSchema } from './parseSchema.js';

export const parseArray = (
    schema: JSONSchema7 & { type: 'array' },
    refs: Refs,
    is_input: boolean
) => {
    let r = !schema.items
        ? 'z.array(z.any())'
        : Array.isArray(schema.items)
        ? `z.tuple([${schema.items.map((v, i) =>
              parseSchema(
                  v,
                  { ...refs, path: [...refs.path, 'items', i] },
                  is_input
              )
          )}])`
        : `z.array(${parseSchema(
              schema.items,
              {
                  ...refs,
                  path: [...refs.path, 'items'],
              },
              is_input
          )})`;
    if (typeof schema.minItems === 'number') r += `.min(${schema.minItems})`;
    if (typeof schema.maxItems === 'number') r += `.max(${schema.maxItems})`;
    return r;
};
