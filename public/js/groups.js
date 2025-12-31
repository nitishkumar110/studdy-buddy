document.addEventListener('DOMContentLoaded', async () => {
    // const token = localStorage.getItem('token'); // Allow guests to view
    const groupsContainer = document.querySelector('.grid.grid-3');

    // if (!token) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    try {
        const response = await fetch('/api/groups', {
            // headers: { 'Authorization': `Bearer ${token}` } // Allow public access if backend supports it, else handle 401
        });
        // Note: We need to update backend to allow public access to GET /api/groups or we handle the error

        const groups = await response.json();

        if (groups.length === 0) {
            groupsContainer.innerHTML = '<p class="text-center">No groups found.</p>';
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
        groupsContainer.innerHTML = '<p class="text-center text-danger">Failed to load groups.</p>';
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
            alert('Joined group successfully! (You would be added to a chat in a full version)');
            location.reload(); // Refresh to show updated member count
        } else {
            alert('Failed to join: ' + result.message);
        }
    } catch (err) {
        console.error('Error joining group:', err);
    }
}
