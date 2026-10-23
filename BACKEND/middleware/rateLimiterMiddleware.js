
const { ApiError } = require("../utils/APIerrors");

const rateLimitMap = new Map();

/**
 * Custom Rate Limiting Middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per IP per window
 */
const rateLimiter = ({ windowMs = 60 * 1000, max = 5 } = {}) => {
    // Clean up expired IP entries
    const cleanupTimer = setInterval(() => {
        const now = Date.now();

        for (const [ip, record] of rateLimitMap.entries()) {
            if (now - record.startTime >= windowMs) {
                rateLimitMap.delete(ip);
            }
        }
    }, windowMs);

    cleanupTimer.unref?.();

    return (req, res, next) => {
        const clientIp =
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.ip ||
            req.socket.remoteAddress;

        const now = Date.now();
        const record = rateLimitMap.get(clientIp);

        // New client or expired window
        if (!record || now - record.startTime >= windowMs) {
            rateLimitMap.set(clientIp, {
                count: 1,
                startTime: now
            });

            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", max - 1);

            return next();
        }

        // Limit exceeded
        if (record.count >= max) {
            const retryAfterSeconds = Math.max(
                1,
                Math.ceil(
                    (record.startTime + windowMs - now) / 1000
                )
            );

            res.setHeader("X-RateLimit-Limit", max);
            res.setHeader("X-RateLimit-Remaining", 0);
            res.setHeader("Retry-After", retryAfterSeconds);

            return next(
                new ApiError(
                    429,
                    `Too many requests. Please try again in ${retryAfterSeconds} seconds.`
                )
            );
        }

        // Increment request count
        record.count++;

        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader(
            "X-RateLimit-Remaining",
            max - record.count
        );

        next();
    };
};

module.exports = { rateLimiter };
