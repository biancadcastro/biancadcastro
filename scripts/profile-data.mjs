export function summarize(user) {
  const repositories = user.repositories.nodes.filter(repo => !repo.isPrivate);
  const languages = new Map();
  for (const repo of repositories) {
    for (const {size, node} of repo.languages.edges) {
      languages.set(node.name, (languages.get(node.name) || 0) + size);
    }
  }
  const total = [...languages.values()].reduce((sum, value) => sum + value, 0);
  return {
    contributions: user.contributionsCollection.contributionCalendar.totalContributions,
    weeks: user.contributionsCollection.contributionCalendar.weeks,
    repositories: user.repositories.totalCount,
    followers: user.followers.totalCount,
    languages: [...languages].sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,bytes]) => ({name, percent: total ? bytes / total * 100 : 0})),
  };
}

export async function collect(token) {
  if (!token) throw new Error('GITHUB_TOKEN necessário para consultar os dados reais.');
  const query = `query($login:String!) { user(login:$login) {
    followers { totalCount }
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
    repositories(first:100, privacy:PUBLIC, ownerAffiliations:OWNER, isFork:false, orderBy:{field:UPDATED_AT,direction:DESC}) {
      totalCount nodes { isPrivate languages(first:20, orderBy:{field:SIZE,direction:DESC}) { edges { size node { name } } } }
    }
  } }`;
  const response = await fetch('https://api.github.com/graphql', {
    method:'POST',
    headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json', 'User-Agent':'bibis-profile'},
    body:JSON.stringify({query, variables:{login:'biancadcastro'}}),
    signal:AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`GitHub respondeu HTTP ${response.status}`);
  const body = await response.json();
  if (body.errors?.length || !body.data?.user) throw new Error('Consulta GitHub falhou; README anterior preservado.');
  return summarize(body.data.user);
}
