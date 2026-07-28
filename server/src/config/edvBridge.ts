const edvBridgeConfig = {
  enabled: process.env.EDV_BRIDGE_ENABLED === 'true',
  apiUrl: process.env.EDV_BRIDGE_API_URL || '',
};

export default edvBridgeConfig;
