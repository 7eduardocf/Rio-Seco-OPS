import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { criarDadosIniciais, VERSAO_DADOS } from './data/seed.js'
import { montarEstacoes } from './data/niveis.js'
import { aplicar, chaveDe, entidadeDe, sincronizar, vistaLocal } from './lib/sincronizacao.js'
import { calcularCriticidade } from './lib/regras.js'
import { uid } from './lib/formato.js'

const CHAVE = 'rio-seco-ops'
const Ctx = createContext(null)

// localStorage pode dar erro (aba anonima, cota cheia), ai segue so em memoria
function ler() {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return null
    const d = JSON.parse(bruto)
    return d && d.servidor?.versao === VERSAO_DADOS ? d : null
  } catch { return null }
}
function gravar(d) {
  try { window.localStorage.setItem(CHAVE, JSON.stringify(d)); return true } catch { return false }
}
function inicial() {
  return ler() || {
    servidor: criarDadosIniciais(new Date()),
    fila: [],
    sessao: { usuarioId: 'u1', offlineSimulado: false },
    ultimaSync: null,
  }
}

export function StoreProvider({ children }) {
  const [dados, setDados] = useState(inicial)
  const [navegadorOnline, setNavegadorOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false))
  const [toasts, setToasts] = useState([])
  const [ui, setUi] = useState({ abrirComunidade: null, selecionadaMapa: null, novaEntregaPara: null })
  const [agora] = useState(() => new Date())
  const avisouArmazenamento = useRef(false)

  const estacoes = useMemo(() => montarEstacoes(agora), [agora])
  const { servidor, fila, sessao, ultimaSync } = dados
  const online = navegadorOnline && !sessao.offlineSimulado
  const estado = useMemo(() => vistaLocal(servidor, fila), [servidor, fila])
  const usuario = estado.usuarios.find((u) => u.id === sessao.usuarioId) || estado.usuarios[0]

  const avisar = useCallback((texto, tom = 'info') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, texto, tom }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5200)
  }, [])

  useEffect(() => {
    const ok = gravar(dados)
    if (!ok && !avisouArmazenamento.current) {
      avisouArmazenamento.current = true
      avisar('O navegador não deixou guardar os dados. Eles valem só enquanto esta aba estiver aberta.', 'warning')
    }
  }, [dados, avisar])

  useEffect(() => {
    const on = () => setNavegadorOnline(true)
    const off = () => setNavegadorOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const executar = useCallback((tipo, payload) => {
    const op = { id: uid('op'), tipo, payload, chave: chaveDe(tipo, payload), em: new Date().toISOString(), por: sessao.usuarioId }
    setDados((d) => {
      const on = navegadorOnline && !d.sessao.offlineSimulado
      return on ? { ...d, servidor: aplicar(d.servidor, op) } : { ...d, fila: [...d.fila, { ...op, offline: true }] }
    })
    return op
  }, [navegadorOnline, sessao.usuarioId])

  const sincronizarAgora = useCallback(() => {
    let rel = null
    setDados((d) => {
      if (!d.fila.length) return d
      const r = sincronizar(d.servidor, d.fila)
      rel = r.relatorio
      return { ...d, servidor: r.servidor, fila: [], ultimaSync: r.relatorio }
    })
    return rel
  }, [])

  // RN04 - voltou a conexao, sincroniza sozinho
  const onlineAnterior = useRef(online)
  useEffect(() => {
    if (online && !onlineAnterior.current && fila.length) {
      const r = sincronizar(servidor, fila)
      setDados((d) => ({ ...d, servidor: r.servidor, fila: [], ultimaSync: r.relatorio }))
      const { aplicadas, duplicadas, jaNoServidor } = r.relatorio
      const extra = [duplicadas && `${duplicadas} repetido${duplicadas > 1 ? 's' : ''} descartado${duplicadas > 1 ? 's' : ''}`, jaNoServidor && `${jaNoServidor} já estava${jaNoServidor > 1 ? 'm' : ''} no servidor`].filter(Boolean).join(', ')
      avisar(`Conexão de volta. ${aplicadas} registro${aplicadas === 1 ? '' : 's'} sincronizado${aplicadas === 1 ? '' : 's'}${extra ? ` (${extra})` : ''}.`, 'good')
    }
    onlineAnterior.current = online
  }, [online, fila, servidor, avisar])

  const alternarConexao = useCallback(() => {
    setDados((d) => ({ ...d, sessao: { ...d.sessao, offlineSimulado: !d.sessao.offlineSimulado } }))
  }, [])

  // pra demonstrar o RNF06 (registro repetido)
  const simularDuplicado = useCallback(() => {
    setDados((d) => (d.fila.length ? { ...d, fila: [...d.fila, { ...d.fila[d.fila.length - 1], id: uid('op'), reenvio: true }] } : d))
  }, [])

  const trocarUsuario = useCallback((usuarioId) => {
    setDados((d) => ({ ...d, sessao: { ...d.sessao, usuarioId } }))
  }, [])

  const restaurarDemo = useCallback(() => {
    setDados({ servidor: criarDadosIniciais(new Date()), fila: [], sessao: { usuarioId: 'u1', offlineSimulado: false }, ultimaSync: null })
    setUi({ abrirComunidade: null, selecionadaMapa: null, novaEntregaPara: null })
  }, [])

  const criticidades = useMemo(() => {
    const ctx = { rotas: estado.rotas, estacoes, entregas: estado.entregas, agora }
    return Object.fromEntries(estado.comunidades.map((c) => [c.id, calcularCriticidade(c, ctx)]))
  }, [estado, estacoes, agora])

  const pendentes = useMemo(() => new Set(fila.map(entidadeDe)), [fila])

  const valor = {
    estado, estacoes, agora, usuario, online, navegadorOnline, offlineSimulado: sessao.offlineSimulado,
    fila, ultimaSync, pendentes, criticidades, toasts, ui, setUi,
    executar, sincronizarAgora, alternarConexao, simularDuplicado, trocarUsuario, restaurarDemo, avisar,
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore fora do StoreProvider')
  return v
}
