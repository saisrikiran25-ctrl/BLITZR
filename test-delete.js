const http = require('http');

async function doRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: body.toString() });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testDelete() {
    try {
        const randomId = Math.floor(Math.random() * 100000);
        const registerData = JSON.stringify({
            email: `ghost_${randomId}@iift.edu`,
            username: `Ghoster_${randomId}`,
            password: 'Password123!',
            campusName: 'IIFT Delhi'
        });

        // 1. Register
        const regRes = await doRequest({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/v1/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(registerData)
            }
        }, registerData);

        console.log("Register status:", regRes.statusCode);
        const parsed = JSON.parse(regRes.body);
        if (!parsed.token) {
            console.log("Failed to get token:", regRes.body);
            return;
        }

        const token = parsed.token;
        const userId = parsed.user.user_id;

        // 2. Delete
        const delRes = await doRequest({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/v1/users/me',
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Delete status:", delRes.statusCode);
        console.log("Delete body:", delRes.body);

    } catch (e) {
        console.error("Test failed", e);
    }
}

testDelete();
