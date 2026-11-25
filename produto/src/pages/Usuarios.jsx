import { useState } from 'react'
import { Plus, Pencil, Check, Minus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Aguardando, Cabecalho, Chip, Modal } from '../components/ui.jsx'
import { REQ_POR_TELA } from '../data/requisitos.js'
import { PERFIS, PERMISSOES } from '../lib/regras.js'
import { uid } from '../lib/formato.js'

export default function Usuarios() {
  const { estado, pendentes, usuario } = useStore()
  const [editando, setEditando] = useState(null)
  const com = (id) => estado.comunidades.find((c) => c.id === id)?.nome
  return (
    <>
      <Cabecalho
        titulo="Usuários e perfis"
        subtitulo="Quem acessa o Rio Seco OPS e o que cada perfil pode fazer. Troque o usuário no topo da página para ver o sistema com outro perfil."
        reqs={REQ_POR_TELA.usuarios}
        acoes={<button className="btn primario" onClick={() => setEditando('novo')}><Plus size={18} aria-hidden="true" /> Cadastrar usuário</button>}
      />
      <div className="tabela-wrap">
        <table className="tab stack">
          <thead><tr><th>Nome</th><th>Perfil</th><th>Comunidade</th><th>Situação</th><th><span className="sr-only">Ação</span></th></tr></thead>
          <tbody>
            {estado.usuarios.map((u) => (
              <tr key={u.id}>
                <td data-l="Nome"><span className="nomecel">{u.nome}</span>{u.id === usuario.id && <span className="sub">Você</span>}{pendentes.has(`usuario:${u.id}`) && <Aguardando />}</td>
                <td data-l="Perfil">{PERFIS[u.perfil].nome}<span className="sub">{PERFIS[u.perfil].descricao}</span></td>
                <td data-l="Comunidade">{u.comunidadeId ? com(u.comunidadeId) : '-'}</td>
                <td data-l="Situação">{u.ativo ? <Chip tom="good">Ativo</Chip> : <Chip tom="warning">Inativo</Chip>}</td>
                <td data-l=""><button className="btn pequeno" onClick={() => setEditando(u)}><Pencil size={16} aria-hidden="true" /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="secao" aria-labelledby="t-perm">
        <header><h2 id="t-perm">O que cada perfil pode fazer</h2></header>
        <div className="tabela-wrap">
          <table className="tab permissoes">
            <thead><tr><th>Ação</th>{Object.values(PERFIS).map((p) => <th key={p.nome} className="c">{p.nome}</th>)}</tr></thead>
            <tbody>
              {PERMISSOES.map((pm) => (
                <tr key={pm.id}>
                  <td>{pm.rotulo}</td>
                  {Object.keys(PERFIS).map((k) => (
                    <td key={k} className="ok">
                      {pm.perfis.includes(k)
                        ? <><Check size={20} aria-hidden="true" /><span className="sr-only">Pode</span></>
                        : <><Minus size={20} aria-hidden="true" style={{ color: 'var(--muted)' }} /><span className="sr-only">Não pode</span></>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota" style={{ marginTop: 10 }}>No protótipo a troca de usuário é livre para facilitar a demonstração. Na versão real, cada pessoa entra com login e senha e o servidor confere o perfil em cada ação.</p>
      </section>

      {editando && <FormUsuario inicial={editando === 'novo' ? null : editando} aoFechar={() => setEditando(null)} />}
    </>
  )
}

function FormUsuario({ inicial, aoFechar }) {
  const { estado, executar, avisar, usuario } = useStore()
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [perfil, setPerfil] = useState(inicial?.perfil ?? 'logistica')
  const [comunidadeId, setComunidadeId] = useState(inicial?.comunidadeId ?? '')
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true)
  const [erros, setErros] = useState({})
  const eu = inicial?.id === usuario.id

  function salvar(e) {
    e.preventDefault()
    const er = {}
    if (!nome.trim()) er.nome = 'Informe o nome.'
    if (perfil === 'lideranca' && !comunidadeId) er.comunidade = 'Escolha a comunidade da liderança.'
    setErros(er)
    if (Object.keys(er).length) return
    executar('usuario/salvar', { id: inicial?.id || uid('u'), nome: nome.trim(), perfil, comunidadeId: perfil === 'lideranca' ? comunidadeId : null, ativo: eu ? true : ativo })
    avisar(inicial ? 'Usuário atualizado.' : 'Usuário cadastrado.', 'good')
    aoFechar()
  }

  return (
    <Modal titulo={inicial ? `Editar ${inicial.nome}` : 'Cadastrar usuário'} aoFechar={aoFechar}
      rodape={(<><button className="btn" onClick={aoFechar}>Cancelar</button><button className="btn primario" type="submit" form="form-usuario">{inicial ? 'Salvar alterações' : 'Cadastrar usuário'}</button></>)}>
      <form id="form-usuario" onSubmit={salvar} noValidate style={{ display: 'grid', gap: 16 }}>
        <div className="campo">
          <label htmlFor="u-nome">Nome</label>
          <input id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} aria-invalid={!!erros.nome} data-autofoco />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>
        <div className="campo">
          <label htmlFor="u-perfil">Perfil</label>
          <select id="u-perfil" value={perfil} onChange={(e) => setPerfil(e.target.value)} disabled={eu}>
            {Object.entries(PERFIS).map(([k, p]) => <option key={k} value={k}>{p.nome}</option>)}
          </select>
          <span className="ajuda">{eu ? 'Você não pode mudar o próprio perfil.' : PERFIS[perfil].descricao}</span>
        </div>
        {perfil === 'lideranca' && (
          <div className="campo">
            <label htmlFor="u-com">Comunidade</label>
            <select id="u-com" value={comunidadeId} onChange={(e) => setComunidadeId(e.target.value)} aria-invalid={!!erros.comunidade}>
              <option value="">Escolha…</option>
              {estado.comunidades.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {erros.comunidade && <span className="erro">{erros.comunidade}</span>}
          </div>
        )}
        <label className="marcavel"><input type="checkbox" checked={ativo} disabled={eu} onChange={(e) => setAtivo(e.target.checked)} /> Usuário ativo</label>
      </form>
    </Modal>
  )
}
