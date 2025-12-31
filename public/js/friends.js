// Friends Page Logic

let currentUser = null;
let socket = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    // Initialize Socket.IO
    socket = io();
    socket.emit('authenticate', currentUser.id);

    // Setup event listeners
    setupTabs();
    setupSearch();
    setupNotifications();

    // Load initial data
    loadFriends();
    loadFriendRequests();
    loadNotifications();

    // Socket events
    socket.on('notification', (data) => {
        if (data.type === 'friend_request') {
            loadFriendRequests();
            loadNotifications();
        }
    });
});

// Tab Navigation
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');

            // Load data for the tab
            if (tabName === 'friends') loadFriends();
            if (tabName === 'requests') loadFriendRequests();
        });
    });
}

// Search Functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            document.getElementById('searchResults').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Search for students to add as friends</p>
                </div>
            `;
            return;
        }

        searchTimeout = setTimeout(() => searchUsers(query), 300);
    });
}

// Search Users
async function searchUsers(query) {
    const token = localStorage.getItem('token');
    const resultsContainer = document.getElementById('searchResults');

    resultsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';

    try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const users = await response.json();

        if (users.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <p>No users found</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = users.map(user => createUserCard(user)).join('');

        // Attach event listeners
        document.querySelectorAll('.add-friend-btn').forEach(btn => {
            btn.addEventListener('click', () => sendFriendRequest(btn.dataset.userId));
        });

    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<div class="empty-state"><p>Error searching users</p></div>';
    }
}

// Load Friends
async function loadFriends() {
    const token = localStorage.getItem('token');
    const friendsList = document.getElementById('friendsList');

    try {
        const response = await fetch('/api/friends', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const friends = await response.json();

        if (friends.length === 0) {
            friendsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <p>No friends yet. Start by adding some!</p>
                </div>
            `;
            return;
        }

        friendsList.innerHTML = friends.map(friend => createFriendCard(friend)).join('');

        // Attach event listeners
        attachFriendActions();

    } catch (error) {
        console.error('Load friends error:', error);
        friendsList.innerHTML = '<div class="empty-state"><p>Error loading friends</p></div>';
    }
}

// Load Friend Requests
async function loadFriendRequests() {
    const token = localStorage.getItem('token');
    const requestsList = document.getElementById('requestsList');

    try {
        const response = await fetch('/api/friends/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const requests = await response.json();

        // Update badge
        document.getElementById('requestsBadge').textContent = requests.length;

        if (requests.length === 0) {
            requestsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No pending friend requests</p>
                </div>
            `;
            return;
        }

        requestsList.innerHTML = requests.map(request => createRequestCard(request)).join('');

        // Attach event listeners
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', () => acceptFriendRequest(btn.dataset.requestId));
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => rejectFriendRequest(btn.dataset.requestId));
        });

    } catch (error) {
        console.error('Load requests error:', error);
        requestsList.innerHTML = '<div class="empty-state"><p>Error loading requests</p></div>';
    }
}

// Send Friend Request
async function sendFriendRequest(friendId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/friends/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friendId: parseInt(friendId) })
        });

        const data = await response.json();

        if (data.success) {
            alert('Friend request sent!');
            document.querySelector(`[data-user-id="${friendId}"]`).disabled = true;
            document.querySelector(`[data-user-id="${friendId}"]`).innerHTML = '<i class="fas fa-check"></i> Request Sent';
        } else {
            alert(data.message || 'Failed to send friend request');
        }
    } catch (error) {
        console.error('Send request error:', error);
        alert('Error sending friend request');
    }
}

// Accept Friend Request
async function acceptFriendRequest(requestId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/friends/accept/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            loadFriendRequests();
            loadFriends();
        } else {
            alert(data.message || 'Failed to accept request');
        }
    } catch (error) {
        console.error('Accept request error:', error);
    }
}

// Reject Friend Request
async function rejectFriendRequest(requestId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/friends/reject/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            loadFriendRequests();
        }
    } catch (error) {
        console.error('Reject request error:', error);
    }
}

// Create User Card (Search Results)
function createUserCard(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return `
        <div class="friend-card">
            <div class="friend-header">
                <div class="friend-avatar">${initials}</div>
                <div class="friend-info">
                    <h3>${user.name}</h3>
                    <p>${user.major}</p>
                </div>
            </div>
            ${user.bio ? `<p class="friend-bio">${user.bio}</p>` : ''}
            <div class="friend-actions">
                <button class="btn btn-primary add-friend-btn" data-user-id="${user.id}">
                    <i class="fas fa-user-plus"></i> Add Friend
                </button>
            </div>
        </div>
    `;
}

// Create Friend Card
function createFriendCard(friend) {
    const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return `
        <div class="friend-card">
            <div class="friend-header">
                <div class="friend-avatar">
                    ${initials}
                    <div class="online-indicator"></div>
                </div>
                <div class="friend-info">
                    <h3>${friend.name}</h3>
                    <p>${friend.major}</p>
                </div>
            </div>
            ${friend.bio ? `<p class="friend-bio">${friend.bio}</p>` : ''}
            <div class="friend-actions">
                <button class="btn btn-primary message-btn" data-friend-id="${friend.id}">
                    <i class="fas fa-comment"></i> Message
                </button>
                <button class="btn btn-secondary call-btn" data-friend-id="${friend.id}">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="btn btn-secondary remove-btn" data-friend-id="${friend.id}">
                    <i class="fas fa-user-minus"></i>
                </button>
            </div>
        </div>
    `;
}

// Create Request Card
function createRequestCard(request) {
    const initials = request.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const timeAgo = getTimeAgo(new Date(request.created_at));

    return `
        <div class="request-card">
            <div class="friend-avatar">${initials}</div>
            <div class="request-info">
                <h3>${request.name}</h3>
                <p>${request.major} • ${timeAgo}</p>
            </div>
            <div class="request-actions">
                <button class="btn btn-primary accept-btn" data-request-id="${request.id}">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn btn-secondary reject-btn" data-request-id="${request.id}">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `;
}

// Attach Friend Actions
function attachFriendActions() {
    document.querySelectorAll('.message-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = `chat.html?userId=${btn.dataset.friendId}`;
        });
    });

    document.querySelectorAll('.call-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Video call feature coming soon!');
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this friend?')) {
                removeFriend(btn.dataset.friendId);
            }
        });
    });
}

// Remove Friend
async function removeFriend(friendId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/friends/${friendId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            loadFriends();
        }
    } catch (error) {
        console.error('Remove friend error:', error);
    }
}

// Notifications
function setupNotifications() {
    const notifBtn = document.getElementById('notificationBtn');
    const notifPanel = document.getElementById('notificationPanel');
    const closeBtn = document.getElementById('closeNotifPanel');

    notifBtn.addEventListener('click', () => {
        notifPanel.classList.toggle('active');
    });

    closeBtn.addEventListener('click', () => {
        notifPanel.classList.remove('active');
    });
}

async function loadNotifications() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const notifications = await response.json();
        const unreadCount = notifications.filter(n => !n.read).length;

        document.getElementById('notifCount').textContent = unreadCount;

        const notifList = document.getElementById('notificationsList');

        if (notifications.length === 0) {
            notifList.innerHTML = '<div class="empty-state"><p>No notifications</p></div>';
            return;
        }

        notifList.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.read ? '' : 'unread'}">
                <p>${notif.message}</p>
                <small>${getTimeAgo(new Date(notif.created_at))}</small>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load notifications error:', error);
    }
}

// Utility: Time Ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}
