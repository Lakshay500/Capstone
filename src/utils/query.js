const mongoose = require('mongoose');
const AppError = require('./AppError');

exports.parsePagination = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

exports.parseSort = (raw, allowed, fallback = { createdAt: -1 }) => {
  if (!raw) return fallback;
  const sort = {};
  String(raw).split(',').forEach((t) => {
    const field = t.replace(/^-/, '').trim();
    if (allowed.includes(field)) sort[field] = t.startsWith('-') ? -1 : 1;
  });
  return Object.keys(sort).length ? sort : fallback;
};

exports.assertObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) throw new AppError(`Invalid ${label}`, 400);
};

exports.round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
