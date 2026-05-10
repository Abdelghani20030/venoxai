import serverless from 'serverless-http';
import app from '../../artifacts/api-server/src/app';

// Ensure we are in production mode
process.env.NODE_ENV = 'production';

// Export the serverless handler
export const handler = serverless(app);
