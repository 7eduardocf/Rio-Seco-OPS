// dados ficticios pra demo (comunidades, pessoas, telefones, rotas)
import geo from './geo.json'

export const VERSAO_DADOS = 3

export const BASES = [
  { id: 'b1', nome: 'Base Manaus', municipio: 'Manaus' },
  { id: 'b2', nome: 'Base Tefé', municipio: 'Tefé' },
  { id: 'b3', nome: 'Base Itacoatiara', municipio: 'Itacoatiara' },
].map((b) => ({ ...b, lat: geo.pontos[b.id][0], lon: geo.pontos[b.id][1] }))

export const ITENS = {
  agua: { rotulo: 'Água potável', unidade: 'L', curto: 'L de água' },
  cestas: { rotulo: 'Cestas básicas', unidade: 'un.', curto: 'cestas básicas' },
  merenda: { rotulo: 'Kits de merenda escolar', unidade: 'kits', curto: 'kits de merenda' },
  medicamentos: { rotulo: 'Kits de medicamentos', unidade: 'kits', curto: 'kits de medicamentos' },
  combustivel: { rotulo: 'Combustível', unidade: 'L', curto: 'L de combustível' },
}

export function descreverItens(itens) {
  const partes = Object.entries(itens).map(([k, q]) => `${new Intl.NumberFormat('pt-BR').format(q)} ${ITENS[k]?.curto ?? k}`)
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : partes[0] || ''
}

export const NECESSIDADES = {
  agua: 'Água potável',
  alimentos: 'Alimentos e merenda',
  medicamentos: 'Medicamentos',
  combustivel: 'Combustível',
}

const COMUNIDADES = [
  ['c01', 'São Sebastião do Lago', 'Careiro da Várzea', 'Rio Amazonas', 'manaus', 142, ['agua', 'alimentos', 'combustivel'], 9, ['Raimundo Pereira', '(92) 90000-0101']],
  ['c02', 'Bom Jesus do Paraná', 'Iranduba', 'Rio Solimões', 'manaus', 96, ['alimentos', 'medicamentos'], 6, ['Francisca Rodrigues', '(92) 90000-0102']],
  ['c03', 'Santa Luzia do Baixio', 'Manacapuru', 'Rio Solimões', 'manacapuru', 118, ['agua', 'medicamentos'], 14, ['Maria do Socorro Lima', '(92) 90000-0103']],
  ['c04', 'Nova Canaã', 'Novo Airão', 'Rio Negro', 'manaus', 64, ['alimentos'], 5, ['José Ribamar Costa', '(92) 90000-0104']],
  ['c05', 'Boa Esperança', 'Manaus (zona rural)', 'Rio Negro', 'manaus', 85, ['medicamentos'], 2, ['Antônia Souza', '(92) 90000-0105']],
  ['c06', 'São Francisco do Lago', 'Anori', 'Rio Solimões', 'manacapuru', 73, ['agua'], 11, ['Pedro Alves', '(97) 90000-0106']],
  ['c07', 'Nossa Senhora de Nazaré', 'Codajás', 'Rio Solimões', 'manacapuru', 104, ['agua', 'alimentos'], 8, ['Luzia Ferreira', '(97) 90000-0107']],
  ['c08', 'Vila Nova do Coari', 'Coari', 'Rio Solimões', 'manacapuru', 132, ['medicamentos', 'combustivel'], 10, ['Sebastião Lopes', '(97) 90000-0108']],
  ['c09', 'Santo Antônio', 'Tefé', 'Rio Solimões', 'manacapuru', 58, ['alimentos'], 4, ['Rosa Maria Silva', '(97) 90000-0109']],
  ['c10', 'Santa Maria', 'Fonte Boa', 'Rio Solimões', 'tabatinga', 95, ['agua', 'alimentos', 'medicamentos'], 24, null],
  ['c11', 'Sagrado Coração', 'Beruri', 'Rio Purus', 'manacapuru', 77, ['agua', 'medicamentos'], 13, ['Benedito Araújo', '(97) 90000-0111']],
  ['c12', 'São Pedro do Madeira', 'Borba', 'Rio Madeira', 'itacoatiara', 121, ['agua', 'combustivel'], 15, ['Manoel Batista', '(97) 90000-0112']],
  ['c13', 'Vista Alegre', 'Nova Olinda do Norte', 'Rio Madeira', 'itacoatiara', 69, ['alimentos'], 3, ['Raquel Moraes', '(92) 90000-0113']],
  ['c14', 'Bela Vista', 'Itacoatiara', 'Rio Amazonas', 'itacoatiara', 88, [], 3, ['Jorge Nascimento', '(92) 90000-0114']],
  ['c15', 'São José do Rio Negro', 'Barcelos', 'Rio Negro', 'manaus', 112, ['medicamentos', 'combustivel'], 19, ['Cleide Tavares', '(97) 90000-0115']],
  ['c16', 'Monte Sião', 'Manaquiri', 'Rio Solimões', 'manaus', 61, ['agua', 'medicamentos'], 12, ['Valdir Gomes', '(92) 90000-0116']],
  ['c17', 'Divino Espírito Santo', 'Santo Antônio do Içá', 'Rio Solimões', 'tabatinga', 83, ['alimentos', 'combustivel'], 7, null],
  ['c18', 'Lago Grande', 'Parintins', 'Rio Amazonas', 'itacoatiara', 150, ['agua'], 6, ['Edna Cardoso', '(92) 90000-0118']],
]

// id, base, tipo, nome, estacao, cota minima (m), embarcacao, km/h, validada ha x dias
const ROTAS = [
  ['p-c01', 'b1', 'principal', 'Rio Amazonas, canal principal', 'manaus', 14.0, 'Balsa', 12],
  ['a-c01', 'b1', 'alternativa', 'Paraná do Careiro', 'manaus', 12.5, 'Lancha', 25],
  ['p-c02', 'b1', 'principal', 'Rio Solimões, canal principal', 'manaus', 12.8, 'Balsa', 12],
  ['a-c02', 'b1', 'alternativa', 'Furo do Ariaú', 'manaus', 15.5, 'Lancha', 25],
  ['p-c03', 'b1', 'principal', 'Rio Solimões, canal principal', 'manacapuru', 6.5, 'Balsa', 12],
  ['a-c03', 'b1', 'alternativa', 'Furo do Baixio', 'manacapuru', 5.2, 'Voadeira', 30],
  ['p-c04', 'b1', 'principal', 'Rio Negro, canal principal', 'manaus', 13.8, 'Balsa', 12],
  ['a-c04', 'b1', 'alternativa', 'Canal das Anavilhanas', 'manaus', 12.9, 'Lancha', 25, 3],
  ['p-c05', 'b1', 'principal', 'Rio Negro, canal principal', 'manaus', 12.0, 'Lancha', 25],
  ['p-c06', 'b1', 'principal', 'Rio Solimões, canal principal', 'manacapuru', 5.0, 'Balsa', 12],
  ['p-c07', 'b1', 'principal', 'Rio Solimões, canal principal', 'manacapuru', 5.5, 'Balsa', 12],
  ['p-c08', 'b2', 'principal', 'Rio Solimões, canal principal', 'manacapuru', 4.8, 'Balsa', 12],
  ['p-c09', 'b2', 'principal', 'Rio Solimões, canal principal', 'manacapuru', 5.3, 'Lancha', 25],
  ['p-c10', 'b2', 'principal', 'Rio Solimões, canal principal', 'tabatinga', 0.6, 'Balsa', 12],
  ['p-c11', 'b1', 'principal', 'Rio Purus, canal principal', 'manacapuru', 6.2, 'Balsa', 12],
  ['a-c11', 'b1', 'alternativa', 'Furo do Jacaré', 'manacapuru', 5.6, 'Voadeira', 30],
  ['p-c12', 'b3', 'principal', 'Rio Madeira, canal principal', 'itacoatiara', 2.1, 'Balsa', 12],
  ['a-c12', 'b3', 'alternativa', 'Furo Grande', 'itacoatiara', 1.4, 'Voadeira', 30],
  ['p-c13', 'b3', 'principal', 'Rio Madeira, canal principal', 'itacoatiara', 1.5, 'Balsa', 12],
  ['p-c14', 'b3', 'principal', 'Rio Amazonas, canal principal', 'itacoatiara', 1.0, 'Lancha', 25],
  ['p-c15', 'b1', 'principal', 'Rio Negro, canal principal', 'manaus', 13.0, 'Balsa', 12],
  ['p-c16', 'b1', 'principal', 'Rio Solimões e Lago Manaquiri', 'manaus', 13.5, 'Balsa', 12],
  ['p-c17', 'b2', 'principal', 'Rio Solimões, canal principal', 'tabatinga', 0.2, 'Balsa', 12],
  ['p-c18', 'b3', 'principal', 'Rio Amazonas, canal principal', 'itacoatiara', 1.2, 'Balsa', 12],
]

const USUARIOS = [
  ['u1', 'Ana Lima', 'admin', null],
  ['u2', 'Carlos Mendes', 'logistica', null],
  ['u3', 'Joana Batista', 'logistica', null],
  ['u4', 'Raimundo Pereira', 'lideranca', 'c01'],
  ['u5', 'Maria do Socorro Lima', 'lideranca', 'c03'],
]

// "foto" das entregas que ja comecam como entregues
export function fotoSimulada(titulo) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#cfe0e8"/><rect y="230" width="640" height="170" fill="#2a2018"/>
  <path d="M0 230 Q160 205 320 228 T640 222 V250 H0Z" fill="#e7d4a2"/>
  <rect x="60" y="150" width="520" height="12" fill="#3f6b3a"/><path d="M40 160 H600 L560 230 H90Z" fill="#9b6a37"/>
  <g fill="#e7d4a2" stroke="#2a2018" stroke-width="3"><rect x="150" y="105" width="70" height="55"/><rect x="230" y="95" width="80" height="65"/><rect x="320" y="110" width="60" height="50"/></g>
  <g fill="#ffffff" stroke="#2a2018" stroke-width="3"><rect x="400" y="115" width="34" height="45" rx="6"/><rect x="440" y="115" width="34" height="45" rx="6"/><rect x="480" y="115" width="34" height="45" rx="6"/></g>
  <rect x="0" y="352" width="640" height="48" fill="rgba(0,0,0,.55)"/>
  <text x="20" y="383" font-family="sans-serif" font-size="22" fill="#fff">Foto simulada: ${titulo}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export function criarDadosIniciais(agora = new Date()) {
  const dias = (n, h = 8, m = 0) => {
    const d = new Date(agora)
    d.setDate(d.getDate() - n)
    d.setHours(h, m, 0, 0)
    return d.toISOString()
  }
  const emDias = (n, h = 17) => dias(-n, h)

  const comunidades = COMUNIDADES.map(([id, nome, municipio, rio, estacao, familias, nec, diasSem, contato]) => ({
    id, nome, municipio, rio, estacao, familias,
    lat: geo.pontos[id][0], lon: geo.pontos[id][1],
    necessidades: Object.fromEntries(Object.keys(NECESSIDADES).map((k) => [k, nec.includes(k)])),
    ultimoAtendimento: dias(diasSem, 10),
    contato: contato ? { nome: contato[0], telefone: contato[1] } : null,
    obs: '',
  }))
  comunidades.find((c) => c.id === 'c10').obs = 'Sem contato cadastrado: a liderança anterior mudou-se para Fonte Boa.'
  comunidades.find((c) => c.id === 'c01').obs = 'Escola municipal sem merenda desde a última vazante.'

  const rotas = ROTAS.map(([id, baseId, tipo, nome, estacao, cotaMinima, embarcacao, velocidadeKmh, validadaHa]) => ({
    id, baseId, tipo, nome, estacao, cotaMinima, embarcacao, velocidadeKmh,
    comunidadeId: id.slice(2),
    km: geo.rotas[id].km,
    validacao: tipo === 'principal'
      ? null
      : validadaHa != null ? { por: 'u1', em: dias(validadaHa, 15, 20), obs: 'Sondagem de profundidade feita pela equipe de campo.' } : null,
  }))

  const e = (id, comunidadeId, status, itens, criadoHa, extra = {}) => ({
    id, comunidadeId, status, itens,
    criadoEm: dias(criadoHa, 9, 15), criadoPor: 'u2',
    previsao: emDias(extra.previsaoEm ?? 2),
    embarcacao: extra.embarcacao ?? 'Balsa',
    responsavel: extra.responsavel ?? 'Carlos Mendes',
    rotaId: extra.rotaId ?? null,
    historico: [{ status: 'Pendente', em: dias(criadoHa, 9, 15), por: 'u2' }, ...(extra.historico ?? [])],
    comprovante: extra.comprovante ?? null,
  })
  const entregas = [
    e('e01', 'c01', 'Pendente', { agua: 2000, cestas: 40 }, 1, { embarcacao: 'Lancha' }),
    e('e02', 'c16', 'Pendente', { agua: 1500, medicamentos: 30 }, 1),
    e('e03', 'c10', 'Pendente', { agua: 3000, merenda: 60, medicamentos: 25 }, 2, { responsavel: 'Joana Batista' }),
    e('e04', 'c03', 'Pendente', { cestas: 35, medicamentos: 20 }, 0, { embarcacao: 'Voadeira' }),
    e('e05', 'c11', 'Pendente', { agua: 1200 }, 0),
    e('e06', 'c02', 'Em Rota', { cestas: 50, merenda: 80 }, 1, { rotaId: 'p-c02', previsaoEm: 0, historico: [{ status: 'Em Rota', em: dias(0, 6, 30), por: 'u2' }] }),
    e('e07', 'c13', 'Em Rota', { cestas: 30, combustivel: 300 }, 2, { rotaId: 'p-c13', previsaoEm: 1, responsavel: 'Joana Batista', historico: [{ status: 'Em Rota', em: dias(1, 7, 10), por: 'u3' }] }),
    e('e08', 'c04', 'Em Rota', { cestas: 25, medicamentos: 10 }, 2, { rotaId: 'a-c04', previsaoEm: 0, embarcacao: 'Lancha', historico: [{ status: 'Em Rota', em: dias(1, 13, 40), por: 'u2' }] }),
    e('e09', 'c05', 'Entregue', { agua: 800 }, 4, {
      rotaId: 'p-c05', embarcacao: 'Lancha', responsavel: 'Joana Batista',
      historico: [{ status: 'Em Rota', em: dias(3, 7, 0), por: 'u3' }, { status: 'Entregue', em: dias(2, 10, 0), por: 'u3' }],
      comprovante: { foto: fotoSimulada('Boa Esperança'), em: dias(2, 10, 0), por: 'u3', obs: 'Recebido pela liderança na escola da comunidade.' },
    }),
    e('e10', 'c14', 'Entregue', { cestas: 40 }, 5, {
      rotaId: 'p-c14', embarcacao: 'Lancha',
      historico: [{ status: 'Em Rota', em: dias(4, 8, 0), por: 'u2' }, { status: 'Entregue', em: dias(3, 10, 0), por: 'u2' }],
      comprovante: { foto: fotoSimulada('Bela Vista'), em: dias(3, 10, 0), por: 'u2', obs: '' },
    }),
  ]

  const alertas = [
    {
      id: 'a1', tipo: 'nivel', em: dias(2, 8, 5), por: 'u1', status: 'enviado',
      destinatarios: ['c01', 'c03', 'c11', 'c12', 'c16'],
      mensagem: 'Atenção: o nível dos rios continua baixando. Guarde água potável e avise a Defesa Civil se faltar.',
    },
    {
      id: 'a2', tipo: 'entrega', em: dias(1, 7, 15), por: 'u3', status: 'enviado', destinatarios: ['c13'],
      mensagem: 'Vista Alegre: a entrega de cestas básicas e combustível saiu hoje da Base Itacoatiara. Previsão de chegada: amanhã.',
    },
    {
      id: 'a3', tipo: 'entrega', em: dias(0, 6, 40), por: 'u2', status: 'enviado', destinatarios: ['c02'],
      mensagem: 'Bom Jesus do Paraná: a entrega de cestas básicas e merenda saiu hoje da Base Manaus. Previsão de chegada: hoje.',
    },
  ]

  const usuarios = USUARIOS.map(([id, nome, perfil, comunidadeId]) => ({ id, nome, perfil, comunidadeId, ativo: true }))

  return { versao: VERSAO_DADOS, criadoEm: agora.toISOString(), comunidades, rotas, entregas, alertas, usuarios }
}
