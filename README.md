# json-schema-to-zod-piped

A wrapper around [json-schema-to-zod](https://www.npmjs.com/package/json-schema-to-zod) for using stdin / stdout

help: `npx -y json-schema-to-zod-piped@latest --help`

```
Options:
  -h,  --help               Show help
  -o,  --output <string>    output module (with import & export) or schema only (choices: "module", "schema") (default: "schema")
  -ml, --multiline          enable multiline: continues parsing, seperated with \n\n (default: false)
  -n,  --name <string>      the name of the export (default: "default")
  -m,  --module <string>    whether to use cjs or esm (choices: "cjs", "esm") (default: "esm")
  -d,  --deref              Use json-schema-ref-parser to dereference the schema (default: false)
  -rc, --resolve-circulars  Whether to resolve circular references while dereferencing (default: true)
  -d,  --defaults           use default values in the schema (default: true)
  -e,  --exit-on-error      exit on error instead of giving out z.any() (default: true)
```

## some usages for bash:

### single line

press enter + type EOF + enter again to end input

`cat << EOF | npx json-schema-to-zod-piped@latest`

### multiline

2x enter to end input, CTRL-C to exit

`cat | npx json-schema-to-zod-piped@latest --multiline`
