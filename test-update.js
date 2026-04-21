const http = require('http');

async function test() {
  const ts = Math.floor(Date.now() / 1000).toString().substring(5, 10);
  const loginData = JSON.stringify({
    email: `test_${ts}@iift.edu`,
    password: 'Password123!'
  });

  const registerOpts = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const loginOpts = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
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

  const makeGet = (options) => new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });

  // Register user
  const regBody = JSON.stringify({ email: `test_${ts}@iift.edu`, username: `Usr_${ts}`, password: 'Password123!', campus: 'IIFT Delhi' });
  const regRes = await makeReq(registerOpts, regBody);
  console.log('Reg status:', regRes.status);
  console.log('Reg:', regRes.body);

  const loginRes = await makeReq(loginOpts, loginData);
  let token;
  try {
     token = JSON.parse(loginRes.body).token;
  } catch(e) {}
  
  if (!token) {
     console.log('Login failed:', loginRes.body);
     return;
  }

  // Update Profile
  const updateOpts = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/users/me',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  };
  
  const updateRes = await makeReq(updateOpts, JSON.stringify({ username: `Us2_${ts}` }));
  console.log('Update res status:', updateRes.status);
  console.log('Update res body:', updateRes.body);

  // Get Profile
  const getOpts = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/users/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const getRes = await makeGet(getOpts);
  console.log('Get res:', getRes.body);

  // Wait 1 second 
  await new Promise(r => setTimeout(r, 1000));
}

test().catch(console.error);
