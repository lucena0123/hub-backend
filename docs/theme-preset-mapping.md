# Mapeamento de Tema e Preset Efetivo

Data de referência: 2026-02-17

Este documento registra o estado atual de campanhas com `optimization_theme_key` preenchido e o preset efetivo esperado no playbook.

| Campanha | Tema (`optimization_theme_key`) | Preset efetivo |
|---|---|---|
| Registrato | `geral` | Geral (fallback do playbook) |
| [CONSUMIDOR] Voo Atrasado \| Público: Geral \| Obj: Mensagens | `passageiro_aereo` | Passageiro Aéreo |
| [CONSUMIDOR] Voo Atrasado \| Público: Geral \| Obj: Mensagens | `passageiro_aereo` | Passageiro Aéreo |
| [OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] \|CAM | `salario_maternidade` | Salário Maternidade |
| [OBJ=LEAD] [PROD=Rescisao_Indireta] [FUNIL=MOFU] [TRABALHISTA] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-02-02] \|CAM | `trabalhista` | Trabalhista |
| [TRABALHISTA] Direitos Trabalhistas \| Público: Geral \| Obj: Mensagens | `trabalhista` | Trabalhista |
| [TRABALHISTA] Direitos Trabalhistas \| Público: Geral \| Obj: Mensagens | `trabalhista` | Trabalhista |
| [TRABALHISTA] Gravidez \| Público: Mulheres \| Obj: Mensagens | `salario_maternidade` | Salário Maternidade |
| [TRABALHISTA] Gravidez \| Público: Mulheres \| Obj: Mensagens | `salario_maternidade` | Salário Maternidade |
| [TRABALHISTA] Rescisão Indireta \| Público: Geral \| Obj: Mensagens | `trabalhista` | Trabalhista |

## Observações
- O baseline por cliente foi calibrado com preset Trabalhista.
- Campanhas com tema específico (`salario_maternidade` / `passageiro_aereo`) seguem targets do tema no engine, desde que `optimization_theme_key` esteja preenchido.
- Em caso de campanha sem tema detectado, aplica-se fallback `geral`.
