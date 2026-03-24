import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { paymentsRouter } from './routes/payments.js';
import { webhooksRouter } from './routes/webhooks.js';

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('CORS blocked'));
    },
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'eventai-backend',
    env: config.nodeEnv,
    time: new Date().toISOString(),
  });
});

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  next();
});

app.use((req, _res, next) => {
  if (req.path.startsWith('/webhooks/razorpay')) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      try {
        req.body = data ? JSON.parse(data) : {};
      } catch {
        req.body = {};
      }
      next();
    });
    return;
  }
  next();
});

app.use(express.json({ limit: '1mb' }));

app.use('/payments', paymentsRouter);
app.use('/webhooks', webhooksRouter);

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

app.listen(config.port, () => {
   
  console.log(`EventAI backend running on http://localhost:${config.port}`);
});
