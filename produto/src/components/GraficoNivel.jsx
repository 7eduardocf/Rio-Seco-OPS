import { useEffect, useMemo, useRef, useState } from 'react'
import { data, dataAno, dec, metros } from '../lib/formato.js'

export default function GraficoNivel({ estacao }) {
  const caixa = useRef(null)
  const [largura, setLargura] = useState(720)
  const [indice, setIndice] = useState(null)
  const serie = estacao.serie

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const observador = new ResizeObserver(([e]) => setLargura(Math.max(280, Math.round(e.contentRect.width))))
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  const estreito = largura < 560
  const A = estreito ? 250 : 320
  const m = { t: 14, r: estreito ? 64 : 78, b: 30, l: estreito ? 34 : 40 }
  const W = largura - m.l - m.r
  const H = A - m.t - m.b

  const { y0, y1, x, y, ticksY, ticksX, caminho, area } = useMemo(() => {
    const niveis = serie.map((p) => p.nivel)
    const minimo = Math.min(...niveis, estacao.recorde?.cota ?? Infinity, estacao.limiares.critico)
    const maximo = Math.max(...niveis)
    const y0 = Math.floor(minimo - 0.6)
    const y1 = Math.ceil(maximo + 0.4)
    const passo = y1 - y0 > 12 ? 4 : 2
    const x = (i) => m.l + (i / (serie.length - 1)) * W
    const y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * H
    const ticksY = []
    for (let v = Math.ceil(y0 / passo) * passo; v <= y1; v += passo) ticksY.push(v)
    const cada = estreito ? 40 : 30
    const ticksX = []
    for (let i = serie.length - 1; i >= 0; i -= cada) ticksX.unshift(i)
    const caminho = serie.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.nivel).toFixed(1)}`).join('')
    const area = `${caminho}L${x(serie.length - 1).toFixed(1)},${(m.t + H).toFixed(1)}L${x(0).toFixed(1)},${(m.t + H).toFixed(1)}Z`
    return { y0, y1, x, y, ticksY, ticksX, caminho, area }
  }, [serie, estacao, W, H, m.l, m.t, estreito])

  const ultimo = serie.length - 1
  const ativo = indice ?? null
  const limiares = [
    { k: 'atencao', rotulo: 'Atenção', v: estacao.limiares.atencao, cor: 'var(--warning)' },
    { k: 'alerta', rotulo: 'Alerta', v: estacao.limiares.alerta, cor: 'var(--serious)' },
    { k: 'critico', rotulo: 'Crítico', v: estacao.limiares.critico, cor: 'var(--critical)' },
  ].filter((l) => l.v > y0 && l.v < y1)

  function aoMover(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left
    const i = Math.round(((px - m.l) / W) * ultimo)
    setIndice(Math.max(0, Math.min(ultimo, i)))
  }
  function aoTeclar(e) {
    const atual = indice ?? ultimo
    const mapa = { ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }
    if (e.key in mapa) { e.preventDefault(); setIndice(Math.max(0, Math.min(ultimo, atual + mapa[e.key]))) }
    if (e.key === 'Home') { e.preventDefault(); setIndice(0) }
    if (e.key === 'End') { e.preventDefault(); setIndice(ultimo) }
    if (e.key === 'Escape') setIndice(null)
  }

  const p = ativo != null ? serie[ativo] : null
  const anterior = ativo > 0 ? serie[ativo - 1] : null
  const dicaX = ativo != null ? x(ativo) : 0
  const dicaEsq = dicaX > largura * 0.6
  const descricao = `Nível do ${estacao.rio} em ${estacao.nome} nos últimos ${serie.length} dias: de ${metros(serie[0].nivel)} em ${data(serie[0].data)} para ${metros(serie[ultimo].nivel)} em ${data(serie[ultimo].data)}. Use as setas para ler dia a dia.`

  return (
    <div className="grafico" ref={caixa}>
      <svg
        width={largura} height={A} role="img" aria-label={descricao} tabIndex={0}
        onPointerMove={aoMover} onPointerLeave={() => setIndice(null)} onKeyDown={aoTeclar}
        onFocus={() => setIndice((i) => i ?? ultimo)} onBlur={() => setIndice(null)}
      >
        {ticksY.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={m.l + W} y1={y(v)} y2={y(v)} stroke="var(--linha)" strokeWidth="1" />
            <text x={m.l - 8} y={y(v) + 4.5} textAnchor="end" fontSize="13" style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</text>
          </g>
        ))}
        <text x={m.l - 8} y={m.t - 2} textAnchor="end" fontSize="13">m</text>
        <line x1={m.l} x2={m.l + W} y1={m.t + H} y2={m.t + H} stroke="var(--linha-forte)" strokeWidth="1" />
        {ticksX.map((i) => (
          <text key={i} x={x(i)} y={m.t + H + 20} textAnchor={i === ultimo ? 'end' : i === 0 ? 'start' : 'middle'} fontSize="13">
            {data(serie[i].data)}
          </text>
        ))}

        <path d={area} fill="var(--preta)" opacity="0.07" />

        {limiares.map((l) => (
          <g key={l.k}>
            <line x1={m.l} x2={m.l + W} y1={y(l.v)} y2={y(l.v)} stroke={l.cor} strokeWidth="1.5" strokeDasharray="5 4" />
            <rect x={m.l + 6} y={y(l.v) - 17} width="10" height="3" rx="1.5" fill={l.cor} />
            <text x={m.l + 21} y={y(l.v) - 12} fontSize="13" style={{ fill: 'var(--ink-2)' }}>{l.rotulo} {dec(l.v)} m</text>
          </g>
        ))}
        {estacao.recorde && (
          <g>
            <line x1={m.l} x2={m.l + W} y1={y(estacao.recorde.cota)} y2={y(estacao.recorde.cota)} stroke="var(--ink)" strokeWidth="1.5" />
            <text x={m.l + 6} y={y(estacao.recorde.cota) + 16} fontSize="13" style={{ fill: 'var(--ink)' }}>
              Mínima histórica {dec(estacao.recorde.cota)} m{estreito ? '' : ` (${dataAno(estacao.recorde.data)})`}
            </text>
          </g>
        )}

        <path d={caminho} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(ultimo)} cy={y(serie[ultimo].nivel)} r="5" fill="var(--ink)" stroke="var(--bg)" strokeWidth="2" />
        <text x={x(ultimo) + 10} y={y(serie[ultimo].nivel) + 5} fontSize="15" fontWeight="600" style={{ fill: 'var(--ink)' }}>
          {dec(serie[ultimo].nivel)} m
        </text>

        {p && (
          <g pointerEvents="none">
            <line x1={dicaX} x2={dicaX} y1={m.t} y2={m.t + H} stroke="var(--ink-2)" strokeWidth="1" />
            <circle cx={dicaX} cy={y(p.nivel)} r="5" fill="var(--ink)" stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {p && (
        <div className="dica" style={{ left: dicaEsq ? undefined : dicaX + 12, right: dicaEsq ? largura - dicaX + 12 : undefined, top: Math.max(0, y(p.nivel) - 60) }}>
          <b>{metros(p.nivel)}</b>
          <span className="chave" aria-hidden="true" />{dataAno(p.data)}
          {anterior && <div style={{ color: 'var(--ink-2)' }}>{p.nivel - anterior.nivel <= 0 ? 'desceu' : 'subiu'} {Math.abs(Math.round((p.nivel - anterior.nivel) * 100))} cm no dia</div>}
        </div>
      )}
    </div>
  )
}

export function Mini({ serie, dias = 30 }) {
  const s = serie.slice(-dias)
  const w = 132, h = 38, pad = 5
  const vs = s.map((p) => p.nivel)
  const a = Math.min(...vs), b = Math.max(...vs)
  const x = (i) => pad + (i / (s.length - 1)) * (w - pad * 2)
  const y = (v) => pad + (1 - (v - a) / (b - a || 1)) * (h - pad * 2)
  const d = s.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.nivel).toFixed(1)}`).join('')
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: 'block' }}>
      <path d={d} fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(s.length - 1)} cy={y(s[s.length - 1].nivel)} r="4" fill="var(--ink)" stroke="var(--bg)" strokeWidth="2" />
    </svg>
  )
}
