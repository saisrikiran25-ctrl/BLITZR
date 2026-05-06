async function checkRemoteAuth() {
    const url = 'https://monkfish-app-r6nxh.ondigitalocean.app/api/v1/auth/google';
    const mockToken = 'INVALID_TOKEN'; // We just want to see the response structure
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: mockToken })
        });
        
        const data = await res.json();
        console.log('Remote response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

checkRemoteAuth();
