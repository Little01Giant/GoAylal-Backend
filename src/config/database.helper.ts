import net from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer: MongoMemoryServer | null = null;

/**
 * Checks if a TCP port is open locally
 */
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
 * Automatically resolves the MongoDB connection URI.
 * - If MongoDB Atlas / remote cluster is configured, uses it.
 * - If local MongoDB daemon is running on 27017, uses it.
 * - Otherwise, spins up an embedded in-memory MongoDB server for instant local dev.
 */
export async function resolveMongoUri(configuredUri: string): Promise<string> {
  // 1. Remote or Cloud Atlas URI
  if (
    configuredUri.startsWith('mongodb+srv://') ||
    (!configuredUri.includes('127.0.0.1') && !configuredUri.includes('localhost'))
  ) {
    console.log(`📡 Connecting to remote MongoDB: ${configuredUri.split('@')[1] ?? configuredUri}`);
    return configuredUri;
  }

  // 2. Check if local MongoDB daemon is already listening on 27017
  const isLocalRunning = await isPortOpen(27017);
  if (isLocalRunning) {
    console.log(`🔌 Local MongoDB detected on 127.0.0.1:27017. Connecting to: ${configuredUri}`);
    return configuredUri;
  }

  // 3. Fallback: Start embedded in-memory MongoDB
  if (!memoryServer) {
    console.log('⚡ Local MongoDB not found. Starting embedded In-Memory MongoDB server...');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'goaylal',
      },
    });
  }

  const inMemoryUri = memoryServer.getUri();
  console.log(`✨ In-Memory MongoDB running successfully at: ${inMemoryUri}`);
  return inMemoryUri;
}
