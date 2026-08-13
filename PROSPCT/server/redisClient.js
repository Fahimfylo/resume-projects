const { createClient } = require('redis');

let client = null;
let hasGivenUp = false;

const createRedisClient = () => {
    const newClient = createClient({
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            reconnectStrategy: (retries) => {
                if (retries > 5) {
                    console.error(`Redis: Too many reconnection attempts (${retries}), extending delay`);
                    hasGivenUp = true;
                    // Reset hasGivenUp after a long cooldown so it can try again later
                    setTimeout(() => { hasGivenUp = false; }, 60000);
                    return Math.min(retries * 200, 10000);
                }
                const delay = Math.min(retries * 100, 2000);
                return delay;
            }
        }
    });

    newClient.on('error', err => {
        if (!err.message.includes('max number of clients')) {
            console.error('Redis Connection Error:', err.message);
        }
    });

    newClient.on('connect', () => {
        hasGivenUp = false;
        console.log('[REDIS] Connected successfully');
    });

    newClient.on('reconnecting', () => {
        console.warn('[REDIS] Reconnecting...');
    });

    newClient.on('disconnect', () => {
        console.warn('[REDIS] Disconnected');
    });

    return newClient;
};

client = createRedisClient();

// Connect with retry logic
let isConnecting = false;

const connectWithRetry = async () => {
    if (isConnecting || client.isOpen) {
        return;
    }

    isConnecting = true;
    try {
        await client.connect();
        console.log('[REDIS] Initial connection established');
    } catch (err) {
        console.error('[REDIS] Initial connection failed:', err.message);
        // Don't throw - let server continue
    } finally {
        isConnecting = false;
    }
};

// Connect asynchronously - don't block server startup
connectWithRetry();

// Export a safe client that handles failures
const safeClient = {
    get: async (...args) => {
        if (!client.isOpen || hasGivenUp) return null;
        try {
            return await client.get(...args);
        } catch (err) {
            console.error('Redis get error:', err.message);
            return null;
        }
    },
    set: async (...args) => {
        if (!client.isOpen || hasGivenUp) return;
        try {
            return await client.set(...args);
        } catch (err) {
            console.error('Redis set error:', err.message);
        }
    },
    keys: async (...args) => {
        if (!client.isOpen || hasGivenUp) return [];
        try {
            return await client.keys(...args);
        } catch (err) {
            console.error('Redis keys error:', err.message);
            return [];
        }
    },
    del: async (...args) => {
        if (!client.isOpen || hasGivenUp) return;
        try {
            return await client.del(...args);
        } catch (err) {
            console.error('Redis del error:', err.message);
        }
    },
    exists: async (key) => {
        if (!client.isOpen || hasGivenUp) return 0;
        try { return await client.exists(key); } catch { return 0; }
    },
    sCard: async (key) => {
        if (!client.isOpen || hasGivenUp) return 0;
        try { return await client.sCard(key); } catch { return 0; }
    },
    sAdd: async (key, members) => {
        if (!client.isOpen || hasGivenUp) return;
        try { return await client.sAdd(key, members); } catch { }
    },
    sInterStore: async (dest, key1, key2) => {
        if (!client.isOpen || hasGivenUp) return;
        try { return await client.sInterStore(dest, key1, key2); } catch { }
    },
    expire: async (key, ttl) => {
        if (!client.isOpen || hasGivenUp) return;
        try { return await client.expire(key, ttl); } catch { }
    },
    info: async (section) => {
        if (!client.isOpen || hasGivenUp) return '';
        try { return await client.info(section); } catch { return ''; }
    },
    isOpen: () => client.isOpen && !hasGivenUp,
    connect: () => client.connect(),
    on: (...args) => client.on(...args),
    disconnect: () => client.disconnect()
};

module.exports = safeClient;
