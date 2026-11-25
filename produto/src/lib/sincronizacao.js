// fila offline (RF06, RN04, RNF06)
// online aplica direto no "servidor"; offline guarda na fila e a tela mostra por cima.
// ao sincronizar descarta o que tiver a mesma chave

export function chaveDe(tipo, p) {
  switch (tipo) {
    case 'comunidade/salvar': return `comunidade:${p.id}`
    case 'entrega/criar': return `entrega:${p.id}:criar`
    case 'entrega/mover': return `entrega:${p.id}:status:${p.status}`
    case 'rota/validar': return `rota:${p.id}:validar`
    case 'alerta/enviar': return `alerta:${p.id}`
    case 'usuario/salvar': return `usuario:${p.id}`
    default: return `${tipo}:${JSON.stringify(p)}`
  }
}

// pra marcar o "aguardando sincronização" na tela
export function entidadeDe(op) {
  const p = op.payload
  if (op.tipo.startsWith('entrega/')) return `entrega:${p.id}`
  if (op.tipo.startsWith('comunidade/')) return `comunidade:${p.id}`
  if (op.tipo.startsWith('rota/')) return `rota:${p.id}`
  if (op.tipo.startsWith('alerta/')) return `alerta:${p.id}`
  if (op.tipo.startsWith('usuario/')) return `usuario:${p.id}`
  return op.tipo
}

const upsert = (lista, item) => (lista.some((x) => x.id === item.id)
  ? lista.map((x) => (x.id === item.id ? { ...x, ...item } : x))
  : [...lista, item])

export function aplicar(estado, op) {
  const p = op.payload
  switch (op.tipo) {
    case 'comunidade/salvar':
      return { ...estado, comunidades: upsert(estado.comunidades, p) }
    case 'usuario/salvar':
      return { ...estado, usuarios: upsert(estado.usuarios, p) }
    case 'entrega/criar':
      if (estado.entregas.some((e) => e.id === p.id)) return estado
      return { ...estado, entregas: [...estado.entregas, p] }
    case 'entrega/mover':
      return {
        ...estado,
        entregas: estado.entregas.map((e) => (e.id !== p.id || e.status === p.status ? e : {
          ...e,
          status: p.status,
          rotaId: p.rotaId ?? e.rotaId,
          embarcacao: p.embarcacao ?? e.embarcacao,
          previsao: p.previsao ?? e.previsao,
          comprovante: p.comprovante ?? e.comprovante,
          historico: [...e.historico, { status: p.status, em: op.em, por: op.por, offline: !!op.offline }],
        })),
      }
    case 'rota/validar':
      return {
        ...estado,
        rotas: estado.rotas.map((r) => (r.id !== p.id || r.validacao ? r : { ...r, validacao: { por: op.por, em: op.em, obs: p.obs || '' } })),
      }
    case 'alerta/enviar':
      if (estado.alertas.some((a) => a.id === p.id)) return estado
      return { ...estado, alertas: [{ ...p, status: 'enviado' }, ...estado.alertas] }
    default:
      return estado
  }
}

function jaAplicada(estado, op) {
  const p = op.payload
  switch (op.tipo) {
    case 'entrega/criar': return estado.entregas.some((e) => e.id === p.id)
    case 'entrega/mover': return estado.entregas.some((e) => e.id === p.id && e.status === p.status)
    case 'rota/validar': return estado.rotas.some((r) => r.id === p.id && r.validacao)
    case 'alerta/enviar': return estado.alertas.some((a) => a.id === p.id)
    default: return false
  }
}

export function vistaLocal(servidor, fila) {
  return fila.reduce((s, op) => {
    const r = aplicar(s, op)
    if (op.tipo === 'alerta/enviar') {
      return { ...r, alertas: r.alertas.map((a) => (a.id === op.payload.id ? { ...a, status: 'aguardando' } : a)) }
    }
    return r
  }, servidor)
}

export function sincronizar(servidor, fila, agora = new Date()) {
  const ultima = new Map()
  fila.forEach((op) => ultima.set(op.chave, op))
  const unicas = fila.filter((op) => ultima.get(op.chave) === op)
  let s = servidor
  let aplicadas = 0
  let jaNoServidor = 0
  for (const op of unicas) {
    if (jaAplicada(s, op)) { jaNoServidor++; continue }
    s = aplicar(s, op)
    aplicadas++
  }
  return {
    servidor: s,
    relatorio: { em: agora.toISOString(), enviadas: fila.length, aplicadas, duplicadas: fila.length - unicas.length, jaNoServidor },
  }
}
