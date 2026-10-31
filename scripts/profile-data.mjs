export function summarize(user) {
  const repositories = user.repositories.nodes.filter(repo => !repo.isPrivate);
  const languages = new Map();
  const repositoryLanguages = new Map();
  for (const repo of repositories) {
    const primary = repo.primaryLanguage?.name || [...repo.languages.edges].sort((a,b)=>b.size-a.size)[0]?.node.name;
    if(primary) repositoryLanguages.set(primary,(repositoryLanguages.get(primary)||0)+1);
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
    createdAt: user.createdAt,
    stars: repositories.reduce((sum,repo)=>sum+(repo.stargazerCount||0),0),
    commits: user.contributionsCollection.totalCommitContributions || 0,
    pullRequests: user.contributionsCollection.totalPullRequestContributions || 0,
    issues: user.contributionsCollection.totalIssueContributions || 0,
    repositoryLanguages: [...repositoryLanguages].sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,percent:count/[...repositoryLanguages.values()].reduce((sum,n)=>sum+n,0)*100})),
    languages: [...languages].sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,bytes]) => ({name, percent: total ? bytes / total * 100 : 0})),
  };
}

export async function collect(token) {
  if (!token) throw new Error('GITHUB_TOKEN necessário para consultar os dados reais.');
  const query = `query($login:String!) { user(login:$login) {
    createdAt followers { totalCount }
    contributionsCollection { totalCommitContributions totalPullRequestContributions totalIssueContributions contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
    repositories(first:100, privacy:PUBLIC, ownerAffiliations:OWNER, isFork:false, orderBy:{field:UPDATED_AT,direction:DESC}) {
      totalCount nodes { isPrivate stargazerCount primaryLanguage { name } languages(first:20, orderBy:{field:SIZE,direction:DESC}) { edges { size node { name } } } }
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
