import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Church Wallet API',
      version: '1.0.0',
      description: 'Church Wallet Keeping System - API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@churchwallet.org',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.churchwallet.org',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Validation failed',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'church_admin', 'unit_admin', 'kudumbakutayima_admin', 'member'],
              example: 'member',
            },
            churchId: {
              type: 'string',
              nullable: true,
            },
            unitId: {
              type: 'string',
              nullable: true,
            },
            memberId: {
              type: 'string',
              nullable: true,
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
          },
        },
        Church: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            churchNumber: {
              type: 'number',
            },
            uniqueId: {
              type: 'string',
              example: 'CH001',
            },
            name: {
              type: 'string',
              example: "St. Mary's Cathedral",
            },
            location: {
              type: 'string',
              example: 'Kochi, Kerala',
            },
            diocese: {
              type: 'string',
              example: 'Ernakulam-Angamaly Archdiocese',
            },
            contactPerson: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
          },
        },
        Unit: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            churchId: {
              type: 'object',
            },
            unitNumber: {
              type: 'number',
            },
            uniqueId: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            unitCode: {
              type: 'string',
            },
          },
        },
        Member: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female'],
            },
            role: {
              type: 'string',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
            },
            receiptNumber: {
              type: 'string',
            },
            transactionType: {
              type: 'string',
              enum: ['lelam', 'dashamansham', 'thirunnaal_panam', 'spl_contribution'],
            },
            totalAmount: {
              type: 'number',
            },
            paymentDate: {
              type: 'string',
              format: 'date-time',
            },
            paymentMethod: {
              type: 'string',
              enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Churches',
        description: 'Church management',
      },
      {
        name: 'Units',
        description: 'Unit management',
      },
      {
        name: 'Bavanakutayimas',
        description: 'Bavanakutayima management',
      },
      {
        name: 'Houses',
        description: 'House management',
      },
      {
        name: 'Members',
        description: 'Member management',
      },
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'Transactions',
        description: 'Financial transactions',
      },
      {
        name: 'Campaigns',
        description: 'Campaign management',
      },
      {
        name: 'Spiritual Activities',
        description: 'Spiritual activity tracking',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
