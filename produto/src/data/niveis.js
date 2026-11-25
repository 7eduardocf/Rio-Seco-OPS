// estacoes e codigos reais da ANA, mas os niveis e limiares sao simulados (cenario parecido com 2024)
// TODO: trocar pela API da ANA (HidroWebService)

export const ESTACOES = [
  {
    id: 'manaus', nome: 'Manaus', rio: 'Rio Negro', codigo: '14990000',
    inicio: 24.6, atual: 13.42, limiares: { atencao: 17, alerta: 15, critico: 13 },
    recorde: { cota: 12.11, data: '2024-10-09T12:00:00', fonte: 'Porto de Manaus' },
    atrasoDias: 0,
  },
  {
    id: 'manacapuru', nome: 'Manacapuru', rio: 'Rio Solimões', codigo: '14100000',
    inicio: 15.9, atual: 5.85, limiares: { atencao: 9, alerta: 7, critico: 5 }, atrasoDias: 0,
  },
  {
    id: 'itacoatiara', nome: 'Itacoatiara', rio: 'Rio Amazonas', codigo: '16030000',
    inicio: 11.8, atual: 1.64, limiares: { atencao: 5, alerta: 3.15, critico: 1.5 }, atrasoDias: 0,
  },
  {
    // sem leitura ha 2 dias pra testar o aviso de dado desatualizado (RN06)
    id: 'tabatinga', nome: 'Tabatinga', rio: 'Rio Solimões', codigo: '10100000',
    inicio: 9.4, atual: 0.38, limiares: { atencao: 3, alerta: 1.4, critico: 0.5 }, atrasoDias: 2,
  },
]

export const HORA_LEITURA = 7 // leitura das 7h
const DIAS = 120

// ruido fixo pra serie nao mudar a cada F5
function ruido(i, semente) {
  const x = Math.sin(i * 12.9898 + semente * 78.233) * 43758.5453
  return (x - Math.floor(x) - 0.5) * 0.06
}

function ultimaLeitura(agora, atrasoDias) {
  const d = new Date(agora)
  if (d.getHours() < HORA_LEITURA) d.setDate(d.getDate() - 1)
  d.setDate(d.getDate() - atrasoDias)
  d.setHours(HORA_LEITURA, 0, 0, 0)
  return d
}

export function gerarSerie(est, agora = new Date()) {
  const fim = ultimaLeitura(agora, est.atrasoDias)
  const semente = est.codigo.charCodeAt(2) + est.codigo.charCodeAt(4)
  const serie = []
  for (let i = 0; i < DIAS; i++) {
    const t = i / (DIAS - 1)
    const base = est.inicio - (est.inicio - est.atual) * (0.6 * t + 0.4 * t * t)
    const r = i === DIAS - 1 ? 0 : ruido(i, semente)
    const data = new Date(fim)
    data.setDate(fim.getDate() - (DIAS - 1 - i))
    serie.push({ data: data.toISOString(), nivel: Math.round((base + r) * 100) / 100 })
  }
  return serie
}

export function statusRio(nivel, limiares) {
  if (nivel <= limiares.critico) return 'critico'
  if (nivel <= limiares.alerta) return 'alerta'
  if (nivel <= limiares.atencao) return 'atencao'
  return 'normal'
}

export function montarEstacoes(agora = new Date()) {
  return ESTACOES.map((est) => {
    const serie = gerarSerie(est, agora)
    const atual = serie[serie.length - 1]
    const anterior = serie[serie.length - 2]
    const horasDesde = (agora - new Date(atual.data)) / 36e5
    return {
      ...est,
      serie,
      nivel: atual.nivel,
      leituraEm: atual.data,
      variacao24h: Math.round((atual.nivel - anterior.nivel) * 100), // cm
      status: statusRio(atual.nivel, est.limiares),
      desatualizada: horasDesde > 26,
      horasDesde,
    }
  })
}
