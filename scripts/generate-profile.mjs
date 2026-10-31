import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {collect} from './profile-data.mjs';
import {updateStats} from './readme-stats.mjs';

const filename=fileURLToPath(new URL('../README.md',import.meta.url));
const original=await fs.readFile(filename,'utf8');
const data=await collect(process.env.GITHUB_TOKEN);
const updated=updateStats(original,data);
if(updated!==original) await fs.writeFile(filename,updated);
console.log('Estatísticas reais atualizadas em Markdown no README.');
