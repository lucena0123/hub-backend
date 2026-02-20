# Rotina Operacional Diaria (5 minutos)

Objetivo: manter execucao continua com sinal claro de saude operacional.

## Cadencia
- Frequencia: a cada 5 minutos, durante o periodo operacional ativo.
- Duracao do checkpoint: 60 a 90 segundos.
- Responsavel: pessoa de plantao (uma por turno).

## Checklist do checkpoint
1. Verificar erros criticos no ultimo intervalo (logs, fila, alertas).
2. Verificar progresso do trabalho ativo (tickets, jobs, entregas em andamento).
3. Verificar bloqueios novos (dependencias, acesso, aprovacao, ambiente).
4. Registrar status no canal do grupo correspondente.

## Criterios objetivos de PASS/FAIL

### PASS
- Nao existe erro critico aberto no intervalo.
- Nenhum item ativo ficou sem progresso por mais de 10 minutos.
- Nao ha bloqueio sem dono e sem proximo passo definido.
- Ultimo update foi enviado no prazo (ate +1 minuto da janela de 5 minutos).

### FAIL
- Existe erro critico sem mitigacao iniciada.
- Algum item ativo esta parado por mais de 10 minutos sem justificativa.
- Existe bloqueio sem responsavel nomeado.
- Nao houve update dentro da janela prevista.

## Acao imediata quando FAIL
1. Abrir incidente no canal correto com horario e impacto.
2. Nomear responsavel e proximo passo com prazo maximo de 10 minutos.
3. Escalar se sem resolucao apos 2 checkpoints consecutivos (10 minutos).
4. Registrar fechamento e causa raiz curta ao retornar para PASS.

## Registro minimo por checkpoint
- Horario (HH:MM)
- Status: PASS ou FAIL
- Item principal em andamento
- Bloqueio (se houver) + dono + ETA
