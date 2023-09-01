import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { Refs } from '../Types.js';
import { parseSchema } from './parseSchema.js';

export const parseOneOf = (
    schema: JSONSchema7 & { oneOf: JSONSchema7Definition[] },
    refs: Refs,
    is_input: boolean
) => {
    return schema.oneOf.length
        ? schema.oneOf.length === 1
            ? parseSchema(
                  schema.oneOf[0],
                  {
                      ...refs,
                      path: [...refs.path, 'oneOf', 0],
                  },
                  is_input
              )
            : `z.any().superRefine((x, ctx) => {
    const schemas = [${schema.oneOf.map((schema, i) =>
        parseSchema(
            schema,
            {
                ...refs,
                path: [...refs.path, 'oneOf', i],
            },
            is_input
        )
    )}];
    const errors = schemas.reduce(
      (errors: z.ZodError[], schema) =>
        ((result) => ("error" in result ? [...errors, result.error] : errors))(
          schema.safeParse(x)
        ),
      []
    );
    if (schemas.length - errors.length !== 1) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema",
      });
    }
  })`
        : 'z.any()';
};
