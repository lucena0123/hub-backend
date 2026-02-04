export type ActionRow = { action_type: string; value: string };

export const parseNumber = (value?: string) => (value ? Number(value) : 0);

export const sumActions = (rows: ActionRow[] | undefined, types: string[]) => {
  if (!rows) return 0;
  return rows.filter((row) => types.includes(row.action_type)).reduce((sum, row) => sum + parseNumber(row.value), 0);
};

export const sumVideoActions = (actions: Array<{ action_type: string; value: string }> | undefined) => {
  if (!actions) return 0;
  return actions.reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0);
};

export const purchaseTypes = [
  'purchase',
  'offsite_conversion.purchase',
  'omni_purchase',
  'onsite_conversion.purchase',
  'web_purchase',
  'mobile_purchase',
];

export const leadTypes = ['lead', 'leadgen', 'omni_lead'];

export const messagingConversationTypes = [
  'onsite_conversion.messaging_conversation_started_7d',
  'messaging_conversation_started_7d',
];

export const messagingReplyTypes = ['onsite_conversion.messaging_first_reply', 'messaging_first_reply'];

export const linkClickTypes = ['link_click'];

export const landingPageViewTypes = ['landing_page_view'];

