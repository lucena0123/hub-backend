/**
 * Meta Ads API Integration
 * Fetches campaign insights from Meta Marketing API
 */

export type {
  MetaInsightRow,
  MetaAdAccount,
  MetaCampaign,
  MetaAdSet,
  MetaAdSetInsightRow,
  MetaAdInsightRow,
  MetaAdCreative,
  MetaAd,
} from './meta-ads/types';

export { MetaAdsService } from './meta-ads/service';
export type { MetaWriteOperation, MetaWritebackError, MetaWritebackResult } from './meta-ads/service';
