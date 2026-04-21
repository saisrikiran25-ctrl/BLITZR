const http = require('http');

async function test() {
  const registerOpts = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const makeReq = (options, postData) => new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });

  const regRes = await makeReq(registerOpts, JSON.stringify({ email: `test_${Date.now()}@iift.edu`, username: `TestUser_${Date.now()}`, password: 'Password123!', campus: 'IIFT Delhi' }));
  console.log('Register status:', regRes.status);
  console.log('Register body:', regRes.body);
}
test().catch(console.error);
