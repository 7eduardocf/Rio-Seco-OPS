import { useEffect, useMemo, useState } from 'react'
import { Plus, Clock, Ship, CircleCheck, Camera, Route as RotaIcone, UserRound, CalendarClock, ShieldAlert, Map as MapaIcone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Aguardando, Cabecalho, Chip, ChipCriticidade, ChipRota, Itens, Modal } from '../components/ui.jsx'
import { REQ_POR_TELA } from '../data/requisitos.js'
import { BASES, ITENS } from '../data/seed.js'
import { NIVEL_CRITICIDADE, STATUS_ENTREGA, avaliarRota, pode, situacaoAcesso } from '../lib/regras.js'
import { dataAno, dec, diaRelativo, horas, num, quando, uid } from '../lib/formato.js'
import { comprimirImagem } from '../lib/imagem.js'

const COLUNAS = [
  { status: 'Pendente', icone: Clock },
  { status: 'Em Rota', icone: Ship },
  { status: 'Entregue', icone: CircleCheck },
]

export default function Entregas() {
  const { estado, estacoes, criticidades, usuario, ui, setUi, executar, avisar, online, pendentes } = useStore()
  const [nova, setNova] = useState(ui.novaEntregaPara ? { comunidadeId: ui.novaEntregaPara } : null)
  const [despachando, setDespachando] = useState(null)
  const [bloqueio, setBloqueio] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [vendo, setVendo] = useState(null)
  const [arrastando, setArrastando] = useState(null)
  const [alvo, setAlvo] = useState(null)
  const podeMover = pode(usuario, 'mover-entregas')
  const podeCriar = pode(usuario, 'criar-entregas')
  const daMinha = !pode(usuario, 'ver-todas-entregas') ? usuario.comunidadeId : null

  useEffect(() => { if (ui.novaEntregaPara) setUi((u) => ({ ...u, novaEntregaPara: null })) }, [ui.novaEntregaPara, setUi])

  const comunidade = (id) => estado.comunidades.find((c) => c.id === id)
  const quandoStatus = (e, s) => [...e.historico].reverse().find((h) => h.status === s)?.em

  const colunas = useMemo(() => {
    const lista = estado.entregas.filter((e) => !daMinha || e.comunidadeId === daMinha)
    return {
      Pendente: lista.filter((e) => e.status === 'Pendente')
        .sort((a, b) => (criticidades[b.comunidadeId]?.pontos ?? 0) - (criticidades[a.comunidadeId]?.pontos ?? 0) || (a.criadoEm < b.criadoEm ? -1 : 1)),
      'Em Rota': lista.filter((e) => e.status === 'Em Rota').sort((a, b) => (quandoStatus(a, 'Em Rota') < quandoStatus(b, 'Em Rota') ? 1 : -1)),
      Entregue: lista.filter((e) => e.status === 'Entregue').sort((a, b) => (quandoStatus(a, 'Entregue') < quandoStatus(b, 'Entregue') ? 1 : -1)),
    }
  }, [estado.entregas, criticidades, daMinha])

  // RN05 - so despacha se tiver rota liberada
  function despachar(e) {
    const c = comunidade(e.comunidadeId)
    const s = situacaoAcesso(c, estado.rotas, estacoes)
    if (!s.recomendada) return setBloqueio({ tipo: 'isolada', entrega: e, comunidade: c })
    if (s.exigeValidacao) return setBloqueio({ tipo: 'validar', entrega: e, comunidade: c, rota: s.recomendada.rota })
    setDespachando({ entrega: e, avaliacao: s.recomendada })
  }

  function mover(id, destino) {
    const e = estado.entregas.find((x) => x.id === id)
    if (!e || e.status === destino) return
    const de = STATUS_ENTREGA.indexOf(e.status)
    const para = STATUS_ENTREGA.indexOf(destino)
    if (para < de) return avisar('O status só avança: Pendente, Em Rota e Entregue (RN02).', 'warning')
    if (para - de > 1) return avisar('Despache a entrega antes de confirmar que ela chegou.', 'warning')
    if (destino === 'Em Rota') despachar(e)
    else setConfirmando(e)
  }

  const sufixo = online ? '' : ' Fica guardado neste aparelho até o sinal voltar.'

  return (
    <>
      <Cabecalho
        titulo="Entregas"
        subtitulo={daMinha
          ? `Entregas para ${comunidade(daMinha)?.nome}. Você acompanha o andamento; a equipe logística atualiza os status.`
          : 'Da saída da base à comprovação com foto. Arraste o cartão para a próxima coluna ou use os botões.'}
        reqs={REQ_POR_TELA.entregas}
        acoes={podeCriar && (
          <button className="btn primario" onClick={() => setNova({})}><Plus size={18} aria-hidden="true" /> Nova entrega</button>
        )}
      />

      <div className="kanban">
        {COLUNAS.map(({ status, icone: I }) => (
          <section key={status} className={`coluna${alvo === status ? ' alvo' : ''}`} aria-labelledby={`col-${status}`}
            onDragOver={(ev) => { if (arrastando) { ev.preventDefault(); setAlvo(status) } }}
            onDragLeave={(ev) => { if (!ev.currentTarget.contains(ev.relatedTarget)) setAlvo(null) }}
            onDrop={(ev) => { ev.preventDefault(); setAlvo(null); const id = ev.dataTransfer.getData('text/plain'); setArrastando(null); if (id) mover(id, status) }}>
            <header>
              <I size={20} aria-hidden="true" />
              <h2 id={`col-${status}`}>{status}</h2>
              <span className="cont">{colunas[status].length}</span>
            </header>
            {status === 'Pendente' && colunas[status].length > 1 && <p className="ordem">Da comunidade mais crítica para a menos crítica (RN03).</p>}
            {colunas[status].length === 0 && (
              <p className="vazio" style={{ padding: 18 }}>
                {status === 'Pendente' ? (podeCriar ? 'Nenhuma entrega esperando. Crie uma a partir das comunidades prioritárias.' : 'Nenhuma entrega esperando saída.') : status === 'Em Rota' ? 'Nenhuma embarcação em rota agora.' : 'Nenhuma entrega confirmada ainda.'}
              </p>
            )}
            {colunas[status].map((e) => (
              <Cartao key={e.id} e={e} c={comunidade(e.comunidadeId)} k={criticidades[e.comunidadeId]}
                rota={estado.rotas.find((r) => r.id === e.rotaId)} estacoes={estacoes} pendente={pendentes.has(`entrega:${e.id}`)}
                podeMover={podeMover} arrastando={arrastando === e.id}
                aoArrastar={(ev) => { ev.dataTransfer.setData('text/plain', e.id); ev.dataTransfer.effectAllowed = 'move'; setArrastando(e.id) }}
                aoSoltar={() => { setArrastando(null); setAlvo(null) }}
                aoDespachar={() => despachar(e)} aoConfirmar={() => setConfirmando(e)} aoVer={() => setVendo(e)} quandoStatus={quandoStatus} />
            ))}
          </section>
        ))}
      </div>

      {nova && (
        <NovaEntrega inicial={nova} aoFechar={() => setNova(null)}
          aoCriar={(entrega) => {
            executar('entrega/criar', entrega)
            avisar(`Entrega para ${comunidade(entrega.comunidadeId)?.nome} criada.${sufixo}`, 'good')
            setNova(null)
          }} />
      )}
      {despachando && (
        <Despachar {...despachando} c={comunidade(despachando.entrega.comunidadeId)} aoFechar={() => setDespachando(null)}
          aoConfirmar={(dados) => {
            executar('entrega/mover', { id: despachando.entrega.id, status: 'Em Rota', rotaId: despachando.avaliacao.rota.id, ...dados })
            avisar(`Entrega para ${comunidade(despachando.entrega.comunidadeId)?.nome} despachada.${sufixo}`, 'good')
            setDespachando(null)
          }} />
      )}
      {bloqueio && <Bloqueio {...bloqueio} aoFechar={() => setBloqueio(null)} irAoMapa={() => { setUi((u) => ({ ...u, selecionadaMapa: bloqueio.comunidade.id })); setBloqueio(null); window.location.hash = 'mapa' }} />}
      {confirmando && (
        <Confirmar e={confirmando} c={comunidade(confirmando.comunidadeId)} aoFechar={() => setConfirmando(null)}
          aoConfirmar={(comprovante) => {
            executar('entrega/mover', { id: confirmando.id, status: 'Entregue', comprovante })
            avisar(`Entrega em ${comunidade(confirmando.comunidadeId)?.nome} confirmada com foto.${sufixo}`, 'good')
            setConfirmando(null)
          }} />
      )}
      {vendo && <Comprovante e={vendo} c={comunidade(vendo.comunidadeId)} aoFechar={() => setVendo(null)} />}
    </>
  )
}

function Cartao({ e, c, k, rota, estacoes, pendente, podeMover, arrastando, aoArrastar, aoSoltar, aoDespachar, aoConfirmar, aoVer, quandoStatus }) {
  const { estado } = useStore()
  const nomeUsuario = (id) => estado.usuarios.find((u) => u.id === id)?.nome ?? '-'
  const arrastavel = podeMover && e.status !== 'Entregue'
  const av = rota ? avaliarRota(rota, estacoes) : null
  return (
    <article className={`cartao${arrastando ? ' arrastando' : ''}`} draggable={arrastavel} onDragStart={arrastavel ? aoArrastar : undefined} onDragEnd={aoSoltar}
      aria-label={`Entrega para ${c?.nome}, ${e.status}`}>
      <div className="cab">
        <b>{c?.nome}<span className="mun">{c?.municipio}</span></b>
        {k && e.status !== 'Entregue' && <ChipCriticidade nivel={k.nivel} pontos={k.pontos} />}
      </div>
      <Itens itens={e.itens} />
      <div className="meta">
        {rota && <span><RotaIcone size={15} aria-hidden="true" />{rota.nome}</span>}
        <span><UserRound size={15} aria-hidden="true" />{e.responsavel}, {e.embarcacao.toLowerCase()}</span>
        {e.status === 'Pendente' && <span><CalendarClock size={15} aria-hidden="true" />Previsão de saída {diaRelativo(e.previsao)}; criada por {nomeUsuario(e.criadoPor)}</span>}
        {e.status === 'Em Rota' && <span><Ship size={15} aria-hidden="true" />Saiu {quando(quandoStatus(e, 'Em Rota'))}; chegada prevista {diaRelativo(e.previsao)}</span>}
        {e.status === 'Entregue' && <span><CircleCheck size={15} aria-hidden="true" />Entregue {quando(quandoStatus(e, 'Entregue'))} por {nomeUsuario(e.comprovante?.por)}</span>}
      </div>
      {e.status === 'Em Rota' && av && !av.transitavel && (
        <Chip tom="critical">A rota ficou intransitável depois da saída</Chip>
      )}
      {pendente && <Aguardando />}
      {e.status === 'Entregue' && e.comprovante?.foto && (
        <button className="miniatura" onClick={aoVer} aria-label={`Ver comprovante da entrega em ${c?.nome}`}>
          <img src={e.comprovante.foto} alt="" />
        </button>
      )}
      {podeMover && e.status !== 'Entregue' && (
        <div className="botoes">
          {e.status === 'Pendente' && <button className="btn pequeno" onClick={aoDespachar}><Ship size={16} aria-hidden="true" /> Despachar</button>}
          {e.status === 'Em Rota' && <button className="btn pequeno" onClick={aoConfirmar}><Camera size={16} aria-hidden="true" /> Confirmar com foto</button>}
        </div>
      )}
      {e.status === 'Entregue' && !e.comprovante?.foto && <span className="nota">Sem foto</span>}
    </article>
  )
}

const EMBARCACOES = ['Balsa', 'Lancha', 'Voadeira', 'Barco regional']

function NovaEntrega({ inicial, aoFechar, aoCriar }) {
  const { estado, estacoes, criticidades, usuario } = useStore()
  const ordenadas = [...estado.comunidades].sort((a, b) => criticidades[b.id].pontos - criticidades[a.id].pontos)
  const [comunidadeId, setComunidadeId] = useState(inicial.comunidadeId || ordenadas[0]?.id)
  const [itens, setItens] = useState({ agua: '', cestas: '', merenda: '', medicamentos: '', combustivel: '' })
  const [embarcacao, setEmbarcacao] = useState('Balsa')
  const [responsavel, setResponsavel] = useState(usuario.nome)
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1)
  const [previsao, setPrevisao] = useState(amanha.toISOString().slice(0, 10))
  const [erro, setErro] = useState('')
  const c = estado.comunidades.find((x) => x.id === comunidadeId)
  const s = c ? situacaoAcesso(c, estado.rotas, estacoes) : null

  function criar(ev) {
    ev.preventDefault()
    const limpos = Object.fromEntries(Object.entries(itens).map(([k, v]) => [k, Number(String(v).replace(/\./g, ''))]).filter(([, v]) => v > 0))
    if (!Object.keys(limpos).length) { setErro('Informe a quantidade de pelo menos um item.'); document.getElementById('i-agua')?.focus(); return }
    if (!responsavel.trim()) { setErro('Informe quem é o responsável pela entrega.'); return }
    const agora = new Date().toISOString()
    aoCriar({
      id: uid('e'), comunidadeId, status: 'Pendente', itens: limpos, criadoEm: agora, criadoPor: usuario.id,
      previsao: new Date(`${previsao}T17:00:00`).toISOString(), embarcacao, responsavel: responsavel.trim(), rotaId: null,
      historico: [{ status: 'Pendente', em: agora, por: usuario.id }], comprovante: null,
    })
  }

  return (
    <Modal titulo="Nova entrega" aoFechar={aoFechar} largo
      rodape={(<><button className="btn" onClick={aoFechar}>Cancelar</button><button className="btn primario" type="submit" form="form-entrega">Criar entrega</button></>)}>
      <form id="form-entrega" onSubmit={criar} noValidate style={{ display: 'grid', gap: 16 }}>
        <div className="campo">
          <label htmlFor="n-com">Comunidade</label>
          <select id="n-com" value={comunidadeId} onChange={(e) => setComunidadeId(e.target.value)} data-autofoco>
            {ordenadas.map((x) => <option key={x.id} value={x.id}>{x.nome}, {x.municipio} (criticidade {NIVEL_CRITICIDADE[criticidades[x.id].nivel].rotulo.toLowerCase()}, {criticidades[x.id].pontos} pts)</option>)}
          </select>
          <span className="ajuda">A lista começa pelas comunidades mais críticas (RN03).</span>
        </div>
        {s && (s.recomendada ? (
          <div className="aviso" style={{ '--tom': s.exigeValidacao ? 'var(--warning)' : 'var(--good)' }}>
            {s.exigeValidacao ? <ShieldAlert size={18} aria-hidden="true" /> : <RotaIcone size={18} aria-hidden="true" />}
            <span>Rota recomendada: <b>{s.recomendada.rota.nome}</b>, {num(Math.round(s.recomendada.rota.km))} km a partir da {BASES.find((b) => b.id === s.recomendada.rota.baseId)?.nome}.{s.exigeValidacao ? ' Ela ainda é uma proposta: valide no Mapa antes de despachar (RN05).' : ''}</span>
          </div>
        ) : (
          <div className="aviso" style={{ '--tom': 'var(--critical)' }}>
            <ShieldAlert size={18} aria-hidden="true" />
            <span>Nenhuma rota fluvial transitável hoje. Você pode criar a entrega, mas ela só sai quando houver rota.</span>
          </div>
        ))}
        <fieldset>
          <legend>Itens</legend>
          <div className="grade-3">
            {Object.entries(ITENS).map(([k, it]) => (
              <div className="campo" key={k}>
                <label htmlFor={`i-${k}`}>{it.rotulo} ({it.unidade})</label>
                <input id={`i-${k}`} inputMode="numeric" value={itens[k]} onChange={(e) => { setErro(''); setItens((x) => ({ ...x, [k]: e.target.value.replace(/[^\d.]/g, '') })) }} />
              </div>
            ))}
          </div>
        </fieldset>
        <div className="grade-3">
          <div className="campo"><label htmlFor="n-emb">Embarcação</label><select id="n-emb" value={embarcacao} onChange={(e) => setEmbarcacao(e.target.value)}>{EMBARCACOES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="campo"><label htmlFor="n-resp">Responsável</label><input id="n-resp" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} /></div>
          <div className="campo"><label htmlFor="n-prev">Previsão de saída</label><input id="n-prev" type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} /></div>
        </div>
        {erro && <p className="campo"><span className="erro" role="alert">{erro}</span></p>}
      </form>
    </Modal>
  )
}

function Despachar({ entrega, avaliacao, c, aoFechar, aoConfirmar }) {
  const [embarcacao, setEmbarcacao] = useState(entrega.embarcacao || avaliacao.rota.embarcacao)
  const chegada = new Date(Date.now() + avaliacao.horas * 36e5)
  return (
    <Modal titulo="Despachar entrega" aoFechar={aoFechar}
      rodape={(<><button className="btn" onClick={aoFechar}>Cancelar</button><button className="btn primario" onClick={() => aoConfirmar({ embarcacao, previsao: chegada.toISOString() })} data-autofoco>Despachar para {c.nome}</button></>)}>
      <Itens itens={entrega.itens} />
      <div className="rota-card recomendada">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><b>{avaliacao.rota.nome}</b><ChipRota avaliacao={avaliacao} /></div>
        <div className="linha">
          <span>{avaliacao.rota.tipo === 'principal' ? 'Rota principal' : 'Rota alternativa validada'}, saindo da {BASES.find((b) => b.id === avaliacao.rota.baseId)?.nome}</span>
          <span>{num(Math.round(avaliacao.rota.km))} km, cerca de {horas(avaliacao.horas)}</span>
          <span>Nível hoje em {avaliacao.estacao.nome}: {dec(avaliacao.nivel)} m (mínimo para navegar: {dec(avaliacao.rota.cotaMinima)} m)</span>
        </div>
      </div>
      <div className="campo"><label htmlFor="d-emb">Embarcação</label><select id="d-emb" value={embarcacao} onChange={(e) => setEmbarcacao(e.target.value)}>{EMBARCACOES.map((x) => <option key={x}>{x}</option>)}</select></div>
      <p className="nota">Chegada estimada {quando(chegada.toISOString())}. A liderança pode ser avisada pela tela de Alertas.</p>
    </Modal>
  )
}

function Bloqueio({ tipo, comunidade, rota, aoFechar, irAoMapa }) {
  const { usuario } = useStore()
  return (
    <Modal titulo={tipo === 'validar' ? 'Rota ainda não validada' : 'Sem rota transitável'} aoFechar={aoFechar}
      rodape={(<><button className="btn" onClick={aoFechar}>Fechar</button><button className="btn primario" onClick={irAoMapa} data-autofoco><MapaIcone size={18} aria-hidden="true" /> Abrir no mapa</button></>)}>
      {tipo === 'validar' ? (
        <>
          <p>A rota principal para <b>{comunidade.nome}</b> está intransitável. A alternativa, <b>{rota.nome}</b>, é só uma proposta e precisa ser validada antes de ser usada (RN05).</p>
          <p className="nota">{pode(usuario, 'validar-rotas') ? 'Valide a rota no mapa e depois despache a entrega.' : 'Peça à Administração para validar a rota no mapa.'}</p>
        </>
      ) : (
        <p>Com o nível de hoje, nenhuma rota fluvial chega a <b>{comunidade.nome}</b>. A entrega continua pendente até haver rota; avalie apoio aéreo ou terrestre.</p>
      )}
    </Modal>
  )
}

function Confirmar({ e, c, aoFechar, aoConfirmar }) {
  const { usuario } = useStore()
  const [foto, setFoto] = useState(null)
  const [obs, setObs] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function escolher(ev) {
    const arq = ev.target.files?.[0]
    if (!arq) return
    setErro(''); setCarregando(true)
    try { setFoto(await comprimirImagem(arq)) } catch (x) { setErro(x.message) } finally { setCarregando(false) }
  }
  function confirmar() {
    if (!foto) { setErro('Anexe a foto da entrega: ela é o comprovante (RF07).'); document.getElementById('c-foto')?.focus(); return }
    aoConfirmar({ foto, em: new Date().toISOString(), por: usuario.id, obs: obs.trim() })
  }

  return (
    <Modal titulo={`Confirmar entrega em ${c.nome}`} aoFechar={aoFechar}
      rodape={(<><button className="btn" onClick={aoFechar}>Cancelar</button><button className="btn primario" onClick={confirmar} disabled={carregando}>Confirmar entrega</button></>)}>
      <Itens itens={e.itens} />
      <div className="campo">
        <label htmlFor="c-foto">Foto da entrega</label>
        <input id="c-foto" type="file" accept="image/*" capture="environment" onChange={escolher} aria-invalid={!!erro && !foto} aria-describedby="c-ajuda" data-autofoco />
        <span className="ajuda" id="c-ajuda">Fotografe os itens na comunidade, de preferência com a liderança. A foto é reduzida antes de ser guardada.</span>
        {erro && <span className="erro" role="alert">{erro}</span>}
      </div>
      {carregando && <p className="nota">Preparando a foto…</p>}
      {foto && <img src={foto} alt="Prévia da foto do comprovante" className="foto-grande" />}
      <div className="campo"><label htmlFor="c-obs">Quem recebeu e observações (opcional)</label><textarea id="c-obs" value={obs} onChange={(ev) => setObs(ev.target.value)} placeholder="Ex.: recebido por Raimundo Pereira na escola da comunidade" /></div>
    </Modal>
  )
}

function Comprovante({ e, c, aoFechar }) {
  const { estado } = useStore()
  const nome = (id) => estado.usuarios.find((u) => u.id === id)?.nome ?? '-'
  return (
    <Modal titulo={`Comprovante: ${c?.nome}`} aoFechar={aoFechar} largo>
      <img src={e.comprovante.foto} alt={`Foto da entrega em ${c?.nome}`} className="foto-grande" />
      <dl className="lista-def">
        <dt>Entregue em</dt><dd>{dataAno(e.comprovante.em)}, {quando(e.comprovante.em)}</dd>
        <dt>Registrado por</dt><dd>{nome(e.comprovante.por)}</dd>
        {e.comprovante.obs && (<><dt>Observações</dt><dd>{e.comprovante.obs}</dd></>)}
        <dt>Itens</dt><dd><Itens itens={e.itens} /></dd>
      </dl>
      <section>
        <h3 style={{ marginBottom: 8 }}>Histórico</h3>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
          {e.historico.map((h, i) => <li key={i}>{h.status}, {quando(h.em)} por {nome(h.por)}{h.offline ? ' (registrado sem conexão)' : ''}</li>)}
        </ol>
      </section>
    </Modal>
  )
}
