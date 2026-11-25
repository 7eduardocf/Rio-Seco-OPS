import { useEffect, useRef } from 'react'
import {
  CircleCheck, CircleAlert, TriangleAlert, OctagonAlert, X, CloudOff, Info,
  Droplets, Package, Utensils, Pill, Fuel, Ban, ShieldCheck, Route,
} from 'lucide-react'
import { ACESSO, NIVEL_CRITICIDADE, STATUS_RIO } from '../lib/regras.js'
import { REQUISITOS } from '../data/requisitos.js'
import { ITENS } from '../data/seed.js'
import { num } from '../lib/formato.js'

const ICONE_TOM = { good: CircleCheck, warning: CircleAlert, serious: TriangleAlert, critical: OctagonAlert, info: Info }

export function Chip({ tom = 'info', icone, children, titulo }) {
  const I = icone || ICONE_TOM[tom] || Info
  return (
    <span className={`chip t-${tom}`} title={titulo}>
      <I size={16} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  )
}

export const ChipRio = ({ status }) => <Chip tom={STATUS_RIO[status].tom}>{STATUS_RIO[status].rotulo}</Chip>
export const ChipCriticidade = ({ nivel, pontos }) => (
  <Chip tom={NIVEL_CRITICIDADE[nivel].tom} titulo={pontos != null ? `Pontuação ${pontos} de 100` : undefined}>
    {NIVEL_CRITICIDADE[nivel].rotulo}
  </Chip>
)
export const ChipAcesso = ({ acesso }) => (
  <Chip tom={ACESSO[acesso].tom} icone={acesso === 'isolada' ? Ban : acesso === 'normal' ? Route : undefined}>
    {ACESSO[acesso].rotulo}
  </Chip>
)

export function ChipRota({ avaliacao }) {
  if (!avaliacao.transitavel) return <Chip tom="critical" icone={Ban}>Intransitável</Chip>
  if (!avaliacao.validada) return <Chip tom="warning">Proposta, falta validar</Chip>
  if (avaliacao.rota.tipo === 'alternativa') return <Chip tom="good" icone={ShieldCheck}>Validada</Chip>
  return <Chip tom="good">Transitável</Chip>
}

export function Aguardando({ texto = 'Aguardando sincronização' }) {
  return (
    <span className="aguardando"><CloudOff size={15} aria-hidden="true" />{texto}</span>
  )
}

export function ReqChips({ ids }) {
  if (!ids?.length) return null
  return (
    <div className="reqs" aria-label="Requisitos atendidos nesta tela">
      {ids.map((id) => {
        const r = REQUISITOS.find((x) => x.id === id)
        return <a key={id} className="req" href="#requisitos" title={r ? `${id}: ${r.texto}` : id}>{id}</a>
      })}
    </div>
  )
}

const ICONE_ITEM = { agua: Droplets, cestas: Package, merenda: Utensils, medicamentos: Pill, combustivel: Fuel }
export function Itens({ itens }) {
  return (
    <div className="itens">
      {Object.entries(itens).map(([k, q]) => {
        const I = ICONE_ITEM[k] || Package
        return (
          <span key={k} title={ITENS[k]?.rotulo}>
            <I size={16} aria-hidden="true" />
            {num(q)} {ITENS[k]?.curto}
          </span>
        )
      })}
    </div>
  )
}

export function Modal({ titulo, aoFechar, children, rodape, largo, lado, rotulo }) {
  const ref = useRef(null)
  const anterior = useRef(null)
  useEffect(() => {
    anterior.current = document.activeElement
    const el = ref.current
    const foco = el?.querySelector('[data-autofoco]') || el?.querySelector('input, select, textarea, button:not([data-fechar])') || el
    foco?.focus()
    const tecla = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); aoFechar() }
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        if (!f.length) return
        const primeiro = f[0]; const ultimo = f[f.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
      }
    }
    document.addEventListener('keydown', tecla)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = overflow
      anterior.current?.focus?.()
    }
  }, [aoFechar])
  return (
    <div className={`modal-fundo${lado ? ' lado' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar() }}>
      <div className={`modal${largo ? ' largo' : ''}`} role="dialog" aria-modal="true" aria-label={rotulo || titulo} ref={ref} tabIndex={-1}>
        <header>
          <h2>{titulo}</h2>
          <button className="btn fantasma icone" onClick={aoFechar} aria-label="Fechar" data-fechar>
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        <div className="corpo">{children}</div>
        {rodape && <footer>{rodape}</footer>}
      </div>
    </div>
  )
}

export function Toasts({ itens }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {itens.map((t) => {
        const I = ICONE_TOM[t.tom] || Info
        return (
          <div key={t.id} className="toast">
            <I size={18} aria-hidden="true" />
            <span>{t.texto}</span>
          </div>
        )
      })}
    </div>
  )
}

export function Cabecalho({ titulo, subtitulo, reqs, acoes, children }) {
  return (
    <div className="cabeca">
      <div className="titulo">
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
        {children}
        <ReqChips ids={reqs} />
      </div>
      {acoes && <div className="acoes">{acoes}</div>}
    </div>
  )
}
