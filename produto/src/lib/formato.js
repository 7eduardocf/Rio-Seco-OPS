const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const nf0 = new Intl.NumberFormat('pt-BR')

export const metros = (v) => (v == null ? '-' : `${nf2.format(v)} m`)
export const num = (v) => nf0.format(v)
export const dec = (v, casas = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(v)

export function cm(v) {
  if (v === 0) return 'estável'
  return `${v > 0 ? 'sobe' : 'desce'} ${Math.abs(v)} cm`
}

const fData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const fDataAno = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const data = (iso) => fData.format(new Date(iso))
export const dataAno = (iso) => fDataAno.format(new Date(iso))
export const hora = (iso) => fHora.format(new Date(iso))

export function quando(iso, agora = new Date()) {
  const d = new Date(iso)
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0)
  const dia = new Date(d); dia.setHours(0, 0, 0, 0)
  const diff = Math.round((dia - hoje) / 864e5)
  if (diff === 0) return `hoje às ${hora(iso)}`
  if (diff === -1) return `ontem às ${hora(iso)}`
  if (diff === 1) return `amanhã às ${hora(iso)}`
  return `${data(iso)} às ${hora(iso)}`
}

export function diaRelativo(iso, agora = new Date()) {
  const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0)
  const dia = new Date(iso); dia.setHours(0, 0, 0, 0)
  const diff = Math.round((dia - hoje) / 864e5)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  if (diff === -1) return 'ontem'
  return data(iso)
}

export function horas(h) {
  if (h < 1) return `${Math.round(h * 60)} min`
  const H = Math.floor(h); const M = Math.round((h - H) * 60)
  return M ? `${H} h ${M} min` : `${H} h`
}

export const uid = (p = 'x') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
