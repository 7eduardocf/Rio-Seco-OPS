export const PERFIS = {
  admin: { nome: 'Administração', descricao: 'Defesa Civil: cadastros, usuários e validação de rotas' },
  logistica: { nome: 'Equipe logística', descricao: 'Planeja, despacha e confirma entregas' },
  lideranca: { nome: 'Liderança comunitária', descricao: 'Recebe alertas e acompanha as entregas da sua comunidade' },
}

// RNF03
export const PERMISSOES = [
  { id: 'ver-painel', rotulo: 'Consultar níveis dos rios e mapa', perfis: ['admin', 'logistica', 'lideranca'] },
  { id: 'editar-comunidades', rotulo: 'Cadastrar e editar comunidades', perfis: ['admin'] },
  { id: 'validar-rotas', rotulo: 'Validar rotas alternativas', perfis: ['admin'] },
  { id: 'criar-entregas', rotulo: 'Criar entregas', perfis: ['admin', 'logistica'] },
  { id: 'mover-entregas', rotulo: 'Despachar e confirmar entregas', perfis: ['admin', 'logistica'] },
  { id: 'enviar-alertas', rotulo: 'Enviar alertas às lideranças', perfis: ['admin', 'logistica'] },
  { id: 'gerenciar-usuarios', rotulo: 'Gerenciar usuários e perfis', perfis: ['admin'] },
  { id: 'ver-todas-entregas', rotulo: 'Ver entregas de todas as comunidades', perfis: ['admin', 'logistica'] },
]

export function pode(usuario, permissao) {
  const p = PERMISSOES.find((x) => x.id === permissao)
  return !!(usuario && p && p.perfis.includes(usuario.perfil))
}

export const STATUS_RIO = {
  normal: { rotulo: 'Normal', tom: 'good' },
  atencao: { rotulo: 'Atenção', tom: 'warning' },
  alerta: { rotulo: 'Alerta', tom: 'serious' },
  critico: { rotulo: 'Crítico', tom: 'critical' },
}

export const NIVEL_CRITICIDADE = {
  critica: { rotulo: 'Crítica', tom: 'critical', ordem: 3 },
  alta: { rotulo: 'Alta', tom: 'serious', ordem: 2 },
  media: { rotulo: 'Média', tom: 'warning', ordem: 1 },
  baixa: { rotulo: 'Baixa', tom: 'good', ordem: 0 },
}

export const ACESSO = {
  normal: { rotulo: 'Rota principal', tom: 'good' },
  restrito: { rotulo: 'Só por rota alternativa', tom: 'serious' },
  'sem-rota': { rotulo: 'Sem rota cadastrada', tom: 'warning' },
  isolada: { rotulo: 'Isolada', tom: 'critical' },
}

export const STATUS_ENTREGA = ['Pendente', 'Em Rota', 'Entregue'] // RN02

export function nivelDaEstacao(estacoes, id) {
  return estacoes.find((e) => e.id === id)
}

export function avaliarRota(rota, estacoes) {
  const est = nivelDaEstacao(estacoes, rota.estacao)
  const nivel = est ? est.nivel : null
  const transitavel = nivel != null && nivel >= rota.cotaMinima
  const validada = rota.tipo === 'principal' || !!rota.validacao
  return {
    rota, estacao: est, nivel, transitavel, validada,
    folga: nivel != null ? Math.round((nivel - rota.cotaMinima) * 100) / 100 : null,
    // RN05 - alternativa so pode usar depois de validada
    utilizavel: transitavel && validada,
    horas: Math.round((rota.km / rota.velocidadeKmh) * 10) / 10,
  }
}

export function situacaoAcesso(comunidade, rotas, estacoes) {
  const minhas = rotas.filter((r) => r.comunidadeId === comunidade.id).map((r) => avaliarRota(r, estacoes))
  const principal = minhas.find((a) => a.rota.tipo === 'principal')
  const alternativas = minhas.filter((a) => a.rota.tipo === 'alternativa')
  if (!minhas.length) return { acesso: 'sem-rota', recomendada: null, avaliacoes: [] }
  if (principal && principal.transitavel) return { acesso: 'normal', recomendada: principal, avaliacoes: minhas }
  const validada = alternativas.find((a) => a.transitavel && a.validada)
  if (validada) return { acesso: 'restrito', recomendada: validada, avaliacoes: minhas }
  const proposta = alternativas.find((a) => a.transitavel)
  if (proposta) return { acesso: 'restrito', recomendada: proposta, exigeValidacao: true, avaliacoes: minhas }
  return { acesso: 'isolada', recomendada: null, avaliacoes: minhas }
}

export function diasDesde(iso, agora = new Date()) {
  return Math.max(0, Math.floor((agora - new Date(iso)) / 864e5))
}

// RN03 - pontuacao de 0 a 100
export function calcularCriticidade(comunidade, contexto) {
  const { rotas, estacoes, entregas, agora } = contexto
  const fatores = []
  const acesso = situacaoAcesso(comunidade, rotas, estacoes)
  const pesoAcesso = { isolada: 35, restrito: 20, 'sem-rota': 20, normal: 0 }[acesso.acesso]
  if (pesoAcesso) fatores.push({ rotulo: ACESSO[acesso.acesso].rotulo, pontos: pesoAcesso })

  const pesos = { agua: 15, alimentos: 10, medicamentos: 15, combustivel: 5 }
  const nomes = { agua: 'Falta de água potável', alimentos: 'Falta de alimentos e merenda', medicamentos: 'Falta de medicamentos', combustivel: 'Falta de combustível' }
  for (const [k, v] of Object.entries(comunidade.necessidades || {})) if (v) fatores.push({ rotulo: nomes[k], pontos: pesos[k] })

  const ptsFam = Math.min(10, Math.round((comunidade.familias || 0) / 15))
  if (ptsFam) fatores.push({ rotulo: `${comunidade.familias} famílias`, pontos: ptsFam })

  const ultimaEntrega = entregas
    .filter((e) => e.comunidadeId === comunidade.id && e.status === 'Entregue')
    .map((e) => e.historico[e.historico.length - 1].em)
    .sort()
    .pop()
  const ultimo = [ultimaEntrega, comunidade.ultimoAtendimento].filter(Boolean).sort().pop()
  const dias = ultimo ? diasDesde(ultimo, agora) : 30
  const ptsDias = Math.min(10, Math.floor(dias / 2))
  if (ptsDias) fatores.push({ rotulo: `${dias} dias sem atendimento`, pontos: ptsDias })

  const est = nivelDaEstacao(estacoes, comunidade.estacao)
  if (est && (est.status === 'critico' || est.status === 'alerta')) {
    fatores.push({ rotulo: `Rio em ${est.status === 'critico' ? 'situação crítica' : 'alerta'} em ${est.nome}`, pontos: est.status === 'critico' ? 10 : 5 })
  }

  const pontos = Math.min(100, fatores.reduce((s, f) => s + f.pontos, 0))
  const nivel = pontos >= 70 ? 'critica' : pontos >= 50 ? 'alta' : pontos >= 30 ? 'media' : 'baixa'
  return { pontos, nivel, fatores, acesso, diasSemAtendimento: dias }
}

// RN01
export const LIMITES_AM = { latMin: -10, latMax: 2.3, lonMin: -74, lonMax: -56 }
export function validarComunidade(c) {
  const erros = {}
  if (!c.nome?.trim()) erros.nome = 'Informe o nome da comunidade.'
  if (!c.municipio?.trim()) erros.municipio = 'Informe o município.'
  const lat = Number(String(c.lat).replace(',', '.'))
  const lon = Number(String(c.lon).replace(',', '.'))
  if (c.lat === '' || Number.isNaN(lat)) erros.lat = 'Informe a latitude em graus decimais, por exemplo −3,12.'
  else if (lat < LIMITES_AM.latMin || lat > LIMITES_AM.latMax) erros.lat = 'A latitude fica fora do Amazonas (entre −10 e 2,3).'
  if (c.lon === '' || Number.isNaN(lon)) erros.lon = 'Informe a longitude em graus decimais, por exemplo −60,02.'
  else if (lon < LIMITES_AM.lonMin || lon > LIMITES_AM.lonMax) erros.lon = 'A longitude fica fora do Amazonas (entre −74 e −56).'
  const fam = Number(c.familias)
  if (!Number.isInteger(fam) || fam < 1) erros.familias = 'Informe o número de famílias (1 ou mais).'
  if (c.contato?.telefone && !/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(c.contato.telefone.trim())) erros.telefone = 'Use o formato (92) 90000-0000.'
  return { ok: Object.keys(erros).length === 0, erros, lat, lon, familias: fam }
}
