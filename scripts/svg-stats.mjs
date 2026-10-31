const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const number=value=>value.toLocaleString('pt-BR');
const text=(x,y,value,size=13,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="#4a3540" ${extra}>${escape(value)}</text>`;

export function renderMetrics(template,data,now=new Date()) {
  const created=new Date(data.createdAt);
  let years=now.getUTCFullYear()-created.getUTCFullYear();
  if(now.toISOString().slice(5,10)<created.toISOString().slice(5,10)) years--;
  let svg=template.replace('1.72k contribuições',`${number(data.contributions)} contribuições`)
    .replace('6 repositórios públicos',`${number(data.repositories)} repositórios públicos`)
    .replace('GitHub há 5 anos',`GitHub há ${years} ${years===1?'ano':'anos'}`);
  const values=data.weeks.map(week=>week.contributionDays.reduce((sum,day)=>sum+day.contributionCount,0));
  const peak=Math.max(1,...values);
  const points=values.map((value,i)=>`${(i*440/Math.max(1,values.length-1)).toFixed(1)} ${(141-value/peak*120).toFixed(1)}`);
  const path=points.length?'M'+points.join(' L'):'M0 141 L440 141';
  let chart='<g transform="translate(350 61)"><text x="0" y="0" font-size="12" fill="#a98993">contribuições no último ano</text>';
  for(const y of [45,93,141]) chart+=`<line x1="0" y1="${y}" x2="440" y2="${y}" stroke="#ecd9df"/>`;
  chart+=`<path d="${path} L440 141 L0 141Z" fill="#f2bfd0"/><path d="${path}" fill="none" stroke="#c9678a" stroke-width="3" stroke-linecap="round"/>`;
  for(let i=0;i<5;i++) {
    const week=data.weeks[Math.round(i*(data.weeks.length-1)/4)];
    if(week?.contributionDays[0]) {
      const date=new Date(week.contributionDays[0].date+'T12:00:00Z');
      chart+=text(i*104,168,date.toLocaleDateString('pt-BR',{month:'short',timeZone:'UTC'}).replace('.',''),12);
    }
  }
  chart+='</g>\n</svg>';
  return svg.slice(0,svg.indexOf('<g transform="translate(350 61)">'))+chart;
}

function donut(x,title,values) {
  const grouped=values.slice(0,2);
  const rest=values.length ? Math.max(0,100-grouped.reduce((sum,lang)=>sum+lang.percent,0)) : 0;
  if(rest>0) grouped.push({name:'Outras',percent:rest});
  const colors=['#c9678a','#8f6372','#e8a0b4'];
  let out=`<g transform="translate(${x} 55)"><rect width="246" height="230" rx="8" fill="#fae4ea"/>${text(18,29,'$ '+title,14,'font-weight="700"')}<circle cx="123" cy="105" r="50" fill="none" stroke="#ecd9df" stroke-width="20"/>`;
  let offset=0;
  const circumference=2*Math.PI*50;
  grouped.forEach((lang,i)=>{
    const length=circumference*lang.percent/100;
    out+=`<circle cx="123" cy="105" r="50" fill="none" stroke="${colors[i]}" stroke-width="20" stroke-dasharray="${length} ${circumference-length}" stroke-dashoffset="${-offset}" transform="rotate(-90 123 105)"/>`;
    const y=178+i*19;
    out+=`<rect x="20" y="${y-10}" width="10" height="10" rx="2" fill="${colors[i]}"/>`+text(39,y,`${lang.name} ${lang.percent.toFixed(1)}%`,12);
    offset+=length;
  });
  if(!grouped.length) out+=text(20,192,'Sem dados públicos',12);
  return out+'</g>';
}

export function renderLanguages(template,data) {
  let svg=template.slice(0,template.indexOf('<g transform="translate(20 55)">'));
  svg=svg.replace('Distribuição de JavaScript e TypeScript e estatísticas gerais','Linguagens por repositório e bytes de código; estatísticas do último ano');
  svg+=donut(20,'por repositório',data.repositoryLanguages)+donut(287,'por código',data.languages);
  svg+='<g transform="translate(554 55)"><rect width="246" height="230" rx="8" fill="#fae4ea"/>'+text(18,29,'$ stats',14,'font-weight="700"');
  [['star','stars',data.stars],['commit','commits / ano',data.commits],['branch','PRs / ano',data.pullRequests],['issue','issues / ano',data.issues],['arrow','contribuições',data.contributions]].forEach(([icon,label,value],i)=>{
    const y=70+i*34;
    svg+=`<use href="#${icon}" x="18" y="${y-14}"/>`+text(42,y,label,12)+text(226,y,number(value),13,'text-anchor="end"');
  });
  return svg+'</g></svg>';
}
