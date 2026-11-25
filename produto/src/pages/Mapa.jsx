import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { ShieldCheck, Info, X } from 'lucide-react'
import { useStore } from '../store.jsx'
import geo from '../data/geo.json'
import { BASES } from '../data/seed.js'
import { REQ_POR_TELA } from '../data/requisitos.js'
import { Aguardando, Cabecalho, ChipAcesso, ChipCriticidade, ChipRota, Modal } from '../components/ui.jsx'
import { DetalheComunidade } from './Comunidades.jsx'
import { avaliarRota, pode, NIVEL_CRITICIDADE } from '../lib/regras.js'
import { dec, horas, num, quando } from '../lib/formato.js'

// forma diferente pra cada nivel, nao depender so da cor
const FORMAS = {
  critica: '<polygon points="8.2,1 17.8,1 25,8.2 25,17.8 17.8,25 8.2,25 1,17.8 1,8.2"/>',
  alta: '<polygon points="13,1.5 25,24 1,24"/>',
  media: '<polygon points="13,1 25,13 13,25 1,13"/>',
  baixa: '<circle cx="13" cy="13" r="11"/>',
}
const COR = { critica: 'var(--critical)', alta: 'var(--serious)', media: 'var(--warning)', baixa: 'var(--good)' }

function icone(nivel, selecionada) {
  const t = selecionada ? 34 : 24
  return L.divIcon({
    className: 'pin-com',
    html: `<svg width="${t}" height="${t}" viewBox="0 0 26 26" fill="${COR[nivel]}" stroke="${selecionada ? 'var(--ink)' : '#fff'}" stroke-width="${selecionada ? 2.6 : 2}">${FORMAS[nivel]}</svg>`,
    iconSize: [t, t],
    iconAnchor: [t / 2, t / 2],
  })
}

const LIMITES_INICIO = [[-4.6, -68.3], [-0.8, -56.5]]

export default function Mapa() {
  const { estado, estacoes, criticidades, usuario, ui, setUi, executar, avisar, online, pendentes } = useStore()
  const caixa = useRef(null)
  const mapa = useRef(null)
  const camadas = useRef({})
  const [sel, setSel] = useState(ui.selecionadaMapa)
  const [detalhe, setDetalhe] = useState(null)
  const [validando, setValidando] = useState(null)

  useEffect(() => { if (ui.selecionadaMapa) setUi((u) => ({ ...u, selecionadaMapa: null })) }, [ui.selecionadaMapa, setUi])

  const avaliacoes = useMemo(
    () => Object.fromEntries(estado.rotas.map((r) => [r.id, avaliarRota(r, estacoes)])),
    [estado.rotas, estacoes],
  )

  // cria o mapa so uma vez
  useEffect(() => {
    const m = L.map(caixa.current, { zoomSnap: 0.25, minZoom: 4.5, maxZoom: 12, attributionControl: true, worldCopyJump: false })
    m.attributionControl.setPrefix(false)
    m.attributionControl.addAttribution('Base: Natural Earth (domínio público). Rotas em traçado esquemático.')
    L.geoJSON(geo.estados, { interactive: false, style: (f) => ({ className: `estado${f.properties.uf === 'AM' ? ' am' : ''}` }) }).addTo(m)
    L.geoJSON(geo.rios, { interactive: false, style: (f) => ({ className: `rio ${f.properties.agua}` }) }).addTo(m)
    camadas.current.rotas = L.layerGroup().addTo(m)
    camadas.current.bases = L.layerGroup().addTo(m)
    camadas.current.comunidades = L.layerGroup().addTo(m)
    BASES.forEach((b) => {
      L.marker([b.lat, b.lon], {
        icon: L.divIcon({ className: '', html: '<div class="pin-base">B</div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        keyboard: false, zIndexOffset: 500,
      }).bindTooltip(b.nome, { direction: 'top', offset: [0, -10], className: 'rotulo-com' }).addTo(camadas.current.bases)
    })
    m.fitBounds(LIMITES_INICIO, { padding: [16, 16] })
    mapa.current = m
    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(caixa.current)
    return () => { ro.disconnect(); m.remove(); mapa.current = null }
  }, [])

  // redesenha rotas e marcadores
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    const { rotas, comunidades } = camadas.current
    rotas.clearLayers()
    comunidades.clearLayers()
    const visiveis = estado.rotas.filter((r) => geo.rotas[r.id] && (!sel || r.comunidadeId === sel))
    const recomendada = sel ? criticidades[sel]?.acesso.recomendada?.rota.id : null
    visiveis.forEach((r) => {
      const a = avaliacoes[r.id]
      const situacao = !a.transitavel ? 'fechada' : !a.validada ? 'proposta' : 'usavel'
      const coords = geo.rotas[r.id].coords
      const tenue = !sel ? ' tenue' : ''
      if (sel && situacao !== 'fechada') L.polyline(coords, { className: 'rota-casca', interactive: false }).addTo(rotas)
      L.polyline(coords, { className: `rota ${situacao}${tenue}${r.id === recomendada ? ' recomendada' : ''}` })
        .bindTooltip(`${r.nome}: ${situacao === 'fechada' ? 'intransitável' : situacao === 'proposta' ? 'proposta, falta validar' : 'transitável'}`, { sticky: true, className: 'rotulo-com' })
        .on('click', () => setSel(r.comunidadeId))
        .addTo(rotas)
    })
    estado.comunidades.forEach((c) => {
      const k = criticidades[c.id]
      const eSel = c.id === sel
      const mk = L.marker([c.lat, c.lon], { icon: icone(k.nivel, eSel), zIndexOffset: eSel ? 1000 : NIVEL_CRITICIDADE[k.nivel].ordem * 100, title: c.nome, alt: `${c.nome}, criticidade ${NIVEL_CRITICIDADE[k.nivel].rotulo.toLowerCase()}` })
        .bindTooltip(`${c.nome} (${NIVEL_CRITICIDADE[k.nivel].rotulo.toLowerCase()})`, { direction: 'top', offset: [0, -12], className: 'rotulo-com', permanent: eSel })
        .on('click', () => setSel(c.id))
        .on('keypress', (e) => { if (e.originalEvent.key === 'Enter') setSel(c.id) })
      mk.addTo(comunidades)
    })
  }, [estado.rotas, estado.comunidades, criticidades, avaliacoes, sel])

  // zoom na comunidade selecionada
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    if (!sel) return
    const pts = estado.rotas.filter((r) => r.comunidadeId === sel && geo.rotas[r.id]).flatMap((r) => geo.rotas[r.id].coords)
    const c = estado.comunidades.find((x) => x.id === sel)
    if (c) pts.push([c.lat, c.lon])
    if (pts.length > 1) m.flyToBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 10, duration: 0.6 })
    else if (c) m.flyTo([c.lat, c.lon], 9, { duration: 0.6 })
  }, [sel]) // eslint-disable-line react-hooks/exhaustive-deps

  const lista = estado.comunidades.map((c) => ({ c, k: criticidades[c.id] })).sort((a, b) => b.k.pontos - a.k.pontos)
  const com = sel ? estado.comunidades.find((c) => c.id === sel) : null
  const k = com ? criticidades[com.id] : null

  function verTudo() {
    setSel(null)
    mapa.current?.flyToBounds(LIMITES_INICIO, { padding: [16, 16], duration: 0.6 })
  }

  return (
    <>
      <Cabecalho
        titulo="Mapa e rotas"
        subtitulo="Comunidades por criticidade e as rotas a partir das bases. Quando o canal principal seca, a rota segue por furos e paranás."
        reqs={REQ_POR_TELA.mapa}
      />
      <div className="mapa-layout">
        <div className="mapa"><div ref={caixa} style={{ position: 'absolute', inset: 0 }} aria-label="Mapa das comunidades e rotas" /></div>
        <aside className="mapa-painel" aria-label="Detalhes do mapa">
          {com ? (
            <>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <h2>{com.nome}</h2>
                    <span className="nota">{com.municipio}, {com.rio}. {num(com.familias)} famílias</span>
                  </div>
                  <button className="btn fantasma icone" onClick={verTudo} aria-label="Limpar seleção e ver todo o mapa"><X size={20} aria-hidden="true" /></button>
                </div>
                <div className="acoes"><ChipCriticidade nivel={k.nivel} pontos={k.pontos} /><ChipAcesso acesso={k.acesso.acesso} /></div>
              </div>
              {k.acesso.acesso === 'isolada' && (
                <div className="aviso" style={{ '--tom': 'var(--critical)' }}>
                  <Info size={18} aria-hidden="true" />
                  <span>Nenhuma rota fluvial transitável com o nível de hoje. Avaliar apoio aéreo ou terrestre e cadastrar uma rota alternativa.</span>
                </div>
              )}
              <div style={{ display: 'grid', gap: 10 }}>
                {k.acesso.avaliacoes.map((a) => {
                  const rec = k.acesso.recomendada?.rota.id === a.rota.id
                  return (
                    <div key={a.rota.id} className={`rota-card${rec ? ' recomendada' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <b>{a.rota.nome}</b>
                        <ChipRota avaliacao={a} />
                      </div>
                      <div className="linha">
                        <span>{a.rota.tipo === 'principal' ? 'Principal' : 'Alternativa'}, saindo da {BASES.find((b) => b.id === a.rota.baseId)?.nome}</span>
                        <span>{num(Math.round(a.rota.km))} km, cerca de {horas(a.horas)} de {a.rota.embarcacao.toLowerCase()}</span>
                        <span>Precisa de {dec(a.rota.cotaMinima)} m em {a.estacao?.nome}; hoje {dec(a.nivel)} m ({a.folga >= 0 ? `sobra ${dec(a.folga)} m` : `faltam ${dec(-a.folga)} m`})</span>
                      </div>
                      {a.rota.validacao && <span className="nota"><ShieldCheck size={15} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> Validada por {estado.usuarios.find((u) => u.id === a.rota.validacao.por)?.nome} {quando(a.rota.validacao.em)}</span>}
                      {pendentes.has(`rota:${a.rota.id}`) && <Aguardando />}
                      {rec && <span className="nota">Rota recomendada agora.</span>}
                      {a.rota.tipo === 'alternativa' && !a.rota.validacao && (
                        pode(usuario, 'validar-rotas')
                          ? <button className="btn pequeno" onClick={() => setValidando(a.rota)}><ShieldCheck size={16} aria-hidden="true" /> Validar rota</button>
                          : <span className="nota">Só a Administração pode validar esta rota (RN05).</span>
                      )}
                    </div>
                  )
                })}
                {k.acesso.avaliacoes.length === 0 && <p className="nota">Nenhuma rota cadastrada para esta comunidade.</p>}
              </div>
              <div className="acoes">
                <button className="btn" onClick={() => setDetalhe(com.id)}>Ver detalhes da comunidade</button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2>Selecione uma comunidade</h2>
                <p className="nota">Toque em um marcador ou escolha na lista para ver as rotas e a recomendada para hoje.</p>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
                {lista.map(({ c, k: kk }) => (
                  <li key={c.id}>
                    <button className="btn fantasma" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => setSel(c.id)}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                      <ChipCriticidade nivel={kk.nivel} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Legenda />
        </aside>
      </div>

      {detalhe && <DetalheComunidade id={detalhe} aoFechar={() => setDetalhe(null)} />}
      {validando && (
        <ValidarRota rota={validando} aoFechar={() => setValidando(null)}
          aoConfirmar={(obs) => {
            executar('rota/validar', { id: validando.id, obs })
            avisar(`Rota ${validando.nome} validada${online ? '' : ' neste aparelho; será enviada quando o sinal voltar'}.`, 'good')
            setValidando(null)
          }} />
      )}
    </>
  )
}

function ValidarRota({ rota, aoFechar, aoConfirmar }) {
  const [obs, setObs] = useState('')
  const [ok, setOk] = useState(false)
  return (
    <Modal titulo="Validar rota alternativa" aoFechar={aoFechar}
      rodape={(<><button className="btn" onClick={aoFechar}>Cancelar</button><button className="btn primario" disabled={!ok} onClick={() => aoConfirmar(obs.trim())}>Validar rota</button></>)}>
      <p>A rota <b>{rota.nome}</b> passa a poder ser usada nas entregas. Valide só depois que a equipe de campo conferir o canal.</p>
      <label className="marcavel"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} data-autofoco /> Profundidade, obstáculos e segurança do canal foram verificados</label>
      <div className="campo"><label htmlFor="v-obs">Como foi verificada (opcional)</label><textarea id="v-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: sondagem com voadeira em 12/11, calado mínimo de 1,2 m" /></div>
    </Modal>
  )
}

function Legenda() {
  const linha = (props) => <svg width="34" height="12" aria-hidden="true"><line x1="2" y1="6" x2="32" y2="6" strokeLinecap="round" {...props} /></svg>
  const forma = (n) => <svg width="18" height="18" viewBox="0 0 26 26" fill={COR[n]} stroke="#fff" strokeWidth="2" aria-hidden="true" dangerouslySetInnerHTML={{ __html: FORMAS[n] }} />
  return (
    <section className="legenda" aria-label="Legenda do mapa">
      <h3>Legenda</h3>
      <div className="item">{linha({ stroke: 'var(--rota)', strokeWidth: 4 })} Rota transitável</div>
      <div className="item">{linha({ stroke: 'var(--rota)', strokeWidth: 4, strokeDasharray: '8 6' })} Alternativa proposta, falta validar</div>
      <div className="item">{linha({ stroke: 'var(--critical)', strokeWidth: 2.5, strokeDasharray: '2 6' })} Intransitável com o nível de hoje</div>
      <div className="item">{linha({ stroke: 'var(--rio-preta)', strokeWidth: 3 })} Rio de água preta (Negro)</div>
      <div className="item">{linha({ stroke: 'var(--rio-branca)', strokeWidth: 3 })} Rio de água branca (Solimões, Amazonas, Madeira, Purus)</div>
      <div className="item"><span style={{ display: 'flex', gap: 4 }}>{['critica', 'alta', 'media', 'baixa'].map((n) => <span key={n}>{forma(n)}</span>)}</span> Comunidade: crítica, alta, média, baixa</div>
      <div className="item"><span className="pin-base" aria-hidden="true">B</span> Base logística</div>
    </section>
  )
}
