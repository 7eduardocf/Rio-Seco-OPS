# Rio Seco OPS - protótipo

Protótipo do sistema do nosso Projeto Integrador (Gerência de Projetos). É só o front-end, feito em React + Vite, com dados simulados. Não tem servidor: tudo roda no navegador e o que for cadastrado fica salvo no próprio navegador (localStorage).

## Rodando

Precisa do Node 22 (ou 20.19+).

```
cd produto
npm install
npm run dev
```

Abre em http://localhost:5173. Para gerar a versão de produção: `npm run build` (sai na pasta `dist/`).

## GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` publica sozinho a cada push na `main` que mexer em `produto/`. Só precisa ativar uma vez em Settings > Pages > Source: GitHub Actions.

## Telas

- **Painel dos rios**: nível do Rio Negro em Manaus nos últimos 120 dias, estações da ANA e as comunidades prioritárias (RF01, RNF04, RN06)
- **Comunidades**: cadastro, busca e a pontuação de criticidade com os fatores (RF02, RN01, RN03)
- **Mapa e rotas**: comunidades, bases e rotas; rota principal x alternativa e validação da alternativa (RF03, RN05)
- **Entregas**: kanban Pendente / Em Rota / Entregue com foto na confirmação (RF04, RF07, RN02, RN03)
- **Alertas**: mensagens para o WhatsApp das lideranças, com envio simulado (RF05, RN07)
- **Usuários e perfis**: perfis e permissões (RNF03)
- **Requisitos**: lista de onde cada requisito aparece e como testar

O modo offline (RF06, RNF02, RNF06, RN04) liga no botão Online / Sem conexão no topo.

## Roteiro da demo

1. Painel: mostrar quanto falta para a mínima histórica e a estação de Tabatinga com leitura atrasada.
2. Comunidades: abrir Santa Maria e mostrar como a pontuação é calculada.
3. Entregas: tentar despachar a entrega de São Sebastião do Lago. O sistema bloqueia porque a rota alternativa ainda não foi validada.
4. Mapa: em São Sebastião do Lago, comparar a rota principal (intransitável) com o Paraná do Careiro, validar a rota e voltar para despachar.
5. Offline: ligar "Sem conexão", confirmar uma entrega com foto, usar "Simular reenvio" na fila e voltar a ficar online. O aviso mostra o registro repetido descartado.
6. Alertas: enviar "Nível do rio" para as comunidades críticas (Santa Maria fica de fora porque não tem contato).
7. Perfis: entrar como Raimundo Pereira (liderança) e mostrar que ele só vê a entrega da comunidade dele.

Para voltar ao cenário inicial: tela Requisitos > Restaurar dados de demonstração.

## Dados

Reais: municípios, rios, códigos das estações da ANA (Manaus 14990000, Manacapuru 14100000, Itacoatiara 16030000, Tabatinga 10100000), a mínima histórica do Rio Negro em Manaus (12,11 m em 09/10/2024, Porto de Manaus) e o traçado dos rios e estados (Natural Earth).

Simulados: níveis atuais e limiares, comunidades, lideranças, telefones, rotas e cotas mínimas, envio de WhatsApp e sincronização.

O `src/data/geo.json` sai do script `scripts/gerar_geo.py` (instruções no começo do arquivo).

## Pastas

```
src/
  App.jsx, main.jsx   rotas e entrada
  store.jsx           estado, fila offline e usuário logado
  styles.css
  data/               dados simulados, estações, requisitos, mapa
  lib/                regras de negócio, sincronização, formatação
  components/         barra lateral, topo, gráfico e componentes
  pages/              uma tela por arquivo
```

## Créditos

Mapa: Natural Earth (domínio público). Fontes Barlow e Barlow Condensed (SIL Open Font License). Leaflet, Lucide, React e Vite.
