import { writeFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

import { generateOpenApiDocument } from '../src/api-docs/openapi';

const OUTPUT_FILE = path.resolve(__dirname, '..', 'api-documentation', 'openapi.yaml');

const document = generateOpenApiDocument();
const serializableDocument = JSON.parse(JSON.stringify(document));
const yamlDocument = yaml.stringify(serializableDocument, { aliasDuplicateObjects: false });

writeFileSync(OUTPUT_FILE, yamlDocument, 'utf8');

console.log(`OpenAPI document written to ${OUTPUT_FILE}`);
