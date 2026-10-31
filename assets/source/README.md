As imagens são as mesmas do portfólio Bibis, usadas na apresentação do perfil.

Fontes: Pixelify Sans e Nunito, sob a SIL Open Font License. Textos são convertidos em contornos antes da rasterização para preservar a tipografia no GitHub.

O workflow gera apenas os arquivos de `assets/generated/`, usando dados reais da API do GitHub. O token é recebido por variável de ambiente e nunca é salvo. A distribuição de linguagens considera até 100 repositórios públicos próprios sem forks, ponderada pelos bytes de código retornados pela API.

Os painéis são gerados nos temas claro e escuro com uma única consulta. O README seleciona a imagem pelo tema do visitante usando `picture`, com tema claro como alternativa padrão. Apresentação e descrições dos projetos usam texto nativo do GitHub para manter a leitura em telas menores.
