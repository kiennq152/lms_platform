import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

const ROOT_PATH = path.join(__dirname, '..');
const CLIENT_BUILD_PATH = path.join(ROOT_PATH, 'client');
const DOCS_PATH = path.join(ROOT_PATH, 'docs');

app.use(cors());
app.use(morgan('dev'));
app.use(express.static(CLIENT_BUILD_PATH));
app.use('/docs', express.static(DOCS_PATH));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Stitch LMS server listening on http://localhost:${PORT}`);
});

