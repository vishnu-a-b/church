"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const database_1 = __importDefault(require("./config/database"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const entity_routes_1 = __importDefault(require("./routes/entity.routes"));
const swagger_1 = __importDefault(require("./config/swagger"));
const campaignDuesProcessor_1 = require("./jobs/campaignDuesProcessor");
// Load environment variables
dotenv_1.default.config();
// Initialize express app
const app = (0, express_1.default)();
// Connect to MongoDB
(0, database_1.default)();
// Schedule automated campaign dues processing
(0, campaignDuesProcessor_1.scheduleCampaignDuesProcessing)();
// Middleware - CORS enabled for all origins
app.use((0, cors_1.default)({
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Swagger Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Church Wallet API Docs',
}));
// Swagger JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_1.default);
});
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 environment:
 *                   type: string
 */
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Church Wallet API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is running with version info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Church Wallet API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api', entity_routes_1.default);
// Error handler middleware (must be last)
app.use(error_middleware_1.default);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
//# sourceMappingURL=server.js.map