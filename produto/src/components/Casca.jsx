import { useEffect, useRef, useState } from 'react'
import {
  Gauge, Users, Map as MapaIcone, Ship, Megaphone, ShieldCheck, ListChecks,
  Wifi, WifiOff, Cloud, CloudOff, Menu, RefreshCw, Copy,
} from 'lucide-react'
import { useStore } from '../store.jsx'
import { PERFIS, pode } from '../lib/regras.js'
import { cm, dec, hora, quando } from '../lib/formato.js'

export const PAGINAS = [
  { id: 'painel', rotulo: 'Painel dos rios', icone: Gauge },
  { id: 'comunidades', rotulo: 'Comunidades', icone: Users },
  { id: 'mapa', rotulo: 'Mapa e rotas', icone: MapaIcone },
  { id: 'entregas', rotulo: 'Entregas', icone: Ship },
  { id: 'alertas', rotulo: 'Alertas', icone: Megaphone },
  { id: 'usuarios', rotulo: 'Usuários e perfis', icone: ShieldCheck, permissao: 'gerenciar-usuarios' },
  { id: 'requisitos', rotulo: 'Requisitos', icone: ListChecks },
]

const BASE = 7.5
const TOPO = 30.5 // cheia recorde de 2021 foi 30,02
const pct = (v) => `${((v - BASE) / (TOPO - BASE)) * 100}%`

function Regua({ estacao }) {
  const marcas = []
  for (let v = Math.ceil(BASE); v <= Math.floor(TOPO); v += 1) marcas.push(v)
  return (
    <div className="regua" aria-hidden="true">
      <div className="agua" style={{ height: pct(estacao.nivel) }}>
        <svg className="onda" viewBox="0 0 200 10" preserveAspectRatio="none">
          <path d="M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6 T125 6 T150 6 T175 6 T200 6 V10 H0Z" fill="currentColor" />
        </svg>
      </div>
      {estacao.recorde && (
        <div className="recorde" style={{ bottom: pct(estacao.recorde.cota) }}>
          <span>mínima de 2024: {dec(estacao.recorde.cota)} m</span>
        </div>
      )}
      <div className="marcas">
        {marcas.map((v) => {
          const molhada = v < estacao.nivel
          return (
            <div key={v} className={`tique${v % 2 === 0 ? ' metro' : ''}`}
              style={{ bottom: pct(v), color: molhada ? 'var(--agua-ink)' : 'var(--lateral-muted)' }}>
              {v % 2 === 0 && <em>{v}</em>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Lateral({ pagina, aberta, aoNavegar }) {
  const { estacoes, usuario, estado, trocarUsuario } = useStore()
  const manaus = estacoes.find((e) => e.id === 'manaus')
  const minhaComunidade = pode(usuario, 'ver-todas-entregas') ? null : usuario.comunidadeId
  const pendentes = estado.entregas.filter((e) => e.status === 'Pendente' && (!minhaComunidade || e.comunidadeId === minhaComunidade)).length
  return (
    <aside className={`lateral${aberta ? ' aberta' : ''}`} aria-label="Navegação principal">
      <Regua estacao={manaus} />
      <div className="marca">
        <strong>Rio Seco OPS</strong>
        <span>Protótipo acadêmico, dados simulados</span>
      </div>
      <nav className="nav">
        {PAGINAS.filter((p) => !p.permissao || pode(usuario, p.permissao)).map((p) => {
          const I = p.icone
          return (
            <a key={p.id} href={`#${p.id}`} aria-current={pagina === p.id ? 'page' : undefined} onClick={aoNavegar}>
              <I size={20} aria-hidden="true" />
              {p.rotulo}
              {p.id === 'entregas' && pendentes > 0 && <span className="cont" aria-label={`${pendentes} pendentes`}>{pendentes}</span>}
            </a>
          )
        })}
      </nav>
      <div className="perfil-lateral">
        <label>
          Entrar como
          <select value={usuario.id} onChange={(e) => trocarUsuario(e.target.value)}>
            {estado.usuarios.filter((u) => u.ativo).map((u) => (
              <option key={u.id} value={u.id}>{u.nome}, {PERFIS[u.perfil].nome.toLowerCase()}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="leitura">
        <small>{manaus.rio} em {manaus.nome}</small>
        <b>{dec(manaus.nivel)} m</b>
        <span>{cm(manaus.variacao24h)} por dia, leitura das {hora(manaus.leituraEm)}</span>
      </div>
    </aside>
  )
}

function descrever(op, estado) {
  const p = op.payload
  const com = (id) => estado.comunidades.find((c) => c.id === id)?.nome ?? 'comunidade'
  switch (op.tipo) {
    case 'entrega/mover': {
      const e = estado.entregas.find((x) => x.id === p.id)
      return `Entrega para ${com(e?.comunidadeId)} passou para ${p.status}`
    }
    case 'entrega/criar': return `Nova entrega para ${com(p.comunidadeId)}`
    case 'comunidade/salvar': return `Cadastro da comunidade ${p.nome}`
    case 'rota/validar': return `Validação da rota ${estado.rotas.find((r) => r.id === p.id)?.nome ?? ''}`
    case 'alerta/enviar': return `Alerta para ${p.destinatarios.length} comunidade${p.destinatarios.length > 1 ? 's' : ''}`
    case 'usuario/salvar': return `Cadastro do usuário ${p.nome}`
    default: return op.tipo
  }
}

function PainelFila({ aoFechar }) {
  const { fila, online, sincronizarAgora, simularDuplicado, ultimaSync, estado, avisar } = useStore()
  const ref = useRef(null)
  useEffect(() => {
    const fora = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.('[data-abre-fila]')) aoFechar() }
    const esc = (e) => { if (e.key === 'Escape') aoFechar() }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc) }
  }, [aoFechar])
  return (
    <div className="fila-painel" ref={ref} role="dialog" aria-label="Registros aguardando sincronização">
      <h3>Registros guardados neste aparelho</h3>
      {fila.length === 0 ? (
        <p className="nota">Nada aguardando envio. Tudo o que você registrou já está no servidor.</p>
      ) : (
        <ol>
          {fila.map((op) => (
            <li key={op.id}>{descrever(op, estado)}, {hora(op.em)}{op.reenvio ? ' (reenvio)' : ''}</li>
          ))}
        </ol>
      )}
      {ultimaSync && (
        <p className="rel">
          Última sincronização {quando(ultimaSync.em)}: {ultimaSync.aplicadas} aplicado{ultimaSync.aplicadas === 1 ? '' : 's'}
          {ultimaSync.duplicadas ? `, ${ultimaSync.duplicadas} repetido${ultimaSync.duplicadas > 1 ? 's' : ''} descartado${ultimaSync.duplicadas > 1 ? 's' : ''}` : ''}
          {ultimaSync.jaNoServidor ? `, ${ultimaSync.jaNoServidor} já no servidor` : ''}.
        </p>
      )}
      <p className="nota">Sem conexão, cada alteração fica guardada aqui e é enviada sozinha quando o sinal voltar. Registros repetidos são descartados.</p>
      <div className="acoes">
        <button className="btn primario pequeno" disabled={!online || !fila.length}
          onClick={() => {
            const r = sincronizarAgora()
            if (r) avisar(`${r.aplicadas} registro${r.aplicadas === 1 ? '' : 's'} sincronizado${r.aplicadas === 1 ? '' : 's'}${r.duplicadas ? `, ${r.duplicadas} repetido${r.duplicadas > 1 ? 's' : ''} descartado${r.duplicadas > 1 ? 's' : ''}` : ''}.`, 'good')
          }}>
          <RefreshCw size={16} aria-hidden="true" /> Sincronizar agora
        </button>
        {fila.length > 0 && (
          <button className="btn pequeno" onClick={simularDuplicado} title="Reenvia o último registro, como acontece com sinal instável">
            <Copy size={16} aria-hidden="true" /> Simular reenvio
          </button>
        )}
      </div>
      {!online && fila.length > 0 && <p className="nota">Para enviar, desative "Sem conexão" no topo.</p>}
    </div>
  )
}

export function Topo({ aoAbrirMenu }) {
  const { online, navegadorOnline, offlineSimulado, alternarConexao, fila, estado, usuario, trocarUsuario } = useStore()
  const [filaAberta, setFilaAberta] = useState(false)
  return (
    <div className="topo-fixo">
      <header className="topo">
        <button className="btn fantasma icone so-movel" onClick={aoAbrirMenu} aria-label="Abrir menu">
          <Menu size={24} aria-hidden="true" />
        </button>
        <span className="nome-app so-movel">Rio Seco OPS</span>
        <span className="espaco" />
        <div className="fila">
          <button className="btn pequeno" data-abre-fila aria-expanded={filaAberta} onClick={() => setFilaAberta((v) => !v)}>
            {fila.length ? <CloudOff size={18} aria-hidden="true" /> : <Cloud size={18} aria-hidden="true" />}
            {fila.length ? <><span className="n">{fila.length}</span><span className="txt"> aguardando</span></> : <span className="txt">Sincronizado</span>}
          </button>
          {filaAberta && <PainelFila aoFechar={() => setFilaAberta(false)} />}
        </div>
        <button
          className={`btn pequeno${offlineSimulado ? ' ativo-offline' : ''}`}
          aria-pressed={offlineSimulado} onClick={alternarConexao} disabled={!navegadorOnline}
          title="Simula a perda de sinal para testar o modo offline"
        >
          {online ? <Wifi size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
          <span className="txt">{online ? 'Online' : 'Sem conexão'}</span>
        </button>
        <label className="perfil">
          <span className="rotulo nota">Entrar como</span>
          <select value={usuario.id} onChange={(e) => trocarUsuario(e.target.value)} aria-label="Usuário e perfil em uso">
            {estado.usuarios.filter((u) => u.ativo).map((u) => (
              <option key={u.id} value={u.id}>{u.nome}, {PERFIS[u.perfil].nome.toLowerCase()}</option>
            ))}
          </select>
        </label>
      </header>
      {!online && (
        <div className="faixa-offline" role="status">
          <WifiOff size={18} aria-hidden="true" />
          <span>
            <strong>Sem conexão{!navegadorOnline ? '' : ' (simulado)'}.</strong> O que você registrar fica guardado neste aparelho e é enviado quando o sinal voltar.
          </span>
        </div>
      )}
    </div>
  )
}
