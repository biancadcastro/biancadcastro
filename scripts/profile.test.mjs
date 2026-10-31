import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {summarize,collect} from './profile-data.mjs';
import {renderMetrics,renderLanguages} from './svg-stats.mjs';

const repo=(isPrivate,values)=>({isPrivate,stargazerCount:2,languages:{edges:values.map(([name,size])=>({size,node:{name}}))}});
const fixture={
  createdAt:'2020-09-01T00:00:00Z',followers:{totalCount:7},
  contributionsCollection:{totalCommitContributions:31,totalPullRequestContributions:2,totalIssueContributions:1,contributionCalendar:{totalContributions:42,weeks:[{contributionDays:[{date:'2026-10-25',contributionCount:42}]}]}},
  repositories:{totalCount:2,nodes:[repo(false,[['Lua',30],['JavaScript',20]]),repo(false,[['Lua',50]]),repo(true,[['Secret',10000]])]},
};

test('agrega dados reais e exclui repositórios privados',()=>{
  const result=summarize(fixture);
  assert.equal(result.contributions,42);
  assert.equal(result.stars,4);
  assert.equal(result.commits,31);
  assert.deepEqual(result.languages,[{name:'Lua',percent:80},{name:'JavaScript',percent:20}]);
  assert.deepEqual(result.repositoryLanguages,[{name:'Lua',percent:100}]);
});

test('perfil sem linguagens não fabrica percentuais',()=>{
  const result=summarize({...fixture,repositories:{totalCount:0,nodes:[]}});
  assert.deepEqual(result.languages,[]);
  assert.deepEqual(result.repositoryLanguages,[]);
});

test('sem token a geração falha antes de alterar as imagens',async()=>{
  await assert.rejects(collect(''),/GITHUB_TOKEN/);
});

test('renderiza métricas no tema original, com valores e gráfico reais',async()=>{
  const template=await fs.readFile(new URL('../assets/templates/metrics.svg',import.meta.url),'utf8');
  const svg=renderMetrics(template,summarize(fixture),new Date('2026-10-30T12:00:00Z'));
  assert.match(svg,/#fdf1f4/);
  assert.match(svg,/42 contribuições/);
  assert.match(svg,/2 repositórios públicos/);
  assert.match(svg,/GitHub há 6 anos/);
  assert.doesNotMatch(svg,/1\.72k|C34 137/);
});

test('gráficos distinguem repositórios e código, sem inventar estatísticas por commit',async()=>{
  const template=await fs.readFile(new URL('../assets/templates/languages.svg',import.meta.url),'utf8');
  const svg=renderLanguages(template,summarize(fixture));
  assert.match(svg,/Lua 100\.0%/);
  assert.match(svg,/Lua 80\.0%/);
  assert.match(svg,/JavaScript 20\.0%/);
  assert.match(svg,/por código/);
  assert.doesNotMatch(svg,/por commit|Secret/);
});
