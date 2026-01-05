/**
 * Process dues for overdue stothrakazhcha
 * Automatically adds default amount to non-contributors' wallets
 */
declare const processDues: () => Promise<void>;
/**
 * Schedule automatic stothrakazhcha dues processing
 * Runs every day at 7:00 AM (1 hour after campaign dues)
 */
export declare const scheduleStothrakazhchaDuesProcessing: () => void;
export { processDues };
//# sourceMappingURL=stothrakazhchaDuesProcessor.d.ts.map