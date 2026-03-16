export const appConfig = () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || 'blitzr-dev-secret',
        expiration: process.env.JWT_EXPIRATION || '7d',
    },
    bondingCurve: {
        scalingConstantK: parseInt(process.env.SCALING_CONSTANT_K || '200', 10),
    },
    rateLimiting: {
        maxTradesPerMinute: parseInt(process.env.MAX_TRADES_PER_MINUTE || '5', 10),
    },
});
