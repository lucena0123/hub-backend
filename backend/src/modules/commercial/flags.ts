export const isRequirementGatesEnabled = () => process.env.COMMERCIAL_REQUIREMENT_GATES_ENABLED === 'true';
export const isPublicSchedulingEnabled = () => process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED === 'true';
export const isQualificationScoreEnabled = () => process.env.COMMERCIAL_QUALIFICATION_SCORE_ENABLED === 'true';
export const isHybridSchedulingInviteEnabled = () => process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED === 'true';
export const isQuickSchedulingConfirmEnabled = () => process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED === 'true';
export const isTemplateStrictModeEnabled = () => process.env.COMMERCIAL_TEMPLATE_STRICT_MODE_ENABLED === 'true';
export const isGoogleBookingEnabled = () => process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED === 'true';
export const isGoogleBookingSyncEnabled = () => process.env.COMMERCIAL_GOOGLE_BOOKING_SYNC_ENABLED === 'true';
export const isGoogleBookingFallbackToPublicEnabled = () =>
  process.env.COMMERCIAL_GOOGLE_BOOKING_FALLBACK_TO_PUBLIC_ENABLED !== 'false';
export const isWhatsAppInteractiveSchedulingEnabled = () =>
  process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_SCHEDULING_ENABLED === 'true';
export const isWhatsAppReplyAutoConfirmEnabled = () =>
  process.env.COMMERCIAL_WHATSAPP_REPLY_AUTOCONFIRM_ENABLED === 'true';
export const isWhatsAppInteractiveFallbackTextEnabled = () =>
  process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_FALLBACK_TEXT_ENABLED !== 'false';
