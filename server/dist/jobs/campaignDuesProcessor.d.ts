/**
 * Process dues for overdue campaigns with variable contribution mode
 * Automatically adds minimum amount to non-contributors' wallets
 */
declare const processDues: () => Promise<void>;
/**
 * Schedule automatic campaign dues processing
 * Runs every day at 6:00 AM
 */
export declare const scheduleCampaignDuesProcessing: () => void;
export { processDues };
//# sourceMappingURL=campaignDuesProcessor.d.ts.map