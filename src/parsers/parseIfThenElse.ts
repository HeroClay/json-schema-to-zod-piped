import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { Refs } from '../Types.js';
import { parseSchema } from './parseSchema.js';

export const parseIfThenElse = (
    schema: JSONSchema7 & {
        if: JSONSchema7Definition;
        then: JSONSchema7Definition;
        else: JSONSchema7Definition;
    },
    refs: Refs,
    is_input: boolean
): string => {
    const $if = parseSchema(
        schema.if,
        { ...refs, path: [...refs.path, 'if'] },
        is_input
    );
    const $then = parseSchema(
        schema.then,
        {
            ...refs,
            path: [...refs.path, 'then'],
        },
        is_input
    );
    const $else = parseSchema(
        schema.else,
        {
            ...refs,
            path: [...refs.path, 'else'],
        },
        is_input
    );
    return `z.union([${$then},${$else}]).superRefine((value,ctx) => {
  const result = ${$if}.safeParse(value).success
    ? ${$then}.safeParse(value)
    : ${$else}.safeParse(value);
  if (!result.success) {
    result.error.errors.forEach((error) => ctx.addIssue(error))
  }
})`;
};
