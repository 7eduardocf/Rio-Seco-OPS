import { useMemo, useState } from 'react'
import { Send, CloudOff, CircleCheck, Inbox } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Cabecalho, Chip, ChipCriticidade } from '../components/ui.jsx'
import { REQ_POR_TELA } from '../data/requisitos.js'
import { BASES, descreverItens } from '../data/seed.js'
import { pode } from '../lib/regras.js'
import { dec, diaRelativo, quando, uid } from '../lib/formato.js'

const MODELOS = {
  nivel: { rotulo: 'Nível do rio', ajuda: 'Avisa que o rio continua baixando e orienta a guardar água.' },
  entrega: { rotulo: 'Entrega a caminho', ajuda: 'Para comunidades com entrega em rota agora.' },
  rota: { rotulo: 'Mudança de rota', ajuda: 'Para comunidades atendidas só pela rota alternativa.' },
  livre: { rotulo: 'Mensagem livre', ajuda: 'Escreva o texto. Use {comunidade} para o nome de cada comunidade.' },
}

export default function Alertas() {
  const { estado, usuario } = useStore()
  const podeEnviar = pode(usuario, 'enviar-alertas')
  const minha = usuario.perfil === 'lideranca' ? estado.comunidades.find((c) => c.id === usuario.comunidadeId) : null
  return (
    <>
      <Cabecalho
        titulo="Alertas às lideranças"
        subtitulo={minha
          ? `Avisos enviados para ${minha.nome}. Eles chegam no WhatsApp da liderança cadastrada.`
          : 'Mensagens para o WhatsApp das lideranças comunitárias, montadas a partir dos dados do sistema.'}
        reqs={REQ_POR_TELA.alertas}
      />
      {podeEnviar ? (
        <div className="alertas-layout">
          <Compor />
          <Historico />
        </div>
      ) : (
        <CaixaLideranca comunidade={minha} />
      )}
    </>
  )
}

function useContexto() {
  const { estado, estacoes, criticidades } = useStore()
  return useMemo(() => ({ estado, estacoes, criticidades }), [estado, estacoes, criticidades])
}

function montar(tipo, c, ctx, livre) {
  const est = ctx.estacoes.find((e) => e.id === c.estacao)
  const k = ctx.criticidades[c.id]
  if (tipo === 'nivel') {
    return `${c.nome}: o ${est.rio} em ${est.nome} está em ${dec(est.nivel)} m e continua baixando. Guardem água potável e avisem a Defesa Civil se faltar água, comida ou remédio.`
  }
  if (tipo === 'entrega') {
    const e = ctx.estado.entregas.find((x) => x.comunidadeId === c.id && x.status === 'Em Rota')
    const rota = e && ctx.estado.rotas.find((r) => r.id === e.rotaId)
    const base = rota && BASES.find((b) => b.id === rota.baseId)
    return e
      ? `${c.nome}: a entrega de ${descreverItens(e.itens)} saiu da ${base?.nome ?? 'base'} pela rota ${rota?.nome ?? 'combinada'}. Chegada prevista: ${diaRelativo(e.previsao)}.`
      : `${c.nome}: uma entrega está sendo preparada para vocês. Avisaremos quando sair da base.`
  }
  if (tipo === 'rota') {
    const alt = k.acesso.recomendada?.rota
    return `${c.nome}: com a seca, o canal principal ficou intransitável. As próximas entregas seguirão pelo ${alt?.nome ?? 'caminho alternativo'}${k.acesso.exigeValidacao ? ', assim que a rota for confirmada pela equipe' : ''}.`
  }
  return (livre || '').replaceAll('{comunidade}', c.nome)
}

function Compor() {
  const { estado, criticidades, executar, avisar, online } = useStore()
  const ctx = useContexto()
  const [tipo, setTipo] = useState('nivel')
  const [modo, setModo] = useState('criticas')
  const [escolhidas, setEscolhidas] = useState([])
  const [livre, setLivre] = useState('{comunidade}: ')
  const [erro, setErro] = useState('')

  const porModo = {
    criticas: estado.comunidades.filter((c) => criticidades[c.id].nivel === 'critica'),
    emrota: estado.comunidades.filter((c) => estado.entregas.some((e) => e.comunidadeId === c.id && e.status === 'Em Rota')),
    restrito: estado.comunidades.filter((c) => criticidades[c.id].acesso.acesso === 'restrito'),
    escolher: estado.comunidades.filter((c) => escolhidas.includes(c.id)),
  }
  const alvo = porModo[modo]
  const comContato = alvo.filter((c) => c.contato?.telefone)
  const semContato = alvo.filter((c) => !c.contato?.telefone)
  const exemplo = comContato[0]
  const texto = exemplo ? montar(tipo, exemplo, ctx, livre) : ''

  function trocarTipo(t) {
    setTipo(t); setErro('')
    if (t === 'entrega') setModo('emrota')
    else if (t === 'rota') setModo('restrito')
    else if (modo === 'emrota' || modo === 'restrito') setModo('criticas')
  }

  function enviar(e) {
    e.preventDefault()
    if (!comContato.length) { setErro('Nenhuma comunidade escolhida tem contato cadastrado (RN07).'); return }
    if (tipo === 'livre' && livre.replace('{comunidade}', '').replace(/[:\s]/g, '').length < 5) { setErro('Escreva a mensagem antes de enviar.'); return }
    const mensagens = Object.fromEntries(comContato.map((c) => [c.id, montar(tipo, c, ctx, livre)]))
    executar('alerta/enviar', { id: uid('a'), tipo, em: new Date().toISOString(), destinatarios: comContato.map((c) => c.id), mensagens, mensagem: mensagens[comContato[0].id] })
    avisar(online
      ? `Alerta enviado para ${comContato.length} liderança${comContato.length > 1 ? 's' : ''} (simulação).`
      : `Alerta guardado: sai para ${comContato.length} liderança${comContato.length > 1 ? 's' : ''} quando o sinal voltar.`, 'good')
    setErro('')
  }

  return (
    <form className="form-alerta" onSubmit={enviar} noValidate aria-labelledby="t-compor">
      <h2 id="t-compor">Novo alerta</h2>
      <fieldset>
        <legend>Modelo</legend>
        {Object.entries(MODELOS).map(([k, m]) => (
          <label className="marcavel" key={k} style={{ alignItems: 'flex-start', paddingBlock: 6 }}>
            <input type="radio" name="tipo" checked={tipo === k} onChange={() => trocarTipo(k)} style={{ marginTop: 3 }} />
            <span><b style={{ fontWeight: 500 }}>{m.rotulo}</b><span className="nota" style={{ display: 'block' }}>{m.ajuda}</span></span>
          </label>
        ))}
      </fieldset>

      <div className="campo">
        <label htmlFor="a-modo">Para quem</label>
        <select id="a-modo" value={modo} onChange={(e) => setModo(e.target.value)}>
          <option value="criticas">Comunidades em situação crítica ({porModo.criticas.length})</option>
          <option value="emrota">Comunidades com entrega em rota ({porModo.emrota.length})</option>
          <option value="restrito">Comunidades só com rota alternativa ({porModo.restrito.length})</option>
          <option value="escolher">Escolher comunidades</option>
        </select>
      </div>

      {modo === 'escolher' && (
        <div className="lista-dest" role="group" aria-label="Comunidades">
          {[...estado.comunidades].sort((a, b) => criticidades[b.id].pontos - criticidades[a.id].pontos).map((c) => (
            <label className="marcavel" key={c.id} style={{ justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="checkbox" checked={escolhidas.includes(c.id)} onChange={(e) => setEscolhidas((l) => (e.target.checked ? [...l, c.id] : l.filter((x) => x !== c.id)))} />
                {c.nome}{!c.contato && <span className="nota">, sem contato</span>}
              </span>
              <ChipCriticidade nivel={criticidades[c.id].nivel} />
            </label>
          ))}
        </div>
      )}

      {tipo === 'livre' && (
        <div className="campo">
          <label htmlFor="a-livre">Mensagem</label>
          <textarea id="a-livre" value={livre} onChange={(e) => setLivre(e.target.value)} maxLength={600} />
          <span className="ajuda">{livre.length} de 600 caracteres.</span>
        </div>
      )}

      <div className="balao" aria-live="polite">
        <span className="de">{exemplo ? `Prévia para ${exemplo.contato.nome}, ${exemplo.nome}` : 'Prévia da mensagem'}</span>
        <div className="msg">{texto || 'Escolha comunidades com contato cadastrado para ver a prévia.'}</div>
        {comContato.length > 1 && <span className="de">Cada liderança recebe o texto com os dados da própria comunidade.</span>}
      </div>

      {semContato.length > 0 && (
        <div className="aviso">
          <CloudOff size={18} aria-hidden="true" />
          <span>{semContato.length === 1 ? 'Fica de fora por não ter contato cadastrado' : `Ficam de fora ${semContato.length} comunidades sem contato cadastrado`} (RN07): {semContato.map((c) => c.nome).join(', ')}.</span>
        </div>
      )}
      {erro && <span className="erro" role="alert" style={{ color: 'var(--erro)' }}>{erro}</span>}
      <div className="acoes">
        <button className="btn primario" type="submit" disabled={!comContato.length}>
          <Send size={18} aria-hidden="true" /> Enviar para {comContato.length} liderança{comContato.length === 1 ? '' : 's'}
        </button>
      </div>
      <p className="nota">Envio simulado no protótipo; os telefones são fictícios. A versão real usaria a API oficial do WhatsApp Business.</p>
    </form>
  )
}

function Historico() {
  const { estado } = useStore()
  const nome = (id) => estado.usuarios.find((u) => u.id === id)?.nome ?? '-'
  const com = (id) => estado.comunidades.find((c) => c.id === id)?.nome ?? '-'
  const lista = [...estado.alertas].sort((a, b) => (a.em < b.em ? 1 : -1))
  return (
    <section aria-labelledby="t-hist">
      <h2 id="t-hist">Enviados</h2>
      <div className="historico">
        {lista.map((a) => (
          <article key={a.id}>
            <div className="linha">
              <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{MODELOS[a.tipo]?.rotulo ?? 'Alerta'}</b>
              <span>{quando(a.em)}, por {nome(a.por)}</span>
              {a.status === 'aguardando'
                ? <Chip tom="warning" icone={CloudOff}>Aguardando conexão</Chip>
                : <Chip tom="good" icone={CircleCheck}>Enviado (simulação)</Chip>}
            </div>
            <p>{a.mensagens ? a.mensagens[a.destinatarios[0]] : a.mensagem}</p>
            <span className="nota">Para {a.destinatarios.length} liderança{a.destinatarios.length > 1 ? 's' : ''}: {a.destinatarios.slice(0, 4).map(com).join(', ')}{a.destinatarios.length > 4 ? ` e mais ${a.destinatarios.length - 4}` : ''}</span>
          </article>
        ))}
        {!lista.length && <p className="vazio">Nenhum alerta enviado ainda.</p>}
      </div>
    </section>
  )
}

function CaixaLideranca({ comunidade }) {
  const { estado } = useStore()
  if (!comunidade) return <p className="vazio">Seu usuário não está ligado a uma comunidade.</p>
  const lista = estado.alertas.filter((a) => a.destinatarios.includes(comunidade.id)).sort((a, b) => (a.em < b.em ? 1 : -1))
  return (
    <section aria-labelledby="t-caixa" style={{ maxWidth: 680 }}>
      <h2 id="t-caixa" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Inbox size={22} aria-hidden="true" /> Recebidos</h2>
      <div className="historico">
        {lista.map((a) => (
          <article key={a.id}>
            <div className="linha"><b style={{ color: 'var(--ink)', fontWeight: 600 }}>{MODELOS[a.tipo]?.rotulo ?? 'Alerta'}</b><span>{quando(a.em)}</span></div>
            <div className="balao"><div className="msg">{a.mensagens?.[comunidade.id] ?? a.mensagem}</div></div>
          </article>
        ))}
        {!lista.length && <p className="vazio">Nenhum alerta para {comunidade.nome} ainda.</p>}
      </div>
    </section>
  )
}
