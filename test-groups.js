const http = require('http');

const PORT = 3002;

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

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testGroups() {
    try {
        console.log('--- Registering User ---');
        const user = {
            email: `groupTest_${Date.now()}@example.com`,
            password: 'password123',
            name: 'Group Admin',
            major: 'Computer Science'
        };
        const reg = await request('POST', '/auth/register', user);
        const token = reg.token;
        console.log('User registered.');

        console.log('\n--- Creating Group ---');
        const groupData = {
            name: 'Verification Group',
            subject: 'Testing',
            description: 'Testing group creation'
        };
        const groupRes = await request('POST', '/groups', groupData, token);
        console.log('Group Created:', groupRes);

        const groupId = groupRes.group.id;

        console.log('\n--- Joining Group ---');
        const joinRes = await request('POST', `/groups/${groupId}/join`, {}, token);
        console.log('Join Response:', joinRes);

        console.log('\n✅ Group Flow Verified Successfully!');
    } catch (error) {
        console.error('❌ Group Test Failed:', error);
    }
}

testGroups();
