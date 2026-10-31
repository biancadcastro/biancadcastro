import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {collect} from './profile-data.mjs';
import {renderMetrics,renderLanguages} from './svg-stats.mjs';

const root=new URL('../',import.meta.url);
const data=await collect(process.env.GITHUB_TOKEN);
const metrics=renderMetrics(await fs.readFile(new URL('assets/templates/metrics.svg',root),'utf8'),data);
const languages=renderLanguages(await fs.readFile(new URL('assets/templates/languages.svg',root),'utf8'),data);
await fs.writeFile(fileURLToPath(new URL('assets/metrics-custom.svg',root)),metrics);
await fs.writeFile(fileURLToPath(new URL('assets/languages-custom.svg',root)),languages);
console.log('Estatísticas atualizadas no visual original do README.');
