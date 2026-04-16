# Pokedex

Projeto educacional em React + Vite que implementa uma Pokédex interativa com:
- listagem por geração;
- busca global;
- detalhes completos de Pokémon (incluindo variações);
- módulo de bolsa de itens;
- construtor de times;
- simulação de batalha contra campeões;
- módulo de mapas por região com zoom/pan.

## Objetivo Acadêmico (respostas aos critérios)

### 1) Entender como os dados são transmitidos pela API
O projeto usa chamadas HTTP `GET` para endpoints REST da PokeAPI, consumindo JSON e convertendo para estruturas internas de interface.

Ponto central:
- `src/pokeApi.js` -> `fetchJsonWithTimeout(url, label, timeoutMs)`

Esse helper:
- dispara `fetch` com `AbortController`;
- aborta por timeout;
- valida `response.ok`;
- retorna JSON parseado;
- padroniza erros (`failed`, `timed out`) para a camada de UI.

### 2) Buscar uma forma de pegar os dados da API
Toda aquisição de dados é feita por funções assíncronas dedicadas, com cache em memória para evitar requisições duplicadas.

Fluxos principais:
- `src/App.jsx`
  - gerações: `generation/{id}`
  - detalhes do Pokémon: `pokemon/{id}` + `pokemon-species/{id}`
  - variedades/formas: URLs de `species.varieties`
  - bolsa:
    - `item-pocket/{pocket}`
    - categorias do pocket
    - itens por URL de categoria
    - pokébolas por nome (`item/{name}`)
- `src/battleUtils.js`
  - dados de batalha: `pokemon/{identifier}`
  - golpes: URL de cada move para obter metadados

### 3) Traduzir JSON para objeto (processamento de dados)
O projeto não injeta JSON bruto direto na tela: ele converte em modelos específicos de UI/domínio.

Exemplos:
- listagem da Pokédex:
  - de `pokemon_species[]` para `{ id, name, displayName, generationId, generationLabel }`
- detalhes:
  - composição de objeto único com `types`, `abilities`, `heightLabel`, `weightLabel`, `flavor`, `variants`
- bolsa:
  - mapeamento para `{ id, displayName, description, sprite, quantity }`
- batalha:
  - normalização para membros com `stats`, `moves`, `maxHp`, `currentHp`, sprites front/back

Também há transformação semântica:
- limpeza de texto (`cleanText`);
- formatação de nomes e IDs (`formatName`, `formatId`);
- escolha de sprites com fallback;
- classificação e ordenação de variantes.

### 4) Construir menu interativo (GUI)
A aplicação é totalmente gráfica (React), com múltiplos módulos interativos:
- seletor de geração;
- busca;
- cartões clicáveis;
- popups (time, batalha, bolsa, mapa);
- mapa com navegação entre regiões, zoom por botões/scroll e pan por arraste;
- docking de áudio (mute, volume, troca de faixa).

### 5) Criatividade para criar a Pokédex
A criatividade aparece na composição de sistemas acoplados:
- Pokédex + bag + mapa + team builder + batalha;
- animações de transição de batalha;
- trilhas de menu e batalha com controle dinâmico;
- análise de time (vantagens, resistências, fraquezas) baseada em tabela de tipos;
- simulação de turnos com ordem por prioridade/velocidade, STAB, efetividade e estado de troca forçada.

### 6) Tratamento de erros
O projeto trata erro em múltiplas camadas:
- rede/timeout (`fetchJsonWithTimeout`);
- carregamentos com `try/catch` e estados de UI (`loading/success/error`);
- uso de `Promise.allSettled` para falha parcial sem derrubar tudo;
- fallback visual quando imagem falha (`handleCardSpriteError`);
- validações de fluxo (ex.: impedir batalha sem time, impedir ações durante estados bloqueados).

## O que é API e o que não é API

### Parte que vem da API (PokeAPI)
- espécies, gerações, formas/variedades;
- tipos, habilidades, dimensões;
- itens/pokébolas e descrições;
- dados de golpes (tipo, poder, precisão, classe, prioridade);
- cries e sprites referenciados pela estrutura da PokeAPI.

### Parte local do projeto (não vem da API)
- seleção de campeões e composição de times dos campeões (`src/championData.js`);
- lógica de batalha por turnos e regras de decisão de AI (`src/BattlePopup.jsx`, `src/battleUtils.js`);
- tabela de tipos usada pela análise e dano (`src/typeData.js`);
- UX de popups, animações, controles, layout e navegação;
- definição e ordenação de mapas regionais (`src/regionMapData.js`);
- regras de cache em memória e orquestração de estados em React.

## Arquitetura resumida
- `src/App.jsx`: orquestrador principal de estado global da UI.
- `src/pokeApi.js`: camada comum de request com timeout e erro.
- `src/pokemonHelpers.js`: normalização/formatadores e seleção de sprites.
- `src/TeamBuilderPopup.jsx`: gestão de times e análise de cobertura.
- `src/battleUtils.js` + `src/BattlePopup.jsx`: montagem dos dados e execução da batalha.
- `src/InteractiveRegionMapPopup.jsx` + `src/regionMapData.js`: módulo de mapas com zoom/pan e troca de região.

## Estratégias técnicas observadas no código
- cache por `Map` para reduzir chamadas repetidas;
- deduplicação de requests em andamento (promise cache por geração/detalhe);
- lazy loading de componentes pesados (`BattlePopup` e `TeamBuilderPopup`);
- `useDeferredValue` para suavizar custo de busca global;
- separação entre aquisição de dados, transformação e renderização.

## Como executar
```bash
npm install
npm run dev
```

Build de produção:
```bash
npm run build
npm run preview
```

## Aviso legal e escopo educacional
Este projeto é **educacional**, sem fins comerciais.

- Pokémon, nomes, personagens, artes e marcas relacionadas pertencem à **Nintendo / Game Freak / Creatures Inc. / The Pokémon Company**.
- Os dados consumidos por API são fornecidos pela **PokeAPI** (https://pokeapi.co/), com seus respectivos termos e créditos.

Se você reutilizar este projeto, mantenha os créditos e respeite as políticas de uso dos conteúdos e APIs envolvidas.
