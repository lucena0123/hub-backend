# Pipeline de Atributos Visuais (POC)

## Objetivo
Extrair atributos visuais básicos de criativos para enriquecer a análise de performance.

**Atributos POC**
- Cor dominante (hex).
- Detecção de texto na imagem (heurística).

## Arquitetura Proposta
1. **Coleta de snapshots**: usar `ad_creative_snapshots` como fonte.
2. **Processamento**: job assíncrono que baixa a imagem, extrai atributos e grava em JSONB.
3. **Persistência**: coluna `visual_attributes` em `ad_creative_snapshots`.
4. **Exposição**: atributos disponíveis no frontend para comparar com performance.

## POC Implementado
- Script: `backend/src/scripts/extract-creative-visuals.ts`
- Algoritmos:
  - **Cor dominante**: histograma quantizado (16 bins por canal RGB).
  - **Texto na imagem**: densidade de bordas (Sobel) como proxy de texto.
- Saída:
```json
{
  "dominantColor": "#a1b2c3",
  "textDetected": true,
  "edgeDensity": 0.12,
  "width": 256,
  "height": 144,
  "sampledAt": "2026-02-10T02:10:00.000Z",
  "algorithm": { "version": "poc-v1", "notes": "Dominant color via 16-bin RGB histogram; text detection via Sobel edge density." }
}
```

## Custos / Impacto
**CPU**
- O algoritmo roda em canvas (Puppeteer) e escala imagens para **256px** no maior lado.
- Tempo estimado: ~150–400ms por criativo (depende do download da imagem).

**Rede**
- Baixa o arquivo de imagem para cada criativo.
- Cache local não é implementado no POC.

**Armazenamento**
- JSONB pequeno por criativo (~0.5–1 KB).

## Como Rodar o POC
1. Aplicar migration:
   - `backend/prisma/migrations/20260210021000_add_visual_attributes_to_snapshots/migration.sql`
2. Executar o script:
   ```bash
   cd backend
   npx tsx src/scripts/extract-creative-visuals.ts --limit 25
   # modo dry-run
   npx tsx src/scripts/extract-creative-visuals.ts --limit 25 --dry-run
   ```

## Limitações Atuais
- **Texto na imagem** é heurístico (edge density). Pode dar falso positivo em imagens com muito ruído/contraste.
- Não há análise de vídeo.
- Não há extração de texto (OCR).

## Próximos Passos (Pós-POC)
1. **OCR real** (ex: Tesseract ou API externa) para detectar texto e linguagem.
2. **Classificadores visuais** (pessoas, ambientes, objetos).
3. **Análise de vídeo** (frame sampling, duração, motion).
4. **Cache de imagens** e fila de processamento.
5. **Dashboards** comparando atributos visuais vs métricas (CPL, CTR, conversas).
