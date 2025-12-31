document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.querySelector('.grid');
    if (!grid) return;

    // Clear existing static cards (optional, if we want to remove hardcoded ones)
    // For now, let's Replace the entire grid content with a loading state or just clear it.
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Loading buddies...</p></div>';

    try {
        const response = await fetch('/api/buddies');
        const users = await response.json();

        // Get current user from local storage to filter self out
        const currentUserData = localStorage.getItem('user');
        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;

        grid.innerHTML = ''; // Clear loading

        if (users.length === 0) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No buddies found yet. Be the first!</p>';
            return;
        }

        users.forEach(user => {
            // Filter out self
            if (currentUser && user.id === currentUser.id) return;

            const card = createProfileCard(user);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching buddies:', error);
        grid.innerHTML = '<p class="text-error" style="grid-column: 1/-1; text-align: center;">Failed to load buddies. Please try again later.</p>';
    }
});

function createProfileCard(user) {
    const card = document.createElement('div');
    card.className = 'profile-card animate-fade-in';

    // Randomize avatar color for variety
    const colors = ['var(--primary)', 'var(--secondary)', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Determine icon based on major (simple heuristic)
    let icon = 'fa-user-graduate';
    const major = user.major ? user.major.toLowerCase() : '';
    if (major.includes('comp') || major.includes('code') || major.includes('soft')) icon = 'fa-code';
    else if (major.includes('sci') || major.includes('phy') || major.includes('chem')) icon = 'fa-flask';
    else if (major.includes('eng') || major.includes('mech') || major.includes('civil')) icon = 'fa-wrench';
    else if (major.includes('med') || major.includes('doc')) icon = 'fa-user-doctor';
    else if (major.includes('art') || major.includes('hist')) icon = 'fa-palette';

    card.innerHTML = `
        <div class="profile-avatar" style="background: ${randomColor}">
            <i class="fa-solid ${icon}"></i>
        </div>
        <h3>${escapeHtml(user.name || 'Anonymous')}</h3>
        <p class="text-muted">${escapeHtml(user.major || 'Undecided')}</p>
        
        <div class="tags">
            <!-- Placeholders for now, later we can add tags to DB -->
            <span class="tag">Student</span>
            <span class="tag">Learner</span>
        </div>
        
        <button class="btn btn-secondary" style="width: 100%" onclick="sendRequest(${user.id}, '${escapeHtml(user.name)}', this)">Connect</button>
    `;

    return card;
}

// Send Friend Request
async function sendRequest(userId, userName, btnElement) {
    const token = localStorage.getItem('token');

    // Disable button immediately
    const originalText = btnElement.innerText;
    btnElement.disabled = true;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friendId: userId })
        });

        const data = await response.json();

        if (data.success) {
            btnElement.innerHTML = '<i class="fas fa-check"></i> Request Sent';
            btnElement.classList.add('btn-success');
        } else {
            alert(data.message || 'Failed to send request');
            btnElement.disabled = false;
            btnElement.innerText = originalText;
        }
    } catch (error) {
        console.error('Error sending request:', error);
        alert('An error occurred. Please try again.');
        btnElement.disabled = false;
        btnElement.innerText = originalText;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
