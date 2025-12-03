Somatva Frontend

Sistema de Monitoramento e Planejamento de Manutenções, desenvolvido como projeto somativo do SENAI. O sistema é um painel completo para controle de setores, máquinas e manutenções, com dashboard, calendário, listagens, filtros e autenticação simples.

Visão geral da arquitetura

O repositório é dividido em duas partes principais:

Pasta backend
Aplicação Node com Express e Mongoose. Exponibiliza uma API REST em http://localhost:4000/api
, conectada a um banco MongoDB (local ou Atlas). Faz o seed inicial das coleções, define os esquemas de Setor, Máquina, Manutenção e Usuário e entrega todas as rotas usadas pelo front.

Pasta projeto_somativa
Aplicação front end em Vue 3 com Vite, Pinia, Axios e Tailwind. Fornece as telas de Login, Dashboard, Manutenções, Detalhe da Manutenção, Máquinas, Setores e Calendário. Consome a API do backend em http://localhost:4000/api
.

Fluxo básico de uso

O usuário acessa a tela de login, entra com um dos usuários padrão, é redirecionado para o Dashboard e, a partir daí, consegue navegar pelas demais telas, cadastrar setores, máquinas, registrar e acompanhar manutenções, visualizar indicadores no painel e enxergar as manutenções no calendário mensal.

Requisitos de ambiente

Para rodar o projeto é necessário ter instalado:

Node e npm
Um banco MongoDB. Em desenvolvimento pode ser usado o MongoDB Atlas gratuito ou uma instância local.
Navegador moderno para acessar o front.

Configuração e execução do backend

A pasta backend contém o serviço de API. Os arquivos mais importantes são:

server.js
Arquivo de entrada da aplicação. Carrega as variáveis de ambiente com dotenv, cria a aplicação Express, ativa o CORS permitindo o front em http://localhost:5173
, habilita o parse de JSON, registra as rotas e só inicia o servidor depois que a conexão com o banco estiver pronta. Lê a porta a partir da variável PORT e o domínio permitido de CORS a partir da variável CORS_ORIGIN. No final, roda initDb, e ao concluir a conexão com o Mongo, sobe o servidor na porta configurada. Em caso de erro na conexão, exibe o erro e encerra o processo.

models/db.js
Responsável por toda a integração com o MongoDB via Mongoose. Faz a conexão usando a variável de ambiente MONGO_URI (por exemplo, uma URL do MongoDB Atlas) ou, se ela não existir, usa um banco local em mongodb://localhost:27017/somativa. Define as opções de conexão, como criação automática de índices. Cria um esquema de contador numérico chamado counters para gerar IDs sequenciais independentes para cada coleção lógica (setores, máquinas, manutenções e usuários). Esse esquema é usado pela função getNextSeq, que recebe o nome da sequência e retorna o próximo número disponível.

Dentro desse arquivo também são definidos os esquemas de negócio:

SetorSchema. Representa um setor da fábrica. Possui id numérico sequencial, nome obrigatório e é salvo na coleção sectors.
MaquinaSchema. Representa uma máquina. Possui id numérico, nome, setorId (ligação com o setor), status da máquina com valores ATIVA, PARADA ou MANUTENCAO e, opcionalmente, um número de série. Usa timestamps para createdAt e updatedAt e é armazenado na coleção maquinas.
ManutencaoSchema. Representa uma manutenção. Possui id numérico, maquinaId, tipo (por exemplo, PREVENTIVA ou CORRETIVA), campos de descrição, datas agendada e realizada, status (PENDENTE, EM_ANDAMENTO, ATRASADA, CONCLUIDA), prioridade numérica e timestamps.
UserSchema. Representa um usuário autenticado. Possui id numérico, nome, email, password em texto claro (simplificado para aula) e um campo role (admin ou user).

Após definir os esquemas, o arquivo compila os Models Mongoose para Setor, Maquina, Manutencao e User e implementa a função seedIfEmpty. Essa função é chamada ao iniciar o banco. Ela verifica se já existem dados e, caso as coleções estejam vazias, insere dados iniciais:

Cria dois usuários:
Admin com email admin arroba smpm ponto local e senha 123456, papel admin.
Operador com email oper arroba smpm ponto local e senha 123456, papel user.

Cria alguns setores, por exemplo Produção, Logística e Usinagem, com IDs gerados por getNextSeq.

Cria algumas máquinas associadas aos setores, por exemplo Prensa Hidráulica, Esteira XZ e Torno CNC, com estados diferentes.

Cria algumas manutenções de exemplo, com datas agendadas e realizadas distribuídas em torno da data atual e com diferentes status, para que o dashboard, a lista e o calendário já tenham conteúdo logo na primeira execução.

Por fim, o arquivo expõe initDb, que faz a conexão com o Mongo, roda o seed, e exporta os Models e a função getNextSeq para serem usados nas demais camadas.

models SetorBd.js, MaquinaBd.js, manutencoesBd.js, UserBd.js, authBd.js
Esses arquivos são a camada de dados usada pelas rotas, encapsulando o uso direto dos Models Mongoose.

SetorBd implementa funções para listar todos os setores ordenados por nome, buscar um setor por id, criar um novo setor usando getNextSeq para gerar o id, atualizar o nome de um setor e remover um setor por id.

MaquinaBd implementa listagem de máquinas, com opção de filtrar pelo setorId, busca por id, criação de máquina com setorId, nome, status e série, atualização parcial dos campos e remoção.

manutencoesBd implementa listagem de manutenções com filtros, busca por id, criação, atualização completa, atualização parcial via patch (por exemplo, para mover a data) e remoção. Também centraliza a normalização de campos como datas e status.

UserBd implementa findByEmailPassword, que encontra um usuário pelo par email e senha retornando os dados sem o campo password, e list, que retorna todos os usuários cadastrados para debug.

authBd expõe uma função login que utiliza UserBd para validar email e senha.

models toastBd.js e uiBd.js estão reservados para expansões, mas não têm lógica relevante no estado atual do projeto.

routers authRoute.js
Responsável pela autenticação simples usada pelo front. Define a rota GET em /api/users. Recebe email e password pela query string, usa a função login da camada de autenticação, e devolve um array. Se as credenciais forem inválidas ou vazias, devolve um array vazio. Se encontrar um usuário, devolve um array contendo esse usuário sem o campo senha. Essa resposta é consumida pelo front para criar a sessão. Também há uma rota opcional GET em /api/_users que lista os usuários cadastrados sem a senha, pensada para debug.

routers setoresRoute.js
Implementa o CRUD de setores na rota /api/setores.

GET /api/setores devolve a lista de todos os setores cadastrados.
POST /api/setores valida o nome e cria um novo setor usando a camada SetorBd.
PUT /api/setores/:id atualiza o nome de um setor existente.
DELETE /api/setores/:id remove um setor pelo id.

routers maquinaRoute.js
Implementa o CRUD de máquinas na rota /api/maquinas.

GET /api/maquinas permite listar todas as máquinas ou filtrar por setorId vindo na query string.
POST /api/maquinas cria uma nova máquina, validando a presença de nome e setorId e permitindo enviar status e número de série.
PUT /api/maquinas/:id atualiza os campos de uma máquina existente de forma mesclada.
DELETE /api/maquinas/:id remove uma máquina pelo id.

routers manutencoesRoute.js
Responsável por todas as rotas de manutenções em /api/manutencoes. Internamente usa a camada manutencoesBd para CRUD e também acessa diretamente ManutencaoModel e MaquinaModel para consultas específicas. O arquivo possui helpers que normalizam o corpo das requisições, aceitando diferentes formas de identificar a máquina (maquinaId, campos equivalentes ou objeto com id) e convertem datas vindas como string em datas válidas.

Principais rotas de manutenção:

GET /api/manutencoes lista as manutenções, permitindo filtros como status, setor e máquina, de acordo com o que a camada de dados oferece.

GET /api/manutencoes/:id retorna o detalhe de uma manutenção específica.

POST /api/manutencoes cria uma nova manutenção. Normaliza o payload, resolve a máquina, valida a existência de uma descrição ou título e devolve a manutenção criada com status 201.

PUT /api/manutencoes/:id faz uma atualização mais completa, utilizando a mesma normalização de payload e mesclando os campos com o registro existente.

PATCH /api/manutencoes/:id permite atualizações parciais, usadas pelo front principalmente para mover a data da manutenção no calendário. A rota aceita um campo de data e atualiza somente esse aspecto, sem sobrescrever o restante.

DELETE /api/manutencoes/:id remove uma manutenção.

GET /api/manutencoes/calendar/events monta a lista de eventos para alimentar o calendário do front. Carrega todas as manutenções, busca os nomes das máquinas associadas, calcula start e end para cada evento com base nas datas de agendamento ou realização e devolve um array de objetos contendo id, title, start, end e status, já no formato esperado pelo componente de calendário da interface.

routers kpiRoute.js
Rota GET /api/kpis, usada pelo Dashboard. Faz contagens diretas com ManutencaoModel:

abertas, somando manutenções com status PENDENTE ou EM_ANDAMENTO.
atrasadas, com base em dataAgendada anterior à data atual e status não concluído.
hoje, contando manutenções com dataAgendada dentro do dia corrente.
concluidasMes, contando manutenções com status CONCLUIDA e dataRealizada no mês atual.

Devolve um objeto com esses quatro números.

Configuração de variáveis de ambiente do backend

O arquivo backend/.env deve conter, pelo menos:

PORT, indicando a porta em que a API vai rodar, normalmente 4000.
CORS_ORIGIN, apontando para a origem do front, normalmente http://localhost:5173
.
MONGO_URI, com a string de conexão completa do MongoDB Atlas ou do Mongo local.

Configuração e execução do front projeto_somativa

A pasta projeto_somativa contém a aplicação Vue 3.

package.json do front define os scripts:
dev, que roda o Vite para desenvolvimento.
build, que gera a versão otimizada para produção.
preview, que serve o build para testes.
db, que roda um json server apontando para db.json com um middleware. Esse script foi usado em versões antigas com backend simulado e hoje é opcional, já que o backend principal é o Node com Mongo.

O arquivo .env do front define VITE_API_URL, que aponta para a URL base da API em desenvolvimento. No projeto enviado, está configurado para http dois pontos barra barra localhost dois pontos quatro mil barra api. O arquivo src/services/api.js cria uma instância do Axios usando essa base e define um timeout padrão. Todas as chamadas de API nos stores e views usam esse serviço.

main.js cria a aplicação Vue, registra o Pinia como gerenciador de estado, registra o roteador e monta a aplicação na div com id app. Carrega ainda o CSS gerado pelo Tailwind.

App.vue define a estrutura principal da interface. Inclui a Navbar no topo, Sidebar lateral com o menu de navegação, integra o componente ToastHost que mostra notificações e posiciona o router view no conteúdo principal. Em telas pequenas, controla um drawer para a Sidebar, que é aberto e fechado por um botão no Navbar.

router index.js configura as rotas e o guard de autenticação. Usa createWebHashHistory, define as rotas para Login, Dashboard, Manutencoes, DetalheManutencao, Calendario, Maquinas e Setores. As rotas, exceto Login, têm meta requiresAuth. O guard utiliza o store de auth para verificar se há usuário autenticado; se não houver, redireciona o usuário para a página de login, preservando a rota de destino em redirect.

stores do front

Há uma pasta src/store com diversos stores Pinia.

auth.js
Controla autenticação. Armazena usuário atual e token simples. Persiste a sessão no localStorage sob a chave smpm_auth_v1. Exponde ações login e logout. A ação login chama a API GET /api/users com email e senha. Se receber uma lista com pelo menos um usuário, guarda o primeiro na sessão, marca o usuário como autenticado e persiste no localStorage. Se não, devolve erro de credenciais inválidas.

kpis.js
Carrega os números mostrados no dashboard. Faz requisição para /kpis. Se a chamada falhar, tem uma lógica alternativa para tentar derivar os mesmos números a partir da lista de manutenções já carregadas. Armazena dados, estados de carregamento e erros.

setores.js
Controla a lista de setores. Implementa ações para carregar, criar, atualizar e remover setores, chamando as rotas do backend e mantendo a lista local atualizada.

maquinas.js
Controla a lista de máquinas. Carrega as máquinas do backend, permite filtrar por setor na chamada, cria novas máquinas, atualiza registros existentes e remove máquinas, refletindo tudo no estado reativo.

manutencoes.js
É um dos stores centrais. Mantém a lista de manutenções e filtros de busca. Tem ações para carregar todas as manutenções, buscar por id, criar uma nova, atualizar, mover a data via patch e remover. Muitas telas usam esse store, tanto a listagem quanto o calendário e o dashboard.

toast.js e ui.js
São stores de interface para notificações. toast.js mantém uma fila de toasts com id, tipo e mensagem, com métodos success, error e info, e remove os toasts automaticamente após alguns segundos. O componente ToastHost consome esse store e exibe as notificações em um canto da tela. ui.js também oferece uma estrutura de toasts, utilizada em alguns pontos herdados do desenvolvimento anterior.

Componentes principais

Navbar.vue
Barra no topo com o título do sistema, botão para abrir o menu lateral em telas pequenas e informações do usuário logado, além da opção de logout.

Sidebar.vue
Menu de navegação com links para Dashboard, Manutenções, Máquinas, Setores e Calendário. Em telas grandes fica fixa; em telas pequenas pode aparecer como drawer controlado por App.vue.

ToastHost.vue
Container fixo que exibe as notificações vindas do store de toasts. Mostra mensagens de sucesso, erro e informação com cores diferentes.

LoadingButton.vue
Botão reutilizável que mostra estado de carregamento durante operações assíncronas, usado em formulários e ações críticas.

Componentes de gráficos na pasta charts
ChartDonut, ChartBars, ChartLine e ChartStackBars são componentes simples que recebem arrays de labels e values e desenham gráficos responsivos para serem usados no Dashboard. Trabalham apenas com elementos HTML e classes Tailwind, sem dependências externas de bibliotecas de gráficos.

Componentes de interface em ui
Incluem, por exemplo, StatusBadge e InlineStatusSelect, para representar e editar o status das manutenções com visual consistente.

Telas do sistema

Login.vue
Tela inicial de autenticação. Possui campos para email e senha. Ao enviar, chama o store de auth para validar as credenciais na API. Se a autenticação for bem-sucedida, redireciona o usuário para a rota informada em redirect ou para o Dashboard. Em caso de erro, exibe mensagem ao usuário. As credenciais padrão, geradas pelo seed, são admin arroba smpm ponto local com senha 123456 para login como administrador e oper arroba smpm ponto local com senha 123456 para login como operador.

Dashboard.vue
Mostra um resumo da operação de manutenção. Carrega os KPIs do backend ou calcula a partir da lista de manutenções. Exibe cartões com as quantidades de manutenções abertas, atrasadas, marcadas para hoje e concluídas no mês. Usa gráficos para visualizar distribuição por status e outros recortes. Também oferece um formulário rápido para criar uma manutenção já agendada para o dia atual, escolhendo setor e máquina.

Manutencoes.vue
Listagem principal de manutenções. Usa o store de manutenções para carregar os dados e o de máquinas e setores para enriquecer a visão. Mostra colunas como título ou descrição, máquina, setor, datas, status e prioridade. Permite aplicar filtros por status, setor, máquina e busca textual. Permite navegar para o detalhe de uma manutenção específica, criar novas manutenções e excluir registros existentes.

DetalheManutencao.vue
Tela de detalhe de uma única manutenção. Mostra todos os campos e permite atualizar dados como status, datas, tipo e descrição. Internamente usa o store de manutenções para buscar a manutenção pelo id na URL e sincronizar alterações com a API.

Maquinas.vue
Tela de cadastro de máquinas. Mostra a lista de máquinas com seu setor e status. Permite incluir novas máquinas, editar nome, setor, status e série, e excluir máquinas. Usa os stores de máquinas, setores e ui para exibir mensagens de feedback.

Setores.vue
Tela de cadastro de setores. Mostra todos os setores cadastrados. Permite criar novos setores, editar o nome de um setor existente e excluir setores. Usa o store de setores e o store de ui para notificar o usuário em caso de sucesso ou erro.

Calendario.vue
Tela que mostra um calendário mensal, com possibilidade de navegar para meses anteriores e posteriores e voltar para o mês atual. Integra o store de manutenções e de máquinas para preencher os eventos. Para cada dia são contadas as manutenções agendadas, atrasadas e concluídas, exibindo indicadores dentro do quadrado correspondente. Ao clicar em um dia é possível criar uma nova manutenção já associada à data. O calendário também consome os dados de /api/manutencoes/calendar/events para obter mais contexto, incluindo o nome da máquina. A lógica de comparação de datas normaliza as datas vindas do backend no formato completo para o formato ano mês dia, garantindo que as manutenções apareçam corretamente nos dias correspondentes.

Estilos

A aplicação front usa Tailwind para estilização. O arquivo tailwind.config.js está configurado para integrar com o Vite e gerar as classes utilizadas. O arquivo src/assets/tailwind.css importa as diretivas base, components e utilities do Tailwind. As classes são usadas diretamente nos templates dos componentes para compor o layout responsivo, cores, espaçamentos e tipografia.

Como iniciar o sistema passo a passo

Primeiro, configure o banco. Em desenvolvimento, o caminho mais simples é usar o MongoDB Atlas gratuito. Crie um cluster, crie um usuário de banco, libere o acesso de rede e copie a string de conexão. Substitua o usuário, a senha e o host na string e coloque o valor final na variável MONGO_URI do arquivo backend/.env. Se preferir, use uma instância local de MongoDB e ajuste MONGO_URI para apontar para ela.

Depois, inicie o backend. Em um terminal, acesse a pasta backend. Execute npm install para instalar as dependências. Em seguida, execute npm run dev. O nodemon iniciará o servidor e, na primeira execução, fará a conexão com o Mongo, criará os índices e inserirá os dados de exemplo (usuários, setores, máquinas e manutenções). Quando aparecer a mensagem de que a API está rodando em http dois pontos barra barra localhost dois pontos quatro mil, o backend estará pronto.

Em outro terminal, inicie o front. Acesse a pasta projeto_somativa. Execute npm install para instalar as dependências do front. Verifique se o arquivo .env aponta VITE_API_URL para http dois pontos barra barra localhost dois pontos quatro mil barra api. Em seguida, execute npm run dev. O Vite iniciará o servidor de desenvolvimento, normalmente em http dois pontos barra barra localhost dois pontos cinco mil cento e setenta e três.

Por fim, abra o navegador em http dois pontos barra barra localhost dois pontos cinco mil cento e setenta e três. A tela inicial será a de login. Use um dos usuários criados automaticamente pelo seed. Por exemplo, email admin arroba smpm ponto local e senha 123456. Após o login, você será direcionado ao Dashboard e poderá navegar por todas as funcionalidades do sistema.

Observações finais

O projeto foi estruturado para ser didático e fácil de entender. O backend usa a combinação Express e Mongoose com uma camada de repositórios que isolam a lógica de banco das rotas. O front segue o padrão Vue 3 com Composition API, organização por views, stores com Pinia e componentes reaproveitáveis. Toda a lógica de integração entre front e back é feita via Axios, apontando para o backend Node, e o calendário e o dashboard consomem dados em tempo real do MongoDB.
