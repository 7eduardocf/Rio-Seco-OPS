import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Cabecalho } from '../components/ui.jsx'
import { REQUISITOS } from '../data/requisitos.js'
import { PAGINAS } from '../components/Casca.jsx'

const TIPOS = ['Funcional', 'Não funcional', 'Regra de negócio']

export default function Requisitos() {
  const { restaurarDemo, avisar } = useStore()
  const [tipo, setTipo] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const lista = REQUISITOS.filter((r) => !tipo || r.tipo === tipo)
  const nomeTela = (id) => PAGINAS.find((p) => p.id === id)?.rotulo

  return (
    <>
      <Cabecalho
        titulo="Requisitos no protótipo"
        subtitulo="Onde cada requisito aparece e como conferir. Serve de roteiro para a demonstração e para os cenários do plano de testes."
      />
      <div className="filtros">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo de requisito">
          <option value="">Todos os tipos ({REQUISITOS.length})</option>
          {TIPOS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span className="nota">Numeração do Documento de Requisitos v1.1, mais o RF07 (comprovação por foto) do catálogo do relatório.</span>
      </div>
      <div className="tabela-wrap">
        <table className="tab stack">
          <thead><tr><th>ID</th><th>Requisito</th><th>Onde ver</th><th>Como verificar</th></tr></thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id}>
                <td data-l="ID"><span className="id-req">{r.id}</span><span className="sub tipo-req">{r.tipo}</span></td>
                <td data-l="Requisito">{r.texto}</td>
                <td data-l="Onde ver">{r.tela ? <a href={`#${r.tela}`}>{nomeTela(r.tela)}</a> : 'Todas as telas'}</td>
                <td data-l="Verificar">{r.verificar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="secao" aria-labelledby="t-sim">
        <header><h2 id="t-sim">O que é real e o que é simulado</h2></header>
        <div className="grade-2" style={{ gap: 24 }}>
          <div>
            <h3>Real</h3>
            <ul>
              <li>Municípios, rios e códigos das estações da ANA (Hidrotelemetria).</li>
              <li>Mínima histórica do Rio Negro em Manaus: 12,11 m em 09/10/2024 (Porto de Manaus).</li>
              <li>Traçado dos rios e limites dos estados (Natural Earth, domínio público).</li>
            </ul>
          </div>
          <div>
            <h3>Simulado</h3>
            <ul>
              <li>Níveis atuais dos rios e limiares de atenção, alerta e crítico.</li>
              <li>Comunidades, lideranças, telefones, famílias e necessidades.</li>
              <li>Rotas, cotas mínimas de navegação e traçado das alternativas.</li>
              <li>Servidor, envio de WhatsApp e sincronização: tudo roda no navegador.</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="rodape-demo">
        <p className="nota" style={{ maxWidth: '60ch' }}>Os dados ficam guardados só neste navegador. Para recomeçar a demonstração do zero, restaure o cenário inicial.</p>
        {confirmar ? (
          <div className="acoes">
            <span>Apagar o que foi registrado e voltar ao cenário inicial?</span>
            <button className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button className="btn primario" onClick={() => { restaurarDemo(); setConfirmar(false); avisar('Cenário de demonstração restaurado.', 'good') }}>Restaurar cenário</button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirmar(true)}><RotateCcw size={18} aria-hidden="true" /> Restaurar dados de demonstração</button>
        )}
      </div>
    </>
  )
}
