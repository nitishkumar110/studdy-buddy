// Chat Page Logic

let currentUser = null;
let socket = null;
let activeChatUser = null;
let activeChatGroup = null;
let activeChatType = 'friend'; // 'friend' or 'group'
let typingTimeout = null;
let selectedFile = null;

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
                    <label class="icon-btn" for="fileInput" title="Attach file">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx" style="display: none;">
                    </label>
                    <button class="send-btn" id="sendBtn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div id="filePreview" class="file-preview-chat" style="display: none;"></div>
        </div>
    `;

    // Setup chat input
    setupChatInput();

    // Setup call buttons - show coming soon messages
    const voiceCallBtn = document.getElementById('voiceCallBtn');
    if (voiceCallBtn) {
        voiceCallBtn.addEventListener('click', () => {
            alert('Voice call feature coming soon!');
        });
    }

    const videoCallBtn = document.getElementById('videoCallBtn');
    if (videoCallBtn) {
        videoCallBtn.addEventListener('click', () => {
            alert('Video call feature coming soon!');
        });
    }

    // Load messages
    loadMessages(friendId);
}

// Setup Chat Input
function setupChatInput() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');

    // File input handler
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                showFilePreview(file, filePreview);
            }
        });
    }

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

// Show file preview
function showFilePreview(file, previewContainer) {
    if (!previewContainer) return;

    const isImage = file.type.startsWith('image/');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <div class="file-preview-item">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                    <button onclick="removeFilePreview()" class="remove-file-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        const icon = getFileIcon(file.name);
        previewContainer.innerHTML = `
            <div class="file-preview-item">
                <div class="file-info">
                    <i class="${icon}"></i>
                    <div>
                        <p>${file.name}</p>
                        <span>${fileSize} MB</span>
                    </div>
                </div>
                <button onclick="removeFilePreview()" class="remove-file-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        previewContainer.style.display = 'block';
    }
}

// Remove file preview
window.removeFilePreview = function () {
    selectedFile = null;
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    if (fileInput) fileInput.value = '';
    if (filePreview) {
        filePreview.innerHTML = '';
        filePreview.style.display = 'none';
    }
}

// Get file icon
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'txt': 'fas fa-file-alt',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint'
    };
    return iconMap[ext] || 'fas fa-file';
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
                    <label class="icon-btn" for="fileInput" title="Attach file">
                        <i class="fas fa-paperclip"></i>
                        <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx" style="display: none;">
                    </label>
                    <button class="send-btn" id="sendBtn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
            <div id="filePreview" class="file-preview-chat" style="display: none;"></div>
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
    if (!messageInput) return;

    const content = messageInput.value.trim();

    // Check if we have content or a file
    if (!content && !selectedFile) return;
    if (activeChatType === 'friend' && !activeChatUser) {
        console.error('No active chat user');
        return;
    }
    if (activeChatType === 'group' && !activeChatGroup) {
        console.error('No active chat group');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    // If file is selected, upload via API
    if (selectedFile) {
        const formData = new FormData();
        formData.append('content', content || '');
        formData.append('file', selectedFile);

        if (activeChatType === 'friend') {
            // Send file message via API for personal messages
            formData.append('receiverId', activeChatUser.id);
            fetch('/api/messages/with-file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Message will be received via socket
                        messageInput.value = '';
                        removeFilePreview();
                    } else {
                        alert('Failed to send file: ' + (data.message || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error('Error sending file message:', err);
                    alert('Failed to send file. Please try again.');
                });
        } else if (activeChatType === 'group') {
            // Send file message via API for groups
            formData.append('groupId', activeChatGroup.id);
            fetch('/api/groups/messages/with-file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Message will be received via socket
                        messageInput.value = '';
                        removeFilePreview();
                    } else {
                        alert('Failed to send file: ' + (data.message || 'Unknown error'));
                    }
                })
                .catch(err => {
                    console.error('Error sending group file message:', err);
                    alert('Failed to send file. Please try again.');
                });
        }
        return;
    }

    // Send text-only message (existing logic)
    if (activeChatType === 'friend') {
        if (!socket || !socket.connected) {
            console.error('Socket not connected');
            alert('Connection lost. Please refresh the page.');
            return;
        }

        socket.emit('send_message', {
            senderId: currentUser.id,
            receiverId: activeChatUser.id,
            content: content
        });

        // Create temporary message for immediate display
        const tempMessage = {
            sender_id: currentUser.id,
            receiver_id: activeChatUser.id,
            content: content,
            created_at: new Date().toISOString(),
            sender_name: currentUser.name
        };
        appendMessage(tempMessage);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        scrollToBottom();

    } else if (activeChatType === 'group') {
        // Create temporary message for immediate display
        const tempMessage = {
            group_id: activeChatGroup.id,
            user_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
            sender_name: currentUser.name
        };
        appendMessage(tempMessage);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        scrollToBottom();

        // Send to server
        fetch(`/api/groups/${activeChatGroup.id}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to send message');
                }
                return response.json();
            })
            .then(data => {
                console.log('Group message sent:', data);
            })
            .catch(err => {
                console.error('Error sending group message:', err);
                alert('Failed to send message. Please try again.');
                const messagesContainer = document.getElementById('chatMessages');
                const lastMessage = messagesContainer.lastElementChild;
                if (lastMessage && lastMessage.classList.contains('message')) {
                    lastMessage.remove();
                }
            });
    }
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
    // For group messages, check user_id instead of sender_id
    const isSent = (message.sender_id === currentUser.id) || (message.user_id === currentUser.id);
    let initials = 'ME';
    let senderName = '';

    if (!isSent) {
        if (message.sender_name) {
            senderName = message.sender_name;
            initials = message.sender_name.split(' ').map(n => n[0]).join('').toUpperCase();
        } else if (activeChatUser && activeChatType === 'friend') {
            senderName = activeChatUser.name;
            initials = activeChatUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        } else if (activeChatType === 'group') {
            senderName = message.sender_name || 'Unknown';
            initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase();
        }
    } else {
        senderName = currentUser.name;
        initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    const time = new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    // For group messages, show sender name
    const senderLabel = (activeChatType === 'group' && !isSent) ? `<span class="sender-name">${escapeHtml(senderName)}</span>` : '';

    // Handle file attachments
    let fileDisplay = '';
    if (message.file_url) {
        const ext = message.file_url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            // Image file
            fileDisplay = `<div class="message-file"><img src="${message.file_url}" alt="Attachment" class="message-image" onclick="window.open('${message.file_url}', '_blank')"></div>`;
        } else {
            // Document file
            const icon = getFileIcon(message.file_url);
            const fileName = message.file_url.split('/').pop();
            fileDisplay = `<div class="message-file"><a href="${message.file_url}" target="_blank" class="file-attachment"><i class="${icon}"></i><span>${escapeHtml(fileName)}</span></a></div>`;
        }
    }

    return `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="user-avatar">${initials}</div>
            <div class="message-content">
                ${senderLabel}
                ${message.content ? `<div class="message-bubble">${escapeHtml(message.content)}</div>` : ''}
                ${fileDisplay}
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
