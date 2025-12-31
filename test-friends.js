const http = require('http');

const PORT = 3001;

function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject({ status: res.statusCode, ...json });
                    }
                } catch (e) {
                    reject({ status: res.statusCode, message: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testFriendFlow() {
    try {
        console.log('--- Registering Users ---');
        // User A
        const userA = {
            email: `testA_${Date.now()}@example.com`,
            password: 'password123',
            name: 'Test User A',
            major: 'Computer Science'
        };
        const regA = await request('POST', '/auth/register', userA);
        const tokenA = regA.token;
        const idA = regA.userId;
        console.log(`User A registered: ID ${idA}`);

        // User B
        const userB = {
            email: `testB_${Date.now()}@example.com`,
            password: 'password123',
            name: 'Test User B',
            major: 'Mechanical Engineering'
        };
        const regB = await request('POST', '/auth/register', userB);
        const tokenB = regB.token;
        const idB = regB.userId;
        console.log(`User B registered: ID ${idB}`);

        console.log('\n--- Sending Friend Request A -> B ---');
        const reqRes = await request('POST', '/friends/request', { friendId: idB }, tokenA);
        console.log('Request Sent:', reqRes);

        console.log('\n--- Checking Requests for User B ---');
        const requestsB = await request('GET', '/friends/requests', null, tokenB);
        console.log('Requests for B:', requestsB);

        if (requestsB.length === 0) {
            throw new Error('User B received no requests!');
        }

        const requestId = requestsB[0].id;
        console.log(`Found Request ID: ${requestId}`);

        console.log('\n--- Accepting Request by User B ---');
        const acceptRes = await request('POST', `/friends/accept/${requestId}`, {}, tokenB);
        console.log('Accept Response:', acceptRes);

        console.log('\n--- Checking Friends List for User A ---');
        const friendsA = await request('GET', '/friends', null, tokenA);
        console.log('Friends of A:', friendsA);
        if (!friendsA.find(f => f.id === idB)) {
            throw new Error('User B not found in User A friends list!');
        }

        console.log('\n--- Checking Friends List for User B ---');
        const friendsB = await request('GET', '/friends', null, tokenB);
        console.log('Friends of B:', friendsB);
        if (!friendsB.find(f => f.id === idA)) {
            throw new Error('User A not found in User B friends list!');
        }

        console.log('✅ Friend Flow Verified Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testFriendFlow();
