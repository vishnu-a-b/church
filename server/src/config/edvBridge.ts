// Read lazily via getters, not captured once at module scope — TypeScript's
// CommonJS output hoists every import-derived require() above other
// top-level code, so a plain object literal built here would read
// process.env.EDV_BRIDGE_* before server.ts's dotenv.config() has actually
// run, permanently freezing in the wrong (undefined/empty) values for the
// life of the process regardless of what's in .env or how many times the
// process is restarted (same class of bug fixed in emailService.ts).
const edvBridgeConfig = {
  get enabled(): boolean {
    return process.env.EDV_BRIDGE_ENABLED === 'true';
  },
  get apiUrl(): string {
    return process.env.EDV_BRIDGE_API_URL || '';
  },
};

export default edvBridgeConfig;
