import net from 'node:net';
import { Logger } from '@nestjs/common';

const logger = new Logger('Database');
let memoryServer: { getUri: () => string } | null = null;

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Resolves the MongoDB connection URI.
 * - Remote / Atlas URIs are used as configured.
 * - A local URI is used when a daemon listens on 27017.
 * - Otherwise development falls back to an embedded in-memory server. Production never does:
 *   it fails instead of silently running on volatile storage.
 */
export async function resolveMongoUri(configuredUri: string, isProduction = false): Promise<string> {
  const isLocal = configuredUri.includes('127.0.0.1') || configuredUri.includes('localhost');
  if (configuredUri.startsWith('mongodb+srv://') || !isLocal) {
    logger.log('Connecting to remote MongoDB');
    return configuredUri;
  }

  // A local URI on a non-default port was chosen deliberately (e.g. a test database): use it as is.
  const port = /:(\d+)(?:[/?]|$)/.exec(configuredUri.replace(/^mongodb:\/\//, ''))?.[1];
  if (port !== undefined && port !== '27017') {
    return configuredUri;
  }

  if (await isPortOpen(27017)) {
    logger.log('Local MongoDB detected on 127.0.0.1:27017');
    return configuredUri;
  }

  if (isProduction) {
    throw new Error('MongoDB is not reachable at the configured local URI and the in-memory fallback is disabled in production');
  }

  if (!memoryServer) {
    logger.warn('Local MongoDB not found. Starting embedded in-memory MongoDB (data is not persisted).');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'goaylal' } });
  }
  return memoryServer.getUri();
}
