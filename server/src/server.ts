import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/database';
import errorHandler from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import entityRoutes from './routes/entity.routes';
import swaggerSpec from './config/swagger';
import { scheduleCampaignDuesProcessing } from './jobs/campaignDuesProcessor';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Schedule automated campaign dues processing
scheduleCampaignDuesProcessing();

// Middleware - CORS enabled for all origins
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Church Wallet API Docs',
}));

// Swagger JSON
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
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
app.get('/health', (req: Request, res: Response) => {
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
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Church Wallet API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', entityRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
