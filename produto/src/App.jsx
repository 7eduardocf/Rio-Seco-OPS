import { useEffect, useState } from 'react'
import { Lateral, PAGINAS, Topo } from './components/Casca.jsx'
import { Toasts } from './components/ui.jsx'
import { useStore } from './store.jsx'
import { pode } from './lib/regras.js'
import Painel from './pages/Painel.jsx'
import Comunidades from './pages/Comunidades.jsx'
import Mapa from './pages/Mapa.jsx'
import Entregas from './pages/Entregas.jsx'
import Alertas from './pages/Alertas.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Requisitos from './pages/Requisitos.jsx'

const TELAS = { painel: Painel, comunidades: Comunidades, mapa: Mapa, entregas: Entregas, alertas: Alertas, usuarios: Usuarios, requisitos: Requisitos }

// rota pelo hash (#mapa, #entregas...) pq no github pages nao da pra configurar o servidor
function lerHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  return TELAS[h] ? h : 'painel'
}

export default function App() {
  const { toasts, usuario } = useStore()
  const [pagina, setPagina] = useState(lerHash)
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    const aoMudar = () => { setPagina(lerHash()); setMenuAberto(false); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  useEffect(() => {
    const p = PAGINAS.find((x) => x.id === pagina)
    document.title = `${p?.rotulo ?? 'Painel'} | Rio Seco OPS`
  }, [pagina])

  const info = PAGINAS.find((p) => p.id === pagina)
  const semAcesso = info?.permissao && !pode(usuario, info.permissao)
  const Tela = semAcesso ? SemAcesso : TELAS[pagina]

  return (
    <div className="app">
      <Lateral pagina={pagina} aberta={menuAberto} aoNavegar={() => setMenuAberto(false)} />
      {menuAberto && <div className="fundo-gaveta" onClick={() => setMenuAberto(false)} aria-hidden="true" />}
      <div className="main">
        <Topo aoAbrirMenu={() => setMenuAberto(true)} />
        <main className="page" id="conteudo">
          <Tela />
        </main>
      </div>
      <Toasts itens={toasts} />
    </div>
  )
}

function SemAcesso() {
  return (
    <div className="vazio" style={{ marginTop: 40 }}>
      <h2>Seu perfil não acessa esta tela</h2>
      <p>Usuários e perfis são gerenciados pela Administração. Troque o usuário no topo da página para ver esta área.</p>
    </div>
  )
}
