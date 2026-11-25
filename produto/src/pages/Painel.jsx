import { useState } from 'react'
import { ArrowDown, ArrowUp, Clock, Table2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import GraficoNivel, { Mini } from '../components/GraficoNivel.jsx'
import { Cabecalho, Chip, ChipAcesso, ChipCriticidade, ChipRio } from '../components/ui.jsx'
import { REQ_POR_TELA } from '../data/requisitos.js'
import { avaliarRota, pode } from '../lib/regras.js'
import { cm, data, dataAno, dec, metros, num, quando } from '../lib/formato.js'

export default function Painel() {
  const { estacoes, estado, criticidades, usuario, setUi } = useStore()
  const [tabela, setTabela] = useState(false)
  const manaus = estacoes.find((e) => e.id === 'manaus')
  const folga = Math.round((manaus.nivel - manaus.recorde.cota) * 100) / 100
  const taxa = -manaus.variacao24h
  const diasAteRecorde = taxa > 0 ? Math.ceil((folga * 100) / taxa) : null

  const titulo = folga > 0
    ? `${manaus.rio} em ${manaus.nome} está a ${dec(folga)} m da mínima histórica`
    : `${manaus.rio} em ${manaus.nome} está abaixo da mínima histórica`
  const subtitulo = taxa > 0
    ? `Desce ${taxa} cm por dia. Nesse ritmo, chega aos ${dec(manaus.recorde.cota)} m de 2024 em cerca de ${diasAteRecorde} dias.`
    : `O nível ${cm(manaus.variacao24h)} nas últimas 24 horas.`

  const lista = estado.comunidades
    .map((c) => ({ c, k: criticidades[c.id] }))
    .sort((a, b) => b.k.pontos - a.k.pontos)
  const criticas = lista.filter((x) => x.k.nivel === 'critica')
  const familias = lista.filter((x) => x.k.nivel === 'critica' || x.k.nivel === 'alta').reduce((s, x) => s + x.c.familias, 0)
  const pend = estado.entregas.filter((e) => e.status === 'Pendente').length
  const emRota = estado.entregas.filter((e) => e.status === 'Em Rota').length
  const principais = estado.rotas.filter((r) => r.tipo === 'principal').map((r) => avaliarRota(r, estacoes))
  const fechadas = principais.filter((a) => !a.transitavel).length

  function planejar(id) {
    setUi((u) => ({ ...u, novaEntregaPara: id }))
    window.location.hash = 'entregas'
  }
  function abrir(id) {
    setUi((u) => ({ ...u, abrirComunidade: id }))
    window.location.hash = 'comunidades'
  }

  return (
    <>
      <Cabecalho titulo={titulo} subtitulo={subtitulo} reqs={REQ_POR_TELA.painel}>
        <div className="fonte-dados">
          <span>Leitura de {quando(manaus.leituraEm)} na estação {manaus.codigo} (ANA, Hidrotelemetria)</span>
          <span>Cenário simulado de estiagem para demonstração; a mínima de {dataAno(manaus.recorde.data)} é dado real ({manaus.recorde.fonte}).</span>
        </div>
      </Cabecalho>

      <section className="heroi" aria-labelledby="t-grafico">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 id="t-grafico">Nível do {manaus.rio} em {manaus.nome}, últimos {manaus.serie.length} dias</h2>
          <button className="btn fantasma pequeno" aria-expanded={tabela} onClick={() => setTabela((v) => !v)}>
            <Table2 size={18} aria-hidden="true" /> {tabela ? 'Ocultar tabela' : 'Ver em tabela'}
          </button>
        </header>
        <GraficoNivel estacao={manaus} />
        {tabela && <TabelaSerie estacao={manaus} />}
      </section>

      <section className="secao" aria-labelledby="t-est">
        <header>
          <h2 id="t-est">Estações monitoradas</h2>
          <span className="nota">Leituras diárias às 7h. Limiares de atenção, alerta e crítico definidos para o protótipo.</span>
        </header>
        <div className="estacoes">
          {estacoes.map((e) => <Estacao key={e.id} e={e} />)}
        </div>
      </section>

      <section className="secao" aria-labelledby="t-sit">
        <h2 id="t-sit" className="sr-only">Situação geral</h2>
        <div className="stats">
          <div className="stat"><span className="v">{criticas.length}</span><span className="l">comunidades em situação crítica</span><span className="d">de {estado.comunidades.length} acompanhadas</span></div>
          <div className="stat"><span className="v">{num(familias)}</span><span className="l">famílias em comunidades críticas ou altas</span></div>
          <div className="stat"><span className="v">{pend}</span><span className="l">entregas pendentes</span><span className="d">{emRota} em rota agora</span></div>
          <div className="stat"><span className="v">{fechadas}</span><span className="l">rotas principais intransitáveis</span><span className="d">de {principais.length} cadastradas</span></div>
        </div>
      </section>

      <section className="secao" aria-labelledby="t-pri">
        <header>
          <h2 id="t-pri">Comunidades prioritárias</h2>
          <a className="btn fantasma pequeno" href="#comunidades">Ver todas as {estado.comunidades.length}</a>
        </header>
        <div className="tabela-wrap">
          <table className="tab stack">
            <thead>
              <tr><th>Comunidade</th><th>Criticidade</th><th className="n">Pontos</th><th className="n">Famílias</th><th>Acesso</th><th>Rota recomendada</th><th><span className="sr-only">Ação</span></th></tr>
            </thead>
            <tbody>
              {lista.slice(0, 6).map(({ c, k }) => (
                <tr key={c.id} className="clicavel" onClick={() => abrir(c.id)}>
                  <td data-l="Comunidade"><span className="nomecel">{c.nome}</span><span className="sub">{c.municipio}, {c.rio}</span></td>
                  <td data-l="Criticidade"><ChipCriticidade nivel={k.nivel} pontos={k.pontos} /></td>
                  <td data-l="Pontos" className="n">{k.pontos}</td>
                  <td data-l="Famílias" className="n">{num(c.familias)}</td>
                  <td data-l="Acesso"><ChipAcesso acesso={k.acesso.acesso} /></td>
                  <td data-l="Rota">{k.acesso.recomendada ? k.acesso.recomendada.rota.nome : 'Nenhuma rota transitável'}{k.acesso.exigeValidacao && <span className="sub">falta validar</span>}</td>
                  <td data-l="">
                    {pode(usuario, 'criar-entregas') && (
                      <button className="btn pequeno" onClick={(ev) => { ev.stopPropagation(); planejar(c.id) }}>Planejar entrega</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota" style={{ marginTop: 10 }}>
          A pontuação vai de 0 a 100 e soma acesso, necessidades, famílias, dias sem atendimento e o nível do rio (RN03): crítica a partir de 70, alta de 50 a 69, média de 30 a 49 e baixa abaixo de 30.
        </p>
      </section>
    </>
  )
}

function Estacao({ e }) {
  const Seta = e.variacao24h < 0 ? ArrowDown : ArrowUp
  return (
    <article className="estacao" aria-label={`Estação ${e.nome}`}>
      <div className="topo-est">
        <div>
          <div className="nome">{e.nome}</div>
          <div className="rio">{e.rio}</div>
        </div>
        <ChipRio status={e.status} />
      </div>
      <div className="valor">{metros(e.nivel)}</div>
      <div className="linha-var"><Seta size={16} aria-hidden="true" /> {cm(e.variacao24h)} em 24 h</div>
      <Mini serie={e.serie} />
      {e.desatualizada
        ? <Chip tom="warning" icone={Clock}>Sem leitura desde {data(e.leituraEm)}</Chip>
        : <span className="meta">Leitura de {quando(e.leituraEm)}</span>}
      <span className="meta">Estação {e.codigo}. Crítico abaixo de {dec(e.limiares.critico)} m</span>
    </article>
  )
}

function TabelaSerie({ estacao }) {
  const linhas = estacao.serie.slice(-30).reverse()
  return (
    <div className="tabela-wrap" style={{ maxHeight: 320, overflow: 'auto', marginTop: 8 }}>
      <table className="tab">
        <caption className="sr-only">Últimas 30 leituras de {estacao.nome}</caption>
        <thead><tr><th>Data</th><th className="n">Nível</th><th className="n">Variação no dia</th></tr></thead>
        <tbody>
          {linhas.map((p, i) => {
            const ant = linhas[i + 1]
            return (
              <tr key={p.data}>
                <td>{dataAno(p.data)}</td>
                <td className="n">{metros(p.nivel)}</td>
                <td className="n">{ant ? `${p.nivel - ant.nivel > 0 ? '+' : '-'}${Math.abs(Math.round((p.nivel - ant.nivel) * 100))} cm` : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
