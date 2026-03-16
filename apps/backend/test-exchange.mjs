import fetch from 'node-fetch';

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function testExchange() {
    console.log('--- BLITZR VAULT EXCHANGE TEST ---');
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'sai@iift.edu', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        if (!token) {
            console.error('Failed to get token:', loginData);
            return;
        }

        console.log('Token acquired. Executing exchange...');

        // 2. Perform Exchange
        const exchangeRes = await fetch(`${BASE_URL}/wallet/exchange/creds-to-chips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: 10 })
        });

        const exchangeData = await exchangeRes.json();
        console.log('\n RAW API RESPONSE:');
        console.log(JSON.stringify(exchangeData, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testExchange();
