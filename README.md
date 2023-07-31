# json-schema-to-zod-piped

A wrapper around json-schema-to-zod for using stdin / stdout

help: `npx -y json-schema-to-zod-piped@latest --help`

```
Options:
  -h,  --help               Show help
  -o,  --output <string>    output module (with import & export) or schema only (choices: "module", "schema") (default: "schema")
  -ml, --multiline          enable multiline: continues parsing, where each input/output schema is seperated with \n\n, only works with --output schema (default: false)
  -n,  --name <string>      the name of the export (default: "default")
  -m,  --module <string>    whether to use cjs or esm (choices: "cjs", "esm") (default: "esm")
  -d,  --deref              Use json-schema-ref-parser to dereference the schema (default: false)
  -rc, --resolve-circulars  Whether to resolve circular references while dereferencing (default: true)
  -d,  --defaults           use default values in the schema, only works with --output module (default: true)
  -e,  --exit-on-error      exit on error instead of giving out z.any() (default: true)
```
