const AppError = require('../utils/AppError');

// Tiny declarative validator: validate({ email: { type:'string', required:true, pattern:/.../ } })
// Unknown fields are stripped (mass-assignment protection).
module.exports = (rules, { partial = false } = {}) => (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const errors = [];
  const clean = {};

  for (const [field, rule] of Object.entries(rules)) {
    const v = body[field];
    if (v === undefined || v === null || v === '') {
      if (rule.required && !partial) errors.push(`${field} is required`);
      continue;
    }
    if (rule.type === 'string' && typeof v !== 'string') { errors.push(`${field} must be a string`); continue; }
    if (rule.type === 'number' && (typeof v !== 'number' || Number.isNaN(v))) { errors.push(`${field} must be a number`); continue; }
    if (rule.type === 'integer' && !Number.isInteger(v)) { errors.push(`${field} must be an integer`); continue; }
    if (rule.type === 'boolean' && typeof v !== 'boolean') { errors.push(`${field} must be true or false`); continue; }
    if (rule.type === 'object' && (typeof v !== 'object' || Array.isArray(v))) { errors.push(`${field} must be an object`); continue; }
    if (rule.min !== undefined && v < rule.min) errors.push(`${field} must be >= ${rule.min}`);
    if (rule.max !== undefined && v > rule.max) errors.push(`${field} must be <= ${rule.max}`);
    if (rule.minLength !== undefined && String(v).length < rule.minLength) errors.push(`${field} must be at least ${rule.minLength} characters`);
    if (rule.enum && !rule.enum.includes(v)) errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
    if (rule.pattern && !rule.pattern.test(String(v))) errors.push(rule.message || `${field} is invalid`);
    clean[field] = typeof v === 'string' ? v.trim() : v;
  }

  if (errors.length) return next(new AppError('Validation failed', 400, errors));
  if (partial && Object.keys(clean).length === 0) return next(new AppError('Provide at least one field to update', 400));
  req.body = clean;
  next();
};
