import { FastifyReply, FastifyRequest } from "fastify";

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    message?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
    const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options;

    return async function rateLimiter(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<void> {
        const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const routePath = request.url || 'unknown';
        const key = `${clientIp}:${routePath}`;

        // Clean up expired entries periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup
            cleanupExpiredEntries(now);
        }

        const record = rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            // First request or window has expired
            rateLimitStore.set(key, {
                count: 1,
                resetTime: now + windowMs
            });
            return;
        }

        if (record.count >= maxRequests) {
            // Rate limit exceeded
            const resetTimeSeconds = Math.ceil((record.resetTime - now) / 1000);
            
            reply.status(429).headers({
                'Retry-After': resetTimeSeconds.toString(),
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
            }).send({
                success: false,
                message,
                retryAfter: resetTimeSeconds
            });
            return;
        }

        // Increment counter
        record.count++;
        rateLimitStore.set(key, record);

        // Add rate limit headers
        reply.headers({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': (maxRequests - record.count).toString(),
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
        });
    };
}

function cleanupExpiredEntries(now: number): void {
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// Predefined rate limiters for common use cases
export const authRateLimiter = createRateLimiter({
    windowMs: 1 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again in 15 minutes.'
});

export const generalAuthRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute for other auth endpoints
    message: 'Too many requests, please try again in a minute.'
});

export const refreshTokenRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 refresh attempts per 5 minutes
    message: 'Too many token refresh attempts, please try again later.'
});

export const emailVerificationRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute for email verification checks
    message: 'Too many verification checks, please try again in a minute.'
});