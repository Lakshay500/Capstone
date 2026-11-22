const EventEmitter = require('events');

// Central bus for domain events: 'order:placed', 'order:status-changed', 'stock:low'.
// Business code emits; listeners (logging, real-time notifications) react - the two never import each other.
class EventBus extends EventEmitter {}
module.exports = new EventBus();
