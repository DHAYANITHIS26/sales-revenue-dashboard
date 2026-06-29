import { defineConfig } from 'vite';
import { salesData } from './data.js';

// In-memory data store for the mock API server
let currentSalesData = [...salesData];

export default defineConfig({
  server: {
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 204;
          res.end();
          return;
        }

        // Setup common CORS and JSON content type headers for API routes
        const isApiRoute = req.url.startsWith('/api/sales');
        if (isApiRoute) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }

        // Clean URL to handle query parameters
        const reqUrl = req.url.split('?')[0];

        if (reqUrl === '/api/sales') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(currentSalesData));
            return;
          }
          
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                if (Array.isArray(parsed)) {
                  currentSalesData = parsed;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, count: currentSalesData.length }));
                } else {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Body must be a JSON array' }));
                }
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON: ' + e.message }));
              }
            });
            return;
          }
        }

        if (reqUrl === '/api/sales/reset' && req.method === 'POST') {
          currentSalesData = [...salesData];
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, count: currentSalesData.length }));
          return;
        }

        next();
      });
    }
  }
});
