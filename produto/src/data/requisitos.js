// mesma numeracao do doc de requisitos v1.1 + RF07 (foto) que esta no relatorio

export const REQUISITOS = [
  { id: 'RF01', tipo: 'Funcional', texto: 'Exibir informações sobre os níveis dos rios a partir de dados públicos da ANA.', tela: 'painel', verificar: 'Abrir o Painel e conferir, para cada estação, nível atual, variação em 24 h, situação e horário da leitura.' },
  { id: 'RF02', tipo: 'Funcional', texto: 'Cadastrar, editar e consultar comunidades ribeirinhas, com localização e quantidade de famílias.', tela: 'comunidades', verificar: 'Entrar como Administração, cadastrar uma comunidade, editá-la e encontrá-la na lista e no mapa.' },
  { id: 'RF03', tipo: 'Funcional', texto: 'Apresentar mapas com a localização das comunidades e propostas de rotas alternativas.', tela: 'mapa', verificar: 'No Mapa, selecionar São Sebastião do Lago e comparar a rota principal (intransitável) com a alternativa.' },
  { id: 'RF04', tipo: 'Funcional', texto: 'Registrar e acompanhar o status das entregas: Pendente, Em Rota e Entregue.', tela: 'entregas', verificar: 'Criar uma entrega, despachar (Em Rota) e confirmar (Entregue); conferir o histórico do cartão.' },
  { id: 'RF05', tipo: 'Funcional', texto: 'Enviar alertas e notificações às lideranças comunitárias via WhatsApp.', tela: 'alertas', verificar: 'Enviar o modelo "Nível do rio" para as comunidades críticas e conferir o histórico e a caixa de uma liderança.' },
  { id: 'RF06', tipo: 'Funcional', texto: 'Registrar informações offline e sincronizar quando a conexão voltar.', tela: 'entregas', verificar: 'Ativar "Sem conexão" no topo, despachar uma entrega, voltar a ficar online e conferir o aviso de sincronização.' },
  { id: 'RF07', tipo: 'Funcional', texto: 'Registrar a comprovação da entrega por fotografia.', tela: 'entregas', verificar: 'Confirmar uma entrega anexando uma foto e abrir o comprovante no cartão.' },
  { id: 'RNF01', tipo: 'Não funcional', texto: 'Interface simples, intuitiva e acessível.', tela: null, verificar: 'Navegar só pelo teclado (Tab, Enter, Esc); toda situação aparece com ícone e texto, não só com cor.' },
  { id: 'RNF02', tipo: 'Não funcional', texto: 'Funcionar com conectividade limitada, com recursos offline.', tela: 'entregas', verificar: 'Com "Sem conexão" ativo, criar e mover entregas; os cartões mostram "aguardando sincronização".' },
  { id: 'RNF03', tipo: 'Não funcional', texto: 'Proteger os dados e restringir o acesso conforme as permissões dos usuários.', tela: 'usuarios', verificar: 'Trocar o perfil para Liderança comunitária: some o menu Usuários e os botões de edição ficam bloqueados.' },
  { id: 'RNF04', tipo: 'Não funcional', texto: 'Mostrar dados hidrológicos atualizados, com origem e data de atualização.', tela: 'painel', verificar: 'Conferir fonte, código da estação e horário da leitura em cada estação do Painel.' },
  { id: 'RNF05', tipo: 'Não funcional', texto: 'Ser compatível com dispositivos móveis e computadores.', tela: null, verificar: 'Abrir no celular: o menu vira gaveta, as tabelas empilham e o quadro de entregas rola na horizontal.' },
  { id: 'RNF06', tipo: 'Não funcional', texto: 'Sincronizar os registros offline sem inconsistências nem duplicidades.', tela: 'entregas', verificar: 'Sem conexão, mover uma entrega, usar "Simular reenvio" na fila e reconectar: o aviso informa o registro repetido descartado.' },
  { id: 'RN01', tipo: 'Regra de negócio', texto: 'Toda comunidade cadastrada deve ter identificação e localização geográfica.', tela: 'comunidades', verificar: 'Tentar salvar uma comunidade sem nome ou com coordenadas fora do Amazonas: o formulário aponta o erro.' },
  { id: 'RN02', tipo: 'Regra de negócio', texto: 'As entregas seguem os estados Pendente, Em Rota e Entregue.', tela: 'entregas', verificar: 'O status só avança na ordem; arrastar um cartão para trás é recusado.' },
  { id: 'RN03', tipo: 'Regra de negócio', texto: 'A priorização considera a criticidade das comunidades e as necessidades identificadas.', tela: 'comunidades', verificar: 'Abrir uma comunidade e conferir os fatores da pontuação; a coluna Pendente segue essa ordem.' },
  { id: 'RN04', tipo: 'Regra de negócio', texto: 'Registros offline são sincronizados quando a conexão é restabelecida.', tela: 'entregas', verificar: 'Ao desativar "Sem conexão", a fila é enviada sem precisar clicar em nada.' },
  { id: 'RN05', tipo: 'Regra de negócio', texto: 'Rotas alternativas são propostas e precisam de validação antes do uso operacional.', tela: 'mapa', verificar: 'Tentar despachar a entrega de São Sebastião do Lago: o sistema pede a validação da rota; validar no Mapa e despachar.' },
  { id: 'RN06', tipo: 'Regra de negócio', texto: 'O monitoramento considera a fonte e a atualização dos dados disponíveis.', tela: 'painel', verificar: 'A estação de Tabatinga aparece com aviso de leitura desatualizada.' },
  { id: 'RN07', tipo: 'Regra de negócio', texto: 'O envio de alertas usa as informações e os contatos cadastrados.', tela: 'alertas', verificar: 'Ao escolher comunidades sem contato (Santa Maria, Divino Espírito Santo), o alerta avisa que elas ficam de fora.' },
]

export const REQ_POR_TELA = {
  painel: ['RF01', 'RNF04', 'RN06'],
  comunidades: ['RF02', 'RN01', 'RN03'],
  mapa: ['RF03', 'RN05'],
  entregas: ['RF04', 'RF06', 'RF07', 'RN02', 'RN03', 'RN05'],
  alertas: ['RF05', 'RN07'],
  usuarios: ['RNF03'],
  requisitos: [],
}
