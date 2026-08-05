import { IThirukkarmangalRite } from '../types';

export interface ComputedSplitAmount {
  recipientLabel: string;
  percent: number;
  amount: number;
}

/**
 * Divides the amount actually paid for a rite among its configured recipients.
 * Returns [] when the rite has no configured split — payment still proceeds,
 * only the internal distribution breakdown is left empty until church
 * management confirms the split (see docs/NEW_FEATURES_2026.html, Section 5).
 */
export const computeSplitAmounts = (
  rite: Pick<IThirukkarmangalRite, 'split' | 'splitConfigured'>,
  amountPaid: number
): ComputedSplitAmount[] => {
  if (!rite.splitConfigured || !rite.split || rite.split.length === 0) {
    return [];
  }

  return rite.split.map((entry) => ({
    recipientLabel: entry.recipientLabel,
    percent: entry.percent,
    amount: Math.round(((amountPaid * entry.percent) / 100) * 100) / 100,
  }));
};
