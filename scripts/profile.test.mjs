import test from 'node:test';
import assert from 'node:assert/strict';
import {summarize, collect} from './profile-data.mjs';
import {updateStats} from './readme-stats.mjs';

test('agrega linguagens por bytes e exclui dados privados', () => {
  const repo=(isPrivate,values)=>({isPrivate,languages:{edges:values.map(([name,size])=>({size,node:{name}}))}});
  const result=summarize({
    followers:{totalCount:7},
    contributionsCollection:{contributionCalendar:{totalContributions:42,weeks:[]}},
    repositories:{totalCount:2,nodes:[repo(false,[['Lua',30],['JavaScript',20]]),repo(false,[['Lua',50]]),repo(true,[['Secret',10000]])]},
  });
  assert.equal(result.contributions,42);
  assert.equal(result.repositories,2);
  assert.deepEqual(result.languages,[{name:'Lua',percent:80},{name:'JavaScript',percent:20}]);
});

test('perfil sem linguagens gera lista vazia, sem percentuais inválidos', () => {
  const result=summarize({followers:{totalCount:0},contributionsCollection:{contributionCalendar:{totalContributions:0,weeks:[]}},repositories:{totalCount:0,nodes:[]}});
  assert.deepEqual(result.languages,[]);
});

test('sem token não tenta fabricar estatísticas', async () => {
  await assert.rejects(collect(''),/GITHUB_TOKEN/);
});

test('atualização em Markdown preserva o restante do README e é idempotente',()=>{
  const data={contributions:1234,repositories:6,followers:32,languages:[{name:'TypeScript',percent:60.5}]};
  const original='Apresentação\n<!-- GITHUB-STATS:START -->\nantigo\n<!-- GITHUB-STATS:END -->\nProjetos';
  const updated=updateStats(original,data);
  assert.ok(updated.startsWith('Apresentação\n'));
  assert.ok(updated.endsWith('\nProjetos'));
  assert.match(updated,/\*\*1\.234\*\*/);
  assert.match(updated,/TypeScript 60,5%/);
  assert.equal(updateStats(updated,data),updated);
  assert.doesNotMatch(updated,/<img|<picture|!\[/);
});

test('marcadores inválidos impedem sobrescrita do conteúdo',()=>{
  const data={contributions:0,repositories:0,followers:0,languages:[]};
  assert.throws(()=>updateStats('Sem marcadores',data),/Marcadores/);
  assert.throws(()=>updateStats('<!-- GITHUB-STATS:START --><!-- GITHUB-STATS:END --><!-- GITHUB-STATS:START -->',data),/Marcadores/);
});
