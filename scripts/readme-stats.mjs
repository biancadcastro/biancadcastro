const start='<!-- GITHUB-STATS:START -->';
const end='<!-- GITHUB-STATS:END -->';

export function updateStats(readme,data) {
  const begin=readme.indexOf(start);
  const finish=readme.indexOf(end);
  if(begin<0 || finish<begin || readme.indexOf(start,begin+start.length)!==-1 || readme.indexOf(end,finish+end.length)!==-1) {
    throw new Error('Marcadores de estatísticas ausentes ou duplicados; README preservado.');
  }
  const integer=value=>value.toLocaleString('pt-BR');
  const escape=value=>String(value).replaceAll('|','\\|').replaceAll('\n',' ');
  const languages=data.languages.length
    ? '**Linguagens:** '+data.languages.map(({name,percent})=>`${escape(name)} ${percent.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`).join(' · ')+'.'
    : 'Nenhuma linguagem pública disponível no momento.';
  const content=[
    '| Contribuições no último ano | Repositórios públicos próprios | Seguidores |',
    '| :---: | :---: | :---: |',
    `| **${integer(data.contributions)}** | **${integer(data.repositories)}** | **${integer(data.followers)}** |`,
    '', languages,
  ].join('\n');
  return readme.slice(0,begin+start.length)+'\n\n'+content+'\n\n'+readme.slice(finish);
}
