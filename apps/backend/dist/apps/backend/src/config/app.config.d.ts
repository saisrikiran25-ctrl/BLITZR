export declare const appConfig: () => {
    port: number;
    nodeEnv: string;
    jwt: {
        secret: string;
        expiration: string;
    };
    bondingCurve: {
        scalingConstantK: number;
    };
    rateLimiting: {
        maxTradesPerMinute: number;
    };
};
