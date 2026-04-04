const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_VERSION = process.env.META_API_VERSION || 'v20.0';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
const FORCE = process.argv.includes('--force');
const ONLY_IDS = new Set(
  process.argv
    .filter((arg) => arg.startsWith('--ids='))
    .flatMap((arg) => arg.replace('--ids=', '').split(','))
    .map((id) => id.trim())
    .filter(Boolean)
);

if (!ACCESS_TOKEN) {
  console.error('Missing META_ACCESS_TOKEN in backend/.env');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in backend/.env');
  process.exit(1);
}

const stripAccents = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const toUnderscore = (value) => {
  if (!value) return '';
  const noAccents = stripAccents(String(value));
  return noAccents
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
};

const extractBracketTags = (value) => {
  if (!value) return [];
  const tags = [];
  const regex = /\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    const tag = match[1]?.trim();
    if (tag) tags.push(tag);
  }
  return tags;
};

const THEME_TAGS = new Set(
  [
    'TRABALHISTA',
    'PREVIDENCIARIO',
    'CONSUMIDOR',
    'MATERNIDADE',
    'SALARIO_MATERNIDADE',
    'PASSAGEIRO',
    'AEREO',
    'AÉREO',
    'VOO',
  ].map((t) => toUnderscore(t).toUpperCase())
);

const hasThemeTag = (name) => {
  const tags = extractBracketTags(name).map((t) => toUnderscore(t).toUpperCase());
  return tags.some((t) => THEME_TAGS.has(t));
};

const hasDateTag = (name) => /\[\d{4}-\d{2}-\d{2}\]/.test(name || '');

const isCanonicalCampaignName = (name) => {
  if (!name || !name.includes('|CAM')) return false;
  if (!name.includes('[OBJ=') || !name.includes('[PROD=') || !name.includes('[FUNIL=')) return false;
  if (!name.includes('[BUDGET=') || !name.includes('[REG=') || !name.includes('[LANG=')) return false;
  if (!hasDateTag(name)) return false;
  if (!/\[(CONT|ONETIME|TESTE)\]/.test(name)) return false;
  return true;
};

const isCanonicalAdsetName = (name) => {
  if (!name || !name.includes('|AS')) return false;
  if (!name.includes('[AUD=') || !name.includes('[HEAT=') || !name.includes('[WIN=') || !name.includes('[FUNIL=')) return false;
  if (!name.includes('[PLAC=') || !name.includes('[REG=') || !name.includes('[LANG=')) return false;
  return hasDateTag(name);
};

const isCanonicalAdName = (name) => {
  if (!name || !name.includes('|AD')) return false;
  if (!name.includes('AD_[') || !name.includes('[ANG=') || !name.includes('[FORM=') || !name.includes('[VAR=')) return false;
  if (!name.includes('[CTA=') || !name.includes('[LANG=') || !name.includes('[REG=')) return false;
  return hasDateTag(name);
};

const parseDate = (value) => {
  if (!value) return '????-??-??';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value);
  const isoMatch = str.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return '????-??-??';
};

const parseObjective = (name, objectiveField) => {
  if (name) {
    const match = name.match(/Obj\s*:\s*([^|]+)/i);
    if (match) {
      const v = match[1].toLowerCase();
      if (v.includes('mensagem') || v.includes('message') || v.includes('whatsapp')) return 'LEAD';
      if (v.includes('venda') || v.includes('sales')) return 'SALES';
      if (v.includes('audi') || v.includes('alcance') || v.includes('awareness')) return 'AUD';
    }
  }
  if (objectiveField) {
    const v = String(objectiveField).toUpperCase();
    if (v.includes('LEAD') || v.includes('MESSAGE')) return 'LEAD';
    if (v.includes('SALES')) return 'SALES';
    if (v.includes('TRAFFIC')) return 'TRAFFIC';
    if (v.includes('AWARE') || v.includes('REACH') || v.includes('AUDIENCE')) return 'AUD';
  }
  return '?';
};

const inferFunnel = (obj) => {
  if (obj === 'SALES') return 'BOFU';
  if (obj === 'TRAFFIC' || obj === 'AUD') return 'TOFU';
  if (obj === 'LEAD') return 'MOFU';
  return '?';
};

const parseRegion = (campaignName) => {
  if (campaignName && /CE\s*\/\s*RJ/i.test(campaignName)) return 'BR-CE+RJ';
  return 'BR';
};

const parseThemeTag = (campaignName) => {
  if (!campaignName) return null;
  const match = campaignName.match(/^\s*\[([^\]]+)\]/);
  if (!match) return null;
  return toUnderscore(match[1]).toUpperCase();
};

const parseProduct = (campaignName) => {
  if (!campaignName) return '';
  let name = campaignName;
  if (name.trim().startsWith('[')) {
    name = name.replace(/^\s*\[[^\]]+\]\s*/, '');
  }
  name = name.split('|')[0].trim();
  return toUnderscore(name);
};

const parseLifecycle = (campaignName) => {
  if (!campaignName) return 'CONT';
  if (/black\s*friday/i.test(campaignName)) return 'ONETIME';
  return 'CONT';
};

const campaignSuggestion = (row) => {
  const obj = parseObjective(row.name, row.objective);
  const funil = inferFunnel(obj);
  const prod = parseProduct(row.name);
  const themeTag = parseThemeTag(row.name);
  const lifecycle = parseLifecycle(row.name);
  const region = parseRegion(row.name);
  const date = parseDate(row.created_time);

  const parts = [
    `[OBJ=${obj}]`,
    `[PROD=${prod}]`,
    `[FUNIL=${funil}]`,
  ];
  if (themeTag) parts.push(`[${themeTag}]`);
  parts.push(`[${lifecycle}]`);
  parts.push('[BUDGET=UNK]');
  parts.push(`[REG=${region}]`);
  parts.push('[LANG=PT]');
  parts.push(`[${date}]`);
  return `${parts.join(' ')} |CAM`;
};

const isPlacementToken = (value) => {
  const v = value.trim();
  if (!v) return false;
  if (/^BR$/i.test(v)) return true;
  if (/^IG$/i.test(v)) return true;
  if (/^ADVANTAGE\+$/i.test(v)) return true;
  return false;
};

const parsePlacement = (adsetName) => {
  if (!adsetName) return '?';
  const parts = adsetName.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.some((p) => /^IG$/i.test(p))) return 'IG';
  if (parts.some((p) => /^ADVANTAGE\+$/i.test(p))) return 'ADVPLUS';
  return '?';
};

const parseAudience = (adsetName) => {
  if (!adsetName) return '?';
  const parts = adsetName.split('|').map((p) => p.trim()).filter(Boolean);
  const keep = parts.filter((p) => !isPlacementToken(p));
  const joined = keep.map((p) => toUnderscore(p)).filter(Boolean).join('_');
  return joined || '?';
};

const adsetSuggestion = (row, index) => {
  const aud = parseAudience(row.adset_name);
  const placement = parsePlacement(row.adset_name);
  const region = parseRegion(row.campaign_name);
  const date = parseDate(row.created_time);
  const nn = String(index).padStart(2, '0');

  return `${nn}_[AUD=${aud}] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=${placement}] [REG=${region}] [LANG=PT] [${date}] |AS`;
};

const parseAngle = (adName) => {
  if (!adName) return '?';
  const clean = adName.replace(/\s+/g, ' ').trim();
  const parts = clean.split(/\s[-–—]\s/);
  const raw = parts.length >= 2 ? parts[1] : clean;
  const withoutTest = raw.split(/teste/i)[0] || raw;
  const withoutQuotes = withoutTest.replace(/".*?"/g, '').trim();
  return toUnderscore(withoutQuotes || raw);
};

const parseForm = (adName) => {
  if (!adName) return '?';
  if (/^imagem/i.test(adName.trim())) return 'IMG';
  if (/^video/i.test(adName.trim())) return 'VIDEO';
  return '?';
};

const parseVar = (adName) => {
  if (!adName) return 'v??';
  const match = adName.match(/\bV(\d{1,2})\b/i);
  if (!match) return 'v??';
  return `v${match[1].padStart(2, '0')}`;
};

const parseCta = (adName) => {
  if (!adName) return '?';
  const match = adName.match(/CTA\s*([A-Za-zÀ-ÿ]+)/i);
  if (match) return toUnderscore(match[1]).toUpperCase();
  if (/whatsapp/i.test(adName)) return 'WHATSAPP';
  return '?';
};

const adSuggestion = (row) => {
  const ang = parseAngle(row.ad_name);
  const form = parseForm(row.ad_name);
  const vari = parseVar(row.ad_name);
  const cta = parseCta(row.ad_name);
  const region = parseRegion(row.campaign_name);
  const date = parseDate(row.ad_created_time);
  const testTag = row.ad_name && /teste/i.test(row.ad_name) ? ' [TESTE_CR]' : '';
  return `AD_[ANG=${ang}] [FORM=${form}] [VAR=${vari}]${testTag} [CTA=${cta}] [LANG=PT] [REG=${region}] [${date}] |AD`;
};

const isMetaId = (value) => /^\d+$/.test(String(value || ''));

const REPAIR_OVERRIDES = {
  campaign: new Map([
    [
      '120240932661560563',
      '[OBJ=LEAD] [PROD=Maternidade] [FUNIL=MOFU] [PREVIDENCIARIO] [CONT] [BUDGET=UNK] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |CAM',
    ],
    [
      '120240932229130563',
      '[OBJ=LEAD] [PROD=Rescisao_Indireta] [FUNIL=MOFU] [TRABALHISTA] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-02-02] |CAM',
    ],
    [
      '120242969304000548',
      '[OBJ=SALES] [PROD=Curso_Crochetin] [FUNIL=BOFU] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-02-23] |CAM',
    ],
    [
      '120242972835040548',
      '[OBJ=TRAFFIC] [PROD=Trafego_Curso] [FUNIL=TOFU] [CONT] [BUDGET=UNK] [REG=BR] [LANG=PT] [2026-02-23] |CAM',
    ],
  ]),
  adset: new Map([
    [
      '120240932661570563',
      '01_[AUD=Publico_CE_RJ_20_45_Manual_FEM] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=IG] [REG=BR-CE+RJ] [LANG=PT] [2026-02-02] |AS',
    ],
    [
      '120240932229140563',
      '01_[AUD=Publico_Aberto_20_50_Manual_Geral] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=IG] [REG=BR] [LANG=PT] [2026-02-02] |AS',
    ],
    [
      '120239063044600436',
      '01_[AUD=Publico_Específico_Manual] [HEAT=COLD] [WIN=ALL] [FUNIL=MOFU] [PLAC=ADVPLUS] [REG=BR] [LANG=PT] [2025-03-03] |AS',
    ],
    [
      '120242969304010548',
      '01_[AUD=Publico_Mulheres_25_50_Croche_Bolsas] [HEAT=COLD] [WIN=ALL] [FUNIL=BOFU] [PLAC=ADVPLUS] [REG=BR] [LANG=PT] [2026-02-23] |AS',
    ],
    [
      '120242972835050548',
      '01_[AUD=Publico_25_50_Artesanato_Croche_Costura] [HEAT=COLD] [WIN=ALL] [FUNIL=TOFU] [PLAC=IG] [REG=BR] [LANG=PT] [2026-02-23] |AS',
    ],
  ]),
  ad: new Map([
    [
      '120240932229150563',
      'AD_[ANG=RescisaoIndireta] [FORM=IMG] [VAR=v01] [CTA=WHATSAPP] [LANG=PT] [REG=BR] [2026-02-02] |AD',
    ],
    [
      '120240932661550563',
      'AD_[ANG=Maternidade] [FORM=IMG] [VAR=v01] [CTA=WHATSAPP] [LANG=PT] [REG=BR-CE+RJ] [2026-02-02] |AD',
    ],
    [
      '120241280831550563',
      'AD_[ANG=RescisaoIndireta] [FORM=IMG] [VAR=v02] [CTA=WHATSAPP] [LANG=PT] [REG=BR] [2026-02-11] |AD',
    ],
    [
      '120241283323460563',
      'AD_[ANG=Maternidade] [FORM=IMG] [VAR=v02] [CTA=WHATSAPP] [LANG=PT] [REG=BR-CE+RJ] [2026-02-11] |AD',
    ],
    [
      '120242969303990548',
      'AD_[ANG=Curso_Crochetin] [FORM=VIDEO] [VAR=v01] [CTA=LEARN_MORE] [LANG=PT] [REG=BR] [2026-02-23] |AD',
    ],
  ]),
};

const renameEntity = async (id, name) => {
  const url = new URL(`https://graph.facebook.com/${API_VERSION}/${id}`);
  const params = new URLSearchParams();
  params.set('name', name);
  params.set('access_token', ACCESS_TOKEN);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok || data.error) {
    const error = data.error ? JSON.stringify(data.error) : text;
    throw new Error(error);
  }

  return data;
};

(async () => {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const campaigns = await client.query(
    'SELECT c.name AS client, ca.id, ca."externalId" AS external_id, ca.name, ca.objective, to_char(ca.created_time, \'YYYY-MM-DD\') AS created_time FROM campaigns ca JOIN clients c ON c.id = ca."clientId" ORDER BY c.name, ca.name;'
  );
  const adsets = await client.query(
    'SELECT c.name AS client, ca.id AS campaign_id, ca.name AS campaign_name, a.adset_id, a.adset_name, to_char(a.created_time, \'YYYY-MM-DD\') AS created_time FROM adsets a JOIN campaigns ca ON ca.id = a.campaign_id JOIN clients c ON c.id = ca."clientId" ORDER BY c.name, ca.name, a.adset_name;'
  );
  const ads = await client.query(
    'SELECT DISTINCT ON (m.ad_id) c.name AS client, ca.id AS campaign_id, ca.name AS campaign_name, m.adset_id, a.adset_name, m.ad_id, m.ad_name, to_char(m.ad_created_time, \'YYYY-MM-DD\') AS ad_created_time FROM ad_creative_metrics m JOIN campaigns ca ON ca.id = m.campaign_id JOIN clients c ON c.id = ca."clientId" LEFT JOIN adsets a ON a.adset_id = m.adset_id ORDER BY m.ad_id, m.date DESC;'
  );

  const adsetIndexByCampaign = new Map();
  for (const row of adsets.rows) {
    const list = adsetIndexByCampaign.get(row.campaign_id) || [];
    list.push(row);
    adsetIndexByCampaign.set(row.campaign_id, list);
  }
  for (const [campaignId, list] of adsetIndexByCampaign.entries()) {
    list.sort((a, b) => String(a.adset_name || '').localeCompare(String(b.adset_name || '')));
    adsetIndexByCampaign.set(campaignId, list);
  }

  const operations = [];

  for (const row of campaigns.rows) {
    const override = REPAIR_OVERRIDES.campaign.get(row.external_id);
    const newName = override || campaignSuggestion(row);
    operations.push({
      type: 'campaign',
      id: row.external_id,
      dbId: row.id,
      oldName: row.name,
      newName,
    });
  }

  for (const row of adsets.rows) {
    const list = adsetIndexByCampaign.get(row.campaign_id) || [];
    const idx = list.findIndex((item) => item.adset_id === row.adset_id);
    const override = REPAIR_OVERRIDES.adset.get(row.adset_id);
    const newName = override || adsetSuggestion(row, idx + 1);
    operations.push({
      type: 'adset',
      id: row.adset_id,
      oldName: row.adset_name,
      newName,
    });
  }

  for (const row of ads.rows) {
    const override = REPAIR_OVERRIDES.ad.get(row.ad_id);
    const newName = override || adSuggestion(row);
    operations.push({
      type: 'ad',
      id: row.ad_id,
      oldName: row.ad_name,
      newName,
    });
  }

  const summary = { campaign: 0, adset: 0, ad: 0, skipped: 0, failed: 0 };

  for (const op of operations) {
    if (ONLY_IDS.size > 0 && !ONLY_IDS.has(op.id)) {
      summary.skipped += 1;
      continue;
    }
    if (!isMetaId(op.id)) {
      summary.skipped += 1;
      continue;
    }
    if (!op.newName) {
      summary.skipped += 1;
      continue;
    }
    if (!FORCE) {
      if (op.type === 'campaign' && isCanonicalCampaignName(op.oldName)) {
        summary.skipped += 1;
        continue;
      }
      if (op.type === 'adset' && isCanonicalAdsetName(op.oldName)) {
        summary.skipped += 1;
        continue;
      }
      if (op.type === 'ad' && isCanonicalAdName(op.oldName)) {
        summary.skipped += 1;
        continue;
      }
    }
    if (op.type === 'campaign') {
      if (op.newName.includes('[OBJ=?]') || op.newName.includes('[FUNIL=?]') || op.newName.includes('????-??-??')) {
        summary.skipped += 1;
        continue;
      }
    }
    if (op.oldName === op.newName) {
      summary.skipped += 1;
      continue;
    }

    try {
      if (!DRY_RUN) {
        await renameEntity(op.id, op.newName);
      }
      if (!DRY_RUN) {
        if (op.type === 'campaign') {
          await client.query('UPDATE campaigns SET name = $1, "updatedAt" = now() WHERE "externalId" = $2', [op.newName, op.id]);
        } else if (op.type === 'adset') {
          await client.query('UPDATE adsets SET adset_name = $1, updated_at = now() WHERE adset_id = $2', [op.newName, op.id]);
        } else {
          await client.query('UPDATE ad_creative_metrics SET ad_name = $1, updated_at = now() WHERE ad_id = $2', [op.newName, op.id]);
        }
      }

      summary[op.type] += 1;
      console.log(`[OK] ${op.type.toUpperCase()} ${op.id} -> ${op.newName}`);
    } catch (error) {
      summary.failed += 1;
      console.error(`[FAIL] ${op.type.toUpperCase()} ${op.id}: ${error.message || error}`);
    }
  }

  console.log('\nSummary:', summary, DRY_RUN ? '(dry-run)' : '');
  await client.end();
})().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
