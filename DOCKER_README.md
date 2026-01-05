# Docker Setup for Church Wallet System

This guide explains how to run the Church Wallet Keeping System using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed

## Quick Start

1. **Configure Environment Variables**

   Copy the example environment file and update it with your values:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your JWT secrets and SMS API keys.

2. **Build and Start the Application**

   ```bash
   docker-compose up -d
   ```

   This will start three services:
   - MongoDB database (port 27017)
   - Backend server (port 3001)
   - Frontend client (port 3000)

3. **Access the Application**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MongoDB: localhost:27017

## Docker Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb
```

### Rebuild images after code changes
```bash
docker-compose up -d --build
```

### Stop and remove all containers, networks, and volumes
```bash
docker-compose down -v
```

## Services

### MongoDB
- **Container**: church-mongodb
- **Port**: 27017
- **Credentials**:
  - Username: admin
  - Password: admin123
- **Database**: church
- **Data**: Persisted in Docker volume `mongodb_data`

### Backend Server
- **Container**: church-server
- **Port**: 3001
- **Built from**: `./server/Dockerfile`
- **Health check**: Checks `/health` endpoint every 30s

### Frontend Client
- **Container**: church-client
- **Port**: 3000
- **Built from**: `./client/Dockerfile`
- **Environment**: Connects to backend at http://localhost:3001

## Environment Variables

The following environment variables can be configured in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| JWT_SECRET | Secret key for JWT tokens | Required |
| JWT_ACCESS_TOKEN_EXPIRE | Access token expiration | 30m |
| JWT_REFRESH_TOKEN_EXPIRE | Refresh token expiration | 365d |
| REFRESH_TOKEN_SECRET | Secret for refresh tokens | Required |
| SMS_ENABLED | Enable/disable SMS | false |
| SMS_PROVIDER | SMS provider name | fast2sms |
| FAST2SMS_API_KEY | Fast2SMS API key | - |
| SMS_SENDER_ID | SMS sender ID | CHURCH |

## Database Seeding

To seed the database with initial data:

```bash
# Access the server container
docker exec -it church-server sh

# Run seed commands
npm run seed
# or
npm run seed:complete
```

## Troubleshooting

### Port Already in Use
If you get port conflicts, you can change the ports in `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:3000"  # Change YOUR_PORT to an available port
```

### Database Connection Issues
Make sure MongoDB is healthy:
```bash
docker-compose ps
```

Check MongoDB logs:
```bash
docker-compose logs mongodb
```

### Rebuild from Scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

For production deployment:

1. Change MongoDB credentials in `docker-compose.yml`
2. Set strong JWT secrets in `.env`
3. Update CORS_ORIGIN to your production domain
4. Consider using a managed MongoDB service instead of the container
5. Set up proper SSL/TLS certificates
6. Use environment-specific docker-compose files

## Development vs Production

For local development, you may want to use the existing dev setup:
- Server: `npm run dev` in the server directory
- Client: `npm run dev` in the client directory

Use Docker when you want to:
- Test the production build locally
- Deploy to a server
- Ensure consistency across environments
