import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';
import {collect} from './profile-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets/source');
const output = path.join(root, 'assets/generated');
const fonts = {
  pixel:opentype.loadSync(path.join(source,'pixelify.ttf')),
  body:opentype.loadSync(path.join(source,'nunito.ttf')),
};
const c = {bg:'#1b111d', surface:'#291a2b', pink:'#f493b8', ink:'#ffedf4', muted:'#c5a3bc', line:'#67425d'};
const text = (value,x,y,size=20,color=c.ink,font='body') => {
  const p = fonts[font].getPath(String(value),x,y,size);
  p.fill=color;
  return p.toSVG(2);
};
const rect = (x,y,w,h,fill,rx=0,stroke='none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x,y,w) => rect(x,y,w,1,c.line);
const heart = (x,y,size=1) => `<path transform="translate(${x} ${y}) scale(${size})" d="M0 3h3V0h6v3h3V0h6v3h3v6h-3v3h-3v3h-3v3H9v-3H6v-3H3V9H0Z" fill="${c.pink}"/>`;
const frame = (height,content) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}">${rect(0,0,1200,height,c.bg)}${content}</svg>`;
const image = async (file,x,y,width,height) => {
  const bytes=await sharp(path.join(source,file)).resize(width,height,{fit:'cover'}).png().toBuffer();
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" href="data:image/png;base64,${bytes.toString('base64')}"/>`;
};
const png = async (name,svg) => {
  const bytes=await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(path.join(output,name),bytes);
};

// Fetch before replacing any image. A failed API request must never publish made-up values.
const data = await collect(process.env.GITHUB_TOKEN);
await fs.mkdir(output,{recursive:true});

let hero = await image('studio.png',0,0,1200,675);
hero += `<defs><linearGradient id="fade"><stop offset="0" stop-color="${c.bg}"/><stop offset=".36" stop-color="${c.bg}" stop-opacity=".92"/><stop offset=".64" stop-color="${c.bg}" stop-opacity=".1"/><stop offset="1" stop-color="${c.bg}" stop-opacity="0"/></linearGradient><linearGradient id="bottom" x2="0" y2="1"><stop offset=".7" stop-color="${c.bg}" stop-opacity="0"/><stop offset="1" stop-color="${c.bg}"/></linearGradient></defs>`;
hero += rect(0,0,1200,675,'url(#fade)')+rect(0,0,1200,675,'url(#bottom)');
hero += text('Bibis',48,64,42,c.ink,'pixel')+heart(163,42,.75);
hero += text('Design, 3D e desenvolvimento.',48,96,17,c.muted);
hero += rect(48,159,188,31,c.surface,4,c.line)+heart(60,169,.5)+text('Meu universo criativo',80,180,14,c.pink);
hero += text('Crio para',48,267,76,c.ink,'pixel')+text('GTA e FiveM.',48,343,76,c.ink,'pixel');
hero += text('Bianca de Castro',48,391,31,c.pink,'pixel');
hero += text('Veículos, roupas e texturas para o jogo.',48,436,19,c.muted);
hero += text('Ferramentas para dar vida aos projetos.',48,466,19,c.muted);
hero += rect(52,505,227,52,'#100a14',4)+rect(48,501,227,52,'#d86d9b',4,'#ffbcd7')+rect(50,503,223,3,'#fba5c8');
hero += text('Ver meu portfólio',66,534,22,c.bg,'pixel');
hero += line(48,611,1104)+text('GTA / FiveM',48,649,23,c.muted,'pixel')+heart(267,633,.6)+text('Design & texturas',326,649,23,c.muted,'pixel')+heart(584,633,.6)+text('Modelagem 3D',650,649,23,c.muted,'pixel')+heart(871,633,.6)+text('Desenvolvimento',927,649,23,c.muted,'pixel');
await png('hero.png',frame(675,hero));

let activity=text('Um pouco do meu GitHub',48,65,43,c.ink,'pixel')+heart(1123,42,1.1);
activity+=text('Código, constância e projetos que ganham vida.',48,100,18,c.muted);
const stats=[[data.contributions.toLocaleString('pt-BR'),'Contribuições no último ano'],[String(data.repositories),'Repositórios públicos próprios'],[String(data.followers),'Seguidores no GitHub']];
stats.forEach(([value,label],i)=>{const x=48+i*375;activity+=rect(x,137,354,110,c.surface,8,c.line)+text(value,x+22,192,43,c.pink,'pixel')+text(label,x+22,224,17,c.muted);});
activity+=text('Cada quadradinho, um dia de criação.',48,292,25,c.ink,'pixel');
const weeks=data.weeks;
const colors=[c.surface,'#543047','#81516e','#c46c98',c.pink];
const max=Math.max(1,...weeks.flatMap(w=>w.contributionDays.map(d=>d.contributionCount)));
weeks.forEach((week,w)=>week.contributionDays.forEach(day=>{
 const row=new Date(day.date+'T12:00:00Z').getUTCDay();
 const level=day.contributionCount===0?0:Math.min(4,Math.ceil(day.contributionCount/max*4));
 activity+=rect(48+w*20.8,315+row*21,16,16,colors[level],3);
}));
activity+=text('Menos',943,490,13,c.muted);
colors.forEach((color,i)=>activity+=rect(990+i*23,477,16,16,color,3));
activity+=text('Mais',1110,490,13,c.muted);
activity+=line(48,516,1104)+text('Linguagens nos meus projetos',48,562,30,c.ink,'pixel');
const shades=['#f493b8','#d86d9b','#b17cb2','#c5a3bc','#81516e'];
let barX=48;
data.languages.forEach((lang,i)=>{
 const width=1104*lang.percent/100;
 activity+=rect(barX,585,width,12,shades[i]);barX+=width;
 const x=48+i*222;
 activity+=rect(x,623,10,10,shades[i],2)+text(lang.name,x+18,634,16,c.ink)+text(lang.percent.toFixed(1)+'%',x+18,660,15,c.muted);
});
if(!data.languages.length) activity+=text('Sem linguagens públicas disponíveis.',48,630,18,c.muted);
activity+=text('Dados públicos · últimos 100 repositórios próprios, sem forks',48,709,13,c.muted);
await png('activity.png',frame(740,activity));

let projects=text('Ferramentas que eu crio',48,62,43,c.ink,'pixel')+text('Do processo criativo à organização das entregas.',48,97,18,c.muted);
for (const [i,file,title,description] of [[0,'redhorn-studio.png','RedHorn Studio','Peças, texturas e projetos em um só lugar.'],[1,'wins-review.png','Wins Review','Histórico de trabalho e revisão de entregas.']]) {
 const x=48+i*567;
 projects+=rect(x,128,537,302,c.surface,8,c.line);
 projects+=await image(file,x+9,137,519,202);
 projects+=text(title,x+20,377,28,c.pink,'pixel')+text(description,x+20,408,17,c.muted);
}
projects+=line(48,469,1104)+text('Bibis',48,517,30,c.pink,'pixel')+text('Feito com carinho, café e muitos detalhes.',155,515,17,c.muted)+heart(1125,496,.9);
await png('projects.png',frame(550,projects));
console.log('3 painéis gerados com dados reais do GitHub.');
