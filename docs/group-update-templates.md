# Templates de Update por Grupo (PT-BR)

Uso: mensagens curtas para checkpoints de 5 minutos.

## Geral
`[HH:MM] Status: PASS | Frente: <tema> | Proximo passo: <acao ate HH:MM> | Risco: <nenhum ou risco>`

`[HH:MM] Status: FAIL | Impacto: <resumo> | Bloqueio: <causa> | Dono: <nome> | Escala: <sim/nao>`

## Projetos
`[HH:MM] Projeto: <nome> | Status: PASS | Entregavel: <item> | Avanco: <feito agora> | Proximo: <acao>`

`[HH:MM] Projeto: <nome> | Status: FAIL | Bloqueio: <causa> | Dependencia: <time/pessoa> | ETA de destrave: <HH:MM>`

## Pessoal
`[HH:MM] Status pessoal: PASS | Foco: <tarefa unica> | Proximo bloco: <acao de 5-15 min>`

`[HH:MM] Status pessoal: FAIL | Motivo: <objetivo> | Correcao: <acao imediata> | Retorno previsto: <HH:MM>`

## Regra rapida de qualidade da mensagem
- Maximo de 280 caracteres.
- Sempre incluir horario.
- Em FAIL, sempre incluir dono e proximo passo.
