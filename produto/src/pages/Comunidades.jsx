import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Map as MapaIcone, Ship, Droplets, Utensils, Pill, Fuel, Phone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Aguardando, Cabecalho, ChipAcesso, ChipCriticidade, ChipRota, Itens, Modal } from '../components/ui.jsx'
import { REQ_POR_TELA } from '../data/requisitos.js'
import { ESTACOES } from '../data/niveis.js'
import { BASES, NECESSIDADES } from '../data/seed.js'
import { NIVEL_CRITICIDADE, pode, validarComunidade } from '../lib/regras.js'
import { dec, horas, num, quando, uid } from '../lib/formato.js'

const haDias = (n) => (n === 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`)
const ICONE_NEC = { agua: Droplets, alimentos: Utensils, medicamentos: Pill, combustivel: Fuel }
const RIOS = ['Rio Negro', 'Rio Solimões', 'Rio Amazonas', 'Rio Madeira', 'Rio Purus', 'Rio Juruá', 'Rio Japurá', 'Rio Içá']

export function Necessidades({ n }) {
  const ativas = Object.entries(n || {}).filter(([, v]) => v)
  if (!ativas.length) return <span className="nota">Nenhuma registrada</span>
  return (
    <span className="itens">
      {ativas.map(([k]) => {
        const I = ICONE_NEC[k]
        return <span key={k}><I size={16} aria-hidden="true" />{NECESSIDADES[k]}</span>
      })}
    </span>
  )
}

export default function Comunidades() {
  const { estado, criticidades, usuario, ui, setUi, pendentes } = useStore()
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState('')
  const [rio, setRio] = useState('')
  const [detalhe, setDetalhe] = useState(ui.abrirComunidade)
  const [editando, setEditando] = useState(null) // comunidade ou 'nova'
  const podeEditar = pode(usuario, 'editar-comunidades')

  useEffect(() => {
    if (ui.abrirComunidade) setUi((u) => ({ ...u, abrirComunidade: null }))
  }, [ui.abrirComunidade, setUi])

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return estado.comunidades
      .map((c) => ({ c, k: criticidades[c.id] }))
      .filter(({ c, k }) => (!t || `${c.nome} ${c.municipio}`.toLowerCase().includes(t)) && (!nivel || k.nivel === nivel) && (!rio || c.rio === rio))
      .sort((a, b) => b.k.pontos - a.k.pontos)
  }, [estado.comunidades, criticidades, busca, nivel, rio])

  const rios = [...new Set(estado.comunidades.map((c) => c.rio))].sort()

  return (
    <>
      <Cabecalho
        titulo="Comunidades"
        subtitulo="Comunidades ribeirinhas acompanhadas, da mais crítica para a menos crítica. Toque em uma linha para ver os detalhes."
        reqs={REQ_POR_TELA.comunidades}
        acoes={(
          <button className="btn primario" onClick={() => setEditando('nova')} disabled={!podeEditar}
            title={podeEditar ? undefined : 'Só a Administração cadastra comunidades (RNF03)'}>
            <Plus size={18} aria-hidden="true" /> Cadastrar comunidade
          </button>
        )}
      />

      <div className="filtros" role="search">
        <label className="busca">
          <span className="sr-only">Buscar por nome ou município</span>
          <Search size={18} aria-hidden="true" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou município" />
        </label>
        <select value={nivel} onChange={(e) => setNivel(e.target.value)} aria-label="Filtrar por criticidade">
          <option value="">Todas as criticidades</option>
          {Object.entries(NIVEL_CRITICIDADE).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
        </select>
        <select value={rio} onChange={(e) => setRio(e.target.value)} aria-label="Filtrar por rio">
          <option value="">Todos os rios</option>
          {rios.map((r) => <option key={r}>{r}</option>)}
        </select>
        <span className="nota" aria-live="polite">{lista.length} de {estado.comunidades.length}</span>
      </div>

      {lista.length === 0 ? (
        <div className="vazio">Nenhuma comunidade com esses filtros. Limpe a busca ou escolha outra criticidade.</div>
      ) : (
        <div className="tabela-wrap">
          <table className="tab stack">
            <thead>
              <tr><th>Comunidade</th><th>Criticidade</th><th className="n">Famílias</th><th>Necessidades</th><th>Acesso</th><th>Último atendimento</th></tr>
            </thead>
            <tbody>
              {lista.map(({ c, k }) => (
                <tr key={c.id} className="clicavel" tabIndex={0} onClick={() => setDetalhe(c.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetalhe(c.id) } }}>
                  <td data-l="Comunidade">
                    <span className="nomecel">{c.nome}</span><span className="sub">{c.municipio}, {c.rio}</span>
                    {pendentes.has(`comunidade:${c.id}`) && <Aguardando />}
                  </td>
                  <td data-l="Criticidade"><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}><ChipCriticidade nivel={k.nivel} pontos={k.pontos} /><span className="nota num">{k.pontos} pts</span></span></td>
                  <td data-l="Famílias" className="n">{num(c.familias)}</td>
                  <td data-l="Necessidades"><Necessidades n={c.necessidades} /></td>
                  <td data-l="Acesso"><ChipAcesso acesso={k.acesso.acesso} /></td>
                  <td data-l="Atendimento">{haDias(k.diasSemAtendimento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalhe && (
        <DetalheComunidade id={detalhe} aoFechar={() => setDetalhe(null)}
          aoEditar={(c) => { setDetalhe(null); setEditando(c) }} />
      )}
      {editando && (
        <FormComunidade inicial={editando === 'nova' ? null : editando} aoFechar={() => setEditando(null)}
          aoSalvar={(id) => { setEditando(null); setDetalhe(id) }} />
      )}
    </>
  )
}

export function DetalheComunidade({ id, aoFechar, aoEditar }) {
  const { estado, criticidades, usuario, setUi } = useStore()
  const c = estado.comunidades.find((x) => x.id === id)
  if (!c) return null
  const k = criticidades[c.id]
  const est = ESTACOES.find((e) => e.id === c.estacao)
  const entregas = estado.entregas.filter((e) => e.comunidadeId === c.id).sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
  const max = Math.max(...k.fatores.map((f) => f.pontos), 1)
  const irPara = (hash, chave) => { setUi((u) => ({ ...u, [chave]: c.id })); aoFechar(); window.location.hash = hash }

  return (
    <Modal lado titulo={c.nome} aoFechar={aoFechar}
      rodape={(
        <>
          <button className="btn" onClick={() => irPara('mapa', 'selecionadaMapa')}><MapaIcone size={18} aria-hidden="true" /> Ver no mapa</button>
          {pode(usuario, 'criar-entregas') && <button className="btn" onClick={() => irPara('entregas', 'novaEntregaPara')}><Ship size={18} aria-hidden="true" /> Planejar entrega</button>}
          {pode(usuario, 'editar-comunidades') && aoEditar && <button className="btn primario" onClick={() => aoEditar(c)}><Pencil size={18} aria-hidden="true" /> Editar</button>}
        </>
      )}>
      <p className="nota" style={{ marginTop: -8 }}>{c.municipio}, {c.rio}</p>
      <div className="pontuacao">
        <b>{k.pontos}</b>
        <span>pontos de criticidade</span>
        <ChipCriticidade nivel={k.nivel} />
      </div>
      <div className="fatores" aria-label="Fatores da pontuação (RN03)">
        {k.fatores.map((f) => (
          <div className="fator" key={f.rotulo}>
            <span>{f.rotulo}</span>
            <span className="barra" aria-hidden="true"><i style={{ width: `${(f.pontos / max) * 100}%` }} /></span>
            <span className="pts">+{f.pontos}</span>
          </div>
        ))}
      </div>

      <dl className="lista-def">
        <dt>Famílias</dt><dd>{num(c.familias)}</dd>
        <dt>Necessidades</dt><dd><Necessidades n={c.necessidades} /></dd>
        <dt>Localização</dt><dd className="num">{dec(c.lat, 4)}, {dec(c.lon, 4)}</dd>
        <dt>Estação de referência</dt><dd>{est ? `${est.nome} (${est.rio}), ${est.codigo}` : '-'}</dd>
        <dt>Liderança</dt>
        <dd>{c.contato ? <span><Phone size={15} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {c.contato.nome}, {c.contato.telefone}</span> : 'Sem contato cadastrado: não recebe alertas (RN07)'}</dd>
        <dt>Último atendimento</dt><dd>{haDias(k.diasSemAtendimento)}</dd>
        {c.obs && (<><dt>Observações</dt><dd>{c.obs}</dd></>)}
      </dl>

      <section>
        <h3 style={{ marginBottom: 10 }}>Rotas a partir da base</h3>
        {k.acesso.avaliacoes.length === 0 && <p className="nota">Nenhuma rota cadastrada para esta comunidade.</p>}
        <div style={{ display: 'grid', gap: 10 }}>
          {k.acesso.avaliacoes.map((a) => (
            <div key={a.rota.id} className={`rota-card${k.acesso.recomendada?.rota.id === a.rota.id ? ' recomendada' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <b>{a.rota.nome}</b>
                <ChipRota avaliacao={a} />
              </div>
              <div className="linha">
                <span>{a.rota.tipo === 'principal' ? 'Rota principal' : 'Rota alternativa'}</span>
                <span>{BASES.find((b) => b.id === a.rota.baseId)?.nome}</span>
                <span>{num(Math.round(a.rota.km))} km, cerca de {horas(a.horas)} de {a.rota.embarcacao.toLowerCase()}</span>
                <span>Precisa de {dec(a.rota.cotaMinima)} m em {a.estacao?.nome}; hoje {dec(a.nivel)} m</span>
              </div>
              {k.acesso.recomendada?.rota.id === a.rota.id && <span className="nota">Rota recomendada agora{k.acesso.exigeValidacao ? ', mas precisa ser validada antes do uso (RN05)' : ''}.</span>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 10 }}>Entregas</h3>
        {entregas.length === 0 ? <p className="nota">Nenhuma entrega registrada.</p> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {entregas.map((e) => (
              <div key={e.id} className="rota-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b>{e.status}</b><span className="nota">{quando(e.historico[e.historico.length - 1].em)}</span></div>
                <Itens itens={e.itens} />
              </div>
            ))}
          </div>
        )}
      </section>
    </Modal>
  )
}

const vazia = {
  nome: '', municipio: '', rio: 'Rio Solimões', estacao: 'manacapuru', lat: '', lon: '', familias: '',
  necessidades: { agua: false, alimentos: false, medicamentos: false, combustivel: false },
  contato: { nome: '', telefone: '' }, obs: '',
}

export function FormComunidade({ inicial, aoFechar, aoSalvar }) {
  const { executar, avisar, online } = useStore()
  const [f, setF] = useState(() => (inicial
    ? { ...vazia, ...inicial, lat: String(inicial.lat).replace('.', ','), lon: String(inicial.lon).replace('.', ','), familias: String(inicial.familias), contato: inicial.contato || { nome: '', telefone: '' } }
    : vazia))
  const [erros, setErros] = useState({})
  const [tentou, setTentou] = useState(false)
  const muda = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }))

  function salvar(e) {
    e.preventDefault()
    setTentou(true)
    const v = validarComunidade(f)
    setErros(v.erros)
    if (!v.ok) {
      document.getElementById(`f-${Object.keys(v.erros)[0]}`)?.focus()
      return
    }
    const id = inicial?.id || uid('c')
    const contato = f.contato.nome.trim() || f.contato.telefone.trim() ? { nome: f.contato.nome.trim(), telefone: f.contato.telefone.trim() } : null
    executar('comunidade/salvar', {
      id, nome: f.nome.trim(), municipio: f.municipio.trim(), rio: f.rio, estacao: f.estacao,
      lat: v.lat, lon: v.lon, familias: v.familias, necessidades: f.necessidades, contato, obs: f.obs.trim(),
      ultimoAtendimento: inicial?.ultimoAtendimento || new Date().toISOString(),
    })
    avisar(`${inicial ? 'Alterações salvas' : 'Comunidade cadastrada'}${online ? '' : ' neste aparelho; será enviada quando o sinal voltar'}.`, 'good')
    aoSalvar(id)
  }

  const prop = (campo) => ({ id: `f-${campo}`, 'aria-invalid': tentou && !!erros[campo], 'aria-describedby': erros[campo] ? `e-${campo}` : undefined })
  const Erro = ({ campo }) => (tentou && erros[campo] ? <span className="erro" id={`e-${campo}`}>{erros[campo]}</span> : null)

  return (
    <Modal titulo={inicial ? `Editar ${inicial.nome}` : 'Cadastrar comunidade'} aoFechar={aoFechar} largo
      rodape={(<><button className="btn" onClick={aoFechar}>Cancelar</button><button className="btn primario" form="form-comunidade" type="submit">{inicial ? 'Salvar alterações' : 'Cadastrar comunidade'}</button></>)}>
      <form id="form-comunidade" onSubmit={salvar} noValidate style={{ display: 'grid', gap: 16 }}>
        <p className="nota">Nome e localização são obrigatórios (RN01). Use coordenadas em graus decimais, como aparecem no GPS.</p>
        <div className="grade-2">
          <div className="campo"><label htmlFor="f-nome">Nome da comunidade</label><input {...prop('nome')} value={f.nome} onChange={muda('nome')} data-autofoco /><Erro campo="nome" /></div>
          <div className="campo"><label htmlFor="f-municipio">Município</label><input {...prop('municipio')} value={f.municipio} onChange={muda('municipio')} /><Erro campo="municipio" /></div>
          <div className="campo"><label htmlFor="f-rio">Rio</label><select id="f-rio" value={f.rio} onChange={muda('rio')}>{RIOS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="campo">
            <label htmlFor="f-estacao">Estação de referência</label>
            <select id="f-estacao" value={f.estacao} onChange={muda('estacao')}>{ESTACOES.map((e) => <option key={e.id} value={e.id}>{e.nome} ({e.rio})</option>)}</select>
            <span className="ajuda">O nível dessa estação define se as rotas estão transitáveis.</span>
          </div>
          <div className="campo"><label htmlFor="f-lat">Latitude</label><input {...prop('lat')} inputMode="decimal" value={f.lat} onChange={muda('lat')} placeholder="-3,12" /><Erro campo="lat" /></div>
          <div className="campo"><label htmlFor="f-lon">Longitude</label><input {...prop('lon')} inputMode="decimal" value={f.lon} onChange={muda('lon')} placeholder="-60,02" /><Erro campo="lon" /></div>
          <div className="campo"><label htmlFor="f-familias">Número de famílias</label><input {...prop('familias')} inputMode="numeric" value={f.familias} onChange={muda('familias')} /><Erro campo="familias" /></div>
        </div>
        <fieldset>
          <legend>Necessidades identificadas</legend>
          <div className="grade-2" style={{ gap: 0 }}>
            {Object.entries(NECESSIDADES).map(([k, rotulo]) => (
              <label className="marcavel" key={k}>
                <input type="checkbox" checked={f.necessidades[k]} onChange={(e) => setF((x) => ({ ...x, necessidades: { ...x.necessidades, [k]: e.target.checked } }))} />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grade-2">
          <div className="campo"><label htmlFor="f-cnome">Liderança comunitária</label><input id="f-cnome" value={f.contato.nome} onChange={(e) => setF((x) => ({ ...x, contato: { ...x.contato, nome: e.target.value } }))} /></div>
          <div className="campo"><label htmlFor="f-telefone">WhatsApp da liderança</label><input {...prop('telefone')} inputMode="tel" value={f.contato.telefone} onChange={(e) => setF((x) => ({ ...x, contato: { ...x.contato, telefone: e.target.value } }))} placeholder="(92) 90000-0000" /><Erro campo="telefone" /><span className="ajuda">Sem contato, a comunidade não recebe alertas (RN07).</span></div>
        </div>
        <div className="campo"><label htmlFor="f-obs">Observações</label><textarea id="f-obs" value={f.obs} onChange={muda('obs')} /></div>
      </form>
    </Modal>
  )
}
