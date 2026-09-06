import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { logger, LogCategory } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'transactions.db');

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    dbInstance = new DatabaseSync(DB_FILE);

    // Create table if it doesn't exist
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id TEXT UNIQUE NOT NULL,
        proposal_id TEXT,
        session_id TEXT,
        token_in TEXT NOT NULL,
        token_out TEXT NOT NULL,
        amount_in TEXT NOT NULL,
        amount_out TEXT NOT NULL,
        rate TEXT,
        tx_hash TEXT,
        explorer_url TEXT,
        estimated_gas_eth TEXT,
        network TEXT DEFAULT 'Sepolia Testnet',
        status TEXT NOT NULL,
        error_message TEXT,
        timestamp INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tx_session ON transactions(session_id);
      CREATE INDEX IF NOT EXISTS idx_tx_hash ON transactions(tx_hash);
      CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp DESC);
    `);

    logger.info(LogCategory.CHAIN, `SQLite database initialized: ${path.relative(process.cwd(), DB_FILE)}`);
  }
  return dbInstance;
}

export function recordTransaction(trade, sessionId = null) {
  try {
    const db = getDatabase();
    const timestamp = trade.timestamp || Date.now();
    const createdAt = new Date(timestamp).toISOString();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO transactions (
        receipt_id, proposal_id, session_id,
        token_in, token_out, amount_in, amount_out,
        rate, tx_hash, explorer_url, estimated_gas_eth,
        network, status, error_message, timestamp, created_at
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      trade.receiptId || `REC-${Date.now().toString(36).toUpperCase()}`,
      trade.proposalId || null,
      sessionId || trade.sessionId || null,
      trade.tokenIn || 'UNKNOWN',
      trade.tokenOut || 'UNKNOWN',
      String(trade.amountIn || '0'),
      String(trade.amountOut || '0'),
      String(trade.rate || 'N/A'),
      trade.txHash || null,
      trade.explorerUrl || null,
      String(trade.estimatedGasEth || '0'),
      trade.network || 'Sepolia Testnet',
      trade.status || 'Confirmed',
      trade.errorMessage || null,
      timestamp,
      createdAt
    );

    logger.info(
      LogCategory.EXECUTION,
      `Transaction logged to SQLite: ${trade.receiptId} (${trade.amountIn} ${trade.tokenIn} -> ${trade.amountOut} ${trade.tokenOut})`
    );
    return true;
  } catch (error) {
    logger.error(LogCategory.EXECUTION, `Failed to log transaction to SQLite: ${error.message}`);
    return false;
  }
}

export function getAllTransactions(limit = 100, sessionId = null) {
  try {
    const db = getDatabase();
    let query = 'SELECT * FROM transactions';
    const params = [];

    if (sessionId) {
      query += ' WHERE session_id = ?';
      params.push(sessionId);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map((r) => ({
      receiptId: r.receipt_id,
      proposalId: r.proposal_id,
      sessionId: r.session_id,
      tokenIn: r.token_in,
      tokenOut: r.token_out,
      amountIn: r.amount_in,
      amountOut: r.amount_out,
      rate: r.rate,
      txHash: r.tx_hash,
      explorerUrl: r.explorer_url,
      estimatedGasEth: r.estimated_gas_eth,
      network: r.network,
      status: r.status,
      errorMessage: r.error_message,
      timestamp: r.timestamp,
      createdAt: r.created_at
    }));
  } catch (error) {
    logger.error(LogCategory.CHAIN, `Failed to read transactions from SQLite: ${error.message}`);
    return [];
  }
}

export function getTransactionByReceiptId(receiptId) {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM transactions WHERE receipt_id = ? LIMIT 1');
    const r = stmt.get(receiptId);
    if (!r) return null;

    return {
      receiptId: r.receipt_id,
      proposalId: r.proposal_id,
      sessionId: r.session_id,
      tokenIn: r.token_in,
      tokenOut: r.token_out,
      amountIn: r.amount_in,
      amountOut: r.amount_out,
      rate: r.rate,
      txHash: r.tx_hash,
      explorerUrl: r.explorer_url,
      estimatedGasEth: r.estimated_gas_eth,
      network: r.network,
      status: r.status,
      errorMessage: r.error_message,
      timestamp: r.timestamp,
      createdAt: r.created_at
    };
  } catch (error) {
    logger.error(LogCategory.CHAIN, `Failed to query transaction ${receiptId}: ${error.message}`);
    return null;
  }
}

export function clearDatabaseTransactions(sessionId = null) {
  try {
    const db = getDatabase();
    if (sessionId) {
      const stmt = db.prepare('DELETE FROM transactions WHERE session_id = ?');
      stmt.run(sessionId);
    } else {
      db.exec('DELETE FROM transactions');
    }
    logger.info(LogCategory.CHAIN, `SQLite transactions cleared${sessionId ? ` for session ${sessionId}` : ''}`);
    return true;
  } catch (error) {
    logger.error(LogCategory.CHAIN, `Failed to clear transactions: ${error.message}`);
    return false;
  }
}
