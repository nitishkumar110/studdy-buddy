document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and update UI
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authBtn = document.getElementById('authBtn');

    if (token && user) {
        authBtn.textContent = 'Logout';
        authBtn.href = '#';
        authBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        };
    }

    const groupsContainer = document.getElementById('groups-grid');
    const createBtn = document.getElementById('createGroupBtn');
    const modal = document.getElementById('createGroupModal');
    const closeModal = document.getElementById('closeModal');
    const createForm = document.getElementById('createGroupForm');

    // Modal logic
    createBtn?.addEventListener('click', () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to create a group!');
            window.location.href = 'login.html';
            return;
        }
        modal.style.display = 'block';
    });

    closeModal?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Create Group logic
    createForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            name: document.getElementById('groupName').value,
            subject: document.getElementById('groupSubject').value,
            description: document.getElementById('groupDescription').value
        };

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert('Group created successfully!');
                location.reload();
            } else {
                alert('Error: ' + data.message);
            }
        } catch (err) {
            console.error(err);
        }
    });

    try {
        const response = await fetch('/api/groups');
        const groups = await response.json();

        if (groups.length === 0) {
            groupsContainer.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No groups found.</p>';
            return;
        }

        groupsContainer.innerHTML = groups.map(group => `
            <div class="group-card">
                <span class="status-badge">${group.status || 'Active'}</span>
                <div class="group-icon"><i class="${group.icon_class || 'fa-solid fa-users'}"></i></div>
                <h3>${group.name}</h3>
                <p class="text-muted">${group.description || 'No description'}</p>
                <div class="group-meta">
                    <span><i class="fa-solid fa-users"></i> ${group.members_count} Members</span>
                    <span><i class="fa-solid fa-tag"></i> ${group.subject}</span>
                </div>
                <button class="btn btn-primary" onclick="joinGroup(${group.id})">Join Group</button>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error fetching groups:', err);
        groupsContainer.innerHTML = '<p class="text-center text-danger" style="grid-column: 1/-1;">Failed to load groups.</p>';
    }
});

async function joinGroup(groupId) {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Please register or login to join a group!');
        window.location.href = 'register.html';
        return;
    }

    try {
        const response = await fetch(`/api/groups/${groupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            alert('Joined group successfully! Redirecting to group chat...');
            window.location.href = `chat.html?groupId=${groupId}`;
        } else {
            alert('Failed to join: ' + result.message);
        }
    } catch (err) {
        console.error('Error joining group:', err);
    }
}
