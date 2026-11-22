const express = require('express');
const logger = require('./middleware/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(logger);

app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
