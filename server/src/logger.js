// Clean, structured system logger for SwapChat
// Strict rule: No emojis and no massive print statements in terminal.

const MAX_LOGS = 250;
const logBuffer = [];
let logIdCounter = 1;

export const LogCategory = Object.freeze({
  API: 'API',
  NLP: 'NLP',
  SIMULATION: 'SIMULATION',
  EXECUTION: 'EXECUTION',
  CHAIN: 'CHAIN',
  WALLET: 'WALLET'
});

export const LogLevel = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
});

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function log(category, level, message, details = null) {
  const now = new Date();
  const entry = {
    id: `log-${Date.now()}-${logIdCounter++}`,
    timestamp: now.getTime(),
    timeFormatted: formatTimestamp(now),
    category: category || LogCategory.API,
    level: level || LogLevel.INFO,
    message: String(message || ''),
    details: details ? (typeof details === 'object' ? details : { info: details }) : null
  };

  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  // Terminal output: clean, single-line, no emojis
  if (process.env.NODE_ENV !== 'test') {
    const formatted = `[${entry.timeFormatted}] [${entry.level}] [${entry.category}] ${entry.message}`;
    if (entry.level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (entry.level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  return entry;
}

export const logger = {
  info: (category, message, details) => log(category, LogLevel.INFO, message, details),
  warn: (category, message, details) => log(category, LogLevel.WARN, message, details),
  error: (category, message, details) => log(category, LogLevel.ERROR, message, details),
  debug: (category, message, details) => log(category, LogLevel.DEBUG, message, details)
};

export function getLogs({ category = null, level = null, limit = 100 } = {}) {
  let filtered = [...logBuffer];

  if (category && category !== 'ALL') {
    filtered = filtered.filter((l) => l.category.toUpperCase() === category.toUpperCase());
  }

  if (level && level !== 'ALL') {
    filtered = filtered.filter((l) => l.level.toUpperCase() === level.toUpperCase());
  }

  return filtered.slice(-Math.min(limit, MAX_LOGS)).reverse();
}

export function clearLogs() {
  logBuffer.length = 0;
  logger.info(LogCategory.API, 'System log buffer cleared');
  return true;
}
