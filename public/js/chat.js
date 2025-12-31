// Chat Page Logic

let currentUser = null;
let socket = null;
let activeChatUser = null;
let activeChatGroup = null;
let activeChatType = 'friend'; // 'friend' or 'group'
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
    loadGroups();

    // Check for URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const groupId = urlParams.get('groupId');

    if (userId) {
        setTimeout(() => openChat(parseInt(userId)), 500);
    } else if (groupId) {
        setTimeout(() => openGroup(parseInt(groupId)), 500);
    }
});

// Handle browser back/forward buttons
window.onpopstate = (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const groupId = urlParams.get('groupId');

    if (userId) {
        openChat(parseInt(userId));
    } else if (groupId) {
        openGroup(parseInt(groupId));
    } else {
        // Reset to empty state if no ID in URL
        activeChatUser = null;
        activeChatGroup = null;
        document.getElementById('chatMain').innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-comments"></i>
                <h3>Select a friend to start chatting</h3>
                <p>Choose from your friends list to begin a conversation</p>
            </div>
        `;
        document.querySelectorAll('.friend-item').forEach(i => i.classList.remove('active'));
    }
};

// Setup Socket Listeners
function setupSocketListeners() {
    socket.on('new_message', (message) => {
        if (activeChatUser && (message.sender_id === activeChatUser.id || message.receiver_id === activeChatUser.id)) {
            appendMessage(message);
            scrollToBottom();
        }
        loadFriends();
    });

    socket.on('new_group_message', (message) => {
        if (activeChatType === 'group' && activeChatGroup && message.group_id == activeChatGroup.id) {
            appendMessage(message);
            scrollToBottom();
        }
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
    activeChatType = 'friend';
    activeChatGroup = null;

    // Update URL without refreshing
    const newUrl = `${window.location.pathname}?userId=${friendId}`;
    window.history.pushState({ userId: friendId, type: 'friend' }, '', newUrl);

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
        alert('Voice call coming soon! Try the video icon for now.');
    });

    document.getElementById('videoCallBtn').addEventListener('click', () => {
        startCall(true);
    });

    // Load messages
    loadMessages(friendId);
}

// --- WebRTC Video Call Logic ---
let peerConnection;
let localStream;
let remoteStream;
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Use Google's public STUN server
    ]
};

async function startCall(isVideo) {
    if (!activeChatUser) return;

    document.getElementById('videoCallModal').style.display = 'block';

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        document.getElementById('localVideo').srcObject = localStream;
    } catch (err) {
        console.error('Error accessing media:', err);
        alert('Could not access camera/microphone');
        return;
    }

    createPeerConnection();

    // Add local tracks to connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Create Offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Send Offer
    socket.emit('call_user', {
        userToCall: activeChatUser.id,
        signalData: offer,
        from: currentUser.id,
        name: currentUser.name
    });
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate && activeChatUser) {
            socket.emit('ice_candidate', {
                to: activeChatUser.id,
                candidate: event.candidate
            });
        }
    };

    peerConnection.ontrack = (event) => {
        document.getElementById('remoteVideo').srcObject = event.streams[0];
    };
}

// Update Listeners for Call Events
const originalSetupListeners = setupSocketListeners;
setupSocketListeners = function () {
    originalSetupListeners(); // Call original handlers

    socket.on('call_user', async (data) => {
        // Incoming Call
        activeChatUser = { id: data.from, name: data.name }; // Set caller as active context
        const popup = document.getElementById('incomingCallPopup');
        document.getElementById('callerName').textContent = data.name;
        popup.classList.remove('hidden');
        document.getElementById('videoCallModal').style.display = 'block';

        // Store offer to answer later
        window.incomingOffer = data.signal;
    });

    socket.on('call_accepted', async (signal) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    });

    socket.on('ice_candidate', async (candidate) => {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });

    socket.on('call_rejected', () => {
        alert('Call rejected');
        endCall();
    });
};

// Handle Incoming Call UI Actions
document.addEventListener('DOMContentLoaded', () => {
    // Add these inside the existing DOMContentLoaded or append here
    document.getElementById('acceptCallBtn')?.addEventListener('click', async () => {
        document.getElementById('incomingCallPopup').classList.add('hidden');

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            document.getElementById('localVideo').srcObject = localStream;
        } catch (err) {
            console.error('Error accessing media:', err);
            return;
        }

        createPeerConnection();
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        await peerConnection.setRemoteDescription(new RTCSessionDescription(window.incomingOffer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('answer_call', {
            signal: answer,
            to: activeChatUser.id
        });
    });

    document.getElementById('rejectCallBtn')?.addEventListener('click', () => {
        socket.emit('reject_call', { to: activeChatUser.id });
        document.getElementById('videoCallModal').style.display = 'none';
        document.getElementById('incomingCallPopup').classList.add('hidden');
    });

    document.getElementById('endCallBtn')?.addEventListener('click', endCall);
});

function endCall() {
    if (peerConnection) peerConnection.close();
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    document.getElementById('videoCallModal').style.display = 'none';
    location.reload(); // Simple cleanup
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

// Load Groups
async function loadGroups() {
    const token = localStorage.getItem('token');
    const groupsList = document.getElementById('groupsList');

    try {
        // We use the public endpoint but might need auth if changed back
        const response = await fetch('/api/groups', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const groups = await response.json();

        if (groups.length === 0) {
            groupsList.innerHTML = '<p style="padding:1rem;color:var(--text-muted);font-size:0.8rem;">No groups yet.</p>';
            return;
        }

        groupsList.innerHTML = groups.map(group => `
            <div class="friend-item group-item" data-group-id="${group.id}" data-group-name="${group.name}">
                <div class="user-avatar" style="background: rgba(16, 185, 129, 0.1); color: var(--secondary);">
                    <i class="${group.icon_class || 'fa-solid fa-users'}"></i>
                </div>
                <div class="friend-item-info">
                    <h4>${group.name}</h4>
                    <p>${group.members_count} Members</p>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.group-item').forEach(item => {
            item.addEventListener('click', () => {
                const groupId = parseInt(item.dataset.groupId);
                const groupName = item.dataset.groupName;
                openGroup(groupId, groupName);
            });
        });
    } catch (err) {
        console.error('Error loading groups', err);
    }
}

async function openGroup(groupId, groupName) {
    if (!groupName) {
        try {
            const res = await fetch('/api/groups');
            const groups = await res.json();
            const group = groups.find(g => g.id == groupId);
            groupName = group ? group.name : 'Unknown Group';
        } catch (e) {
            groupName = 'Group';
        }
    }
    activeChatType = 'group';
    activeChatGroup = { id: groupId, name: groupName };
    activeChatUser = null;

    // Update URL without refreshing
    const newUrl = `${window.location.pathname}?groupId=${groupId}`;
    window.history.pushState({ groupId: groupId, type: 'group' }, '', newUrl);

    // Join Socket Room
    socket.emit('join_group', groupId);

    // Update active UI
    document.querySelectorAll('.friend-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.group-item[data-group-id="${groupId}"]`)?.classList.add('active');

    // Build Chat UI
    const chatMain = document.getElementById('chatMain');
    chatMain.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <div class="user-avatar" style="background: rgba(16, 185, 129, 0.1); color: var(--secondary);"><i class="fa-solid fa-users"></i></div>
                <div>
                    <h3>${groupName}</h3>
                    <p>Group Chat</p>
                </div>
            </div>
             <div class="chat-header-actions">
                <button class="icon-btn" onclick="alert('Group call coming soon!')"><i class="fas fa-phone"></i></button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
             <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading messages...</div>
        </div>
        <div class="chat-input">
            <div class="input-wrapper">
                <textarea id="messageInput" placeholder="Type a message to group..." rows="1"></textarea>
                <div class="input-actions">
                    <button class="send-btn" id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;

    setupChatInput();

    // Load Messages
    try {
        const res = await fetch(`/api/groups/${groupId}/messages`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const messages = await res.json();
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = '<div class="empty-chat"><p>No messages yet.</p></div>';
        } else {
            messages.forEach(msg => appendMessage(msg));
            scrollToBottom();
        }
    } catch (err) {
        console.error(err);
    }
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
    // Send via socket
    if (activeChatType === 'friend') {
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

    } else if (activeChatType === 'group') {
        // Send via API for groups (socket emission handled by server to ensure room delivery)
        fetch(`/api/groups/${activeChatGroup.id}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        }).catch(err => console.error(err));
        // We will receive our own message via socket event 'new_group_message'
    }

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
    let initials = 'ME';
    if (!isSent) {
        if (message.sender_name) {
            initials = message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase();
        } else if (activeChatUser) {
            initials = activeChatUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        }
    } else {
        initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

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
