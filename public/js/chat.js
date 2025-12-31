// Chat Page Logic

let currentUser = null;
let socket = null;
let activeChatUser = null;
let typingTimeout = null;

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

    // Setup socket listeners
    setupSocketListeners();

    // Load friends list
    loadFriends();

    // Check if there's a userId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    if (userId) {
        setTimeout(() => openChat(parseInt(userId)), 500);
    }
});

// Setup Socket Listeners
function setupSocketListeners() {
    socket.on('new_message', (message) => {
        if (activeChatUser && (message.sender_id === activeChatUser.id || message.receiver_id === activeChatUser.id)) {
            appendMessage(message);
            scrollToBottom();
        }
        // Update friends list to show new message
        loadFriends();
    });

    socket.on('message_sent', (message) => {
        // Message confirmation
        console.log('Message sent:', message);
    });

    socket.on('user_typing', (data) => {
        if (activeChatUser && data.userId === activeChatUser.id) {
            showTypingIndicator();
        }
    });
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
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    <p>No friends yet</p>
                    <a href="friends.html" class="btn btn-primary" style="margin-top: 1rem;">Find Friends</a>
                </div>
            `;
            return;
        }

        friendsList.innerHTML = friends.map(friend => createFriendItem(friend)).join('');

        // Attach click listeners
        document.querySelectorAll('.friend-item').forEach(item => {
            item.addEventListener('click', () => {
                const friendId = parseInt(item.dataset.friendId);
                const friendName = item.dataset.friendName;
                const friendMajor = item.dataset.friendMajor;
                openChat(friendId, friendName, friendMajor);
            });
        });

    } catch (error) {
        console.error('Load friends error:', error);
    }
}

// Create Friend Item
function createFriendItem(friend) {
    const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return `
        <div class="friend-item" data-friend-id="${friend.id}" data-friend-name="${friend.name}" data-friend-major="${friend.major}">
            <div class="user-avatar">
                ${initials}
                <div class="online-indicator"></div>
            </div>
            <div class="friend-item-info">
                <h4>${friend.name}</h4>
                <p>${friend.major}</p>
            </div>
        </div>
    `;
}

// Open Chat
async function openChat(friendId, friendName, friendMajor) {
    // If name/major not provided, fetch user info
    if (!friendName) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${friendId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await response.json();
        friendName = user.name;
        friendMajor = user.major;
    }

    activeChatUser = { id: friendId, name: friendName, major: friendMajor };

    // Update active state in sidebar
    document.querySelectorAll('.friend-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.friendId) === friendId) {
            item.classList.add('active');
        }
    });

    // Build chat interface
    const chatMain = document.getElementById('chatMain');
    const initials = friendName.split(' ').map(n => n[0]).join('').toUpperCase();

    chatMain.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <div class="user-avatar">${initials}</div>
                <div>
                    <h3>${friendName}</h3>
                    <p>${friendMajor}</p>
                </div>
            </div>
            <div class="chat-header-actions">
                <button class="icon-btn" id="voiceCallBtn">
                    <i class="fas fa-phone"></i>
                </button>
                <button class="icon-btn" id="videoCallBtn">
                    <i class="fas fa-video"></i>
                </button>
                <button class="icon-btn">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
        
        <div class="chat-messages" id="chatMessages">
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading messages...
            </div>
        </div>
        
        <div class="chat-input">
            <div class="input-wrapper">
                <textarea id="messageInput" placeholder="Type a message..." rows="1"></textarea>
                <div class="input-actions">
                    <button class="icon-btn">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <button class="send-btn" id="sendBtn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup chat input
    setupChatInput();

    // Setup call buttons
    document.getElementById('voiceCallBtn').addEventListener('click', () => {
        alert('Voice call feature coming soon!');
    });

    document.getElementById('videoCallBtn').addEventListener('click', () => {
        alert('Video call feature coming soon!');
    });

    // Load messages
    loadMessages(friendId);
}

// Setup Chat Input
function setupChatInput() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';

        // Send typing indicator
        if (activeChatUser) {
            socket.emit('typing', {
                senderId: currentUser.id,
                receiverId: activeChatUser.id,
                isTyping: true
            });

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                socket.emit('typing', {
                    senderId: currentUser.id,
                    receiverId: activeChatUser.id,
                    isTyping: false
                });
            }, 1000);
        }
    });

    // Send on Enter (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
}

// Load Messages
async function loadMessages(friendId) {
    const token = localStorage.getItem('token');
    const messagesContainer = document.getElementById('chatMessages');

    try {
        const response = await fetch(`/api/messages/${friendId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const messages = await response.json();

        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-comment-dots"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
        scrollToBottom();

    } catch (error) {
        console.error('Load messages error:', error);
        messagesContainer.innerHTML = '<div class="empty-chat"><p>Error loading messages</p></div>';
    }
}

// Send Message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content || !activeChatUser) return;

    // Send via socket
    socket.emit('send_message', {
        senderId: currentUser.id,
        receiverId: activeChatUser.id,
        content: content
    });

    // Create temporary message
    const tempMessage = {
        sender_id: currentUser.id,
        receiver_id: activeChatUser.id,
        content: content,
        created_at: new Date().toISOString()
    };

    appendMessage(tempMessage);

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    scrollToBottom();
}

// Append Message
function appendMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');

    // Remove empty state if exists
    const emptyChat = messagesContainer.querySelector('.empty-chat');
    if (emptyChat) {
        messagesContainer.innerHTML = '';
    }

    // Remove loading if exists
    const loading = messagesContainer.querySelector('.loading');
    if (loading) {
        messagesContainer.innerHTML = '';
    }

    messagesContainer.insertAdjacentHTML('beforeend', createMessageHTML(message));
}

// Create Message HTML
function createMessageHTML(message) {
    const isSent = message.sender_id === currentUser.id;
    const initials = isSent ?
        currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() :
        activeChatUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

    const time = new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    return `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="user-avatar">${initials}</div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(message.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        </div>
    `;
}

// Show Typing Indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');

    // Remove existing typing indicator
    const existing = messagesContainer.querySelector('.typing-indicator');
    if (existing) return;

    const initials = activeChatUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

    messagesContainer.insertAdjacentHTML('beforeend', `
        <div class="typing-indicator">
            <div class="user-avatar">${initials}</div>
            <div class="message-bubble">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `);

    scrollToBottom();

    // Remove after 3 seconds
    setTimeout(() => {
        const indicator = messagesContainer.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }, 3000);
}

// Scroll to Bottom
function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
