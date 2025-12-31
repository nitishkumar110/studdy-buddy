let currentPersona = 'cs';
const mentorConfig = {
    'cs': { name: 'CS Mentor', color: '#4F46E5', icon: 'fa-code' },
    'mech': { name: 'Mech Mentor', color: '#F59E0B', icon: 'fa-gear' },
    'civil': { name: 'Civil Mentor', color: '#10B981', icon: 'fa-hard-hat' },
    'electrical': { name: 'Electrical Mentor', color: '#EC4899', icon: 'fa-bolt' }
};

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const typingIndicator = document.getElementById('typing-indicator');

// Handle Mentor Selection
function selectMentor(persona) {
    currentPersona = persona;

    // Update Sidebar UI
    document.querySelectorAll('.mentor-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(persona)) {
            item.classList.add('active');
        }
    });

    // Update Header
    const config = mentorConfig[persona];
    document.getElementById('current-mentor-name').innerText = config.name;
    const avatar = document.getElementById('current-mentor-avatar');
    if (avatar) {
        avatar.style.background = config.color;
        avatar.innerHTML = `<i class="fa-solid ${config.icon}"></i>`;
    }

    // Clear Chat or Add Divider (Optional)
    // For now, let's just clear and show new welcome
    chatMessages.innerHTML = '';
    addMessage('bot', `Switched to ${config.name}. How can I help you?`);
}

// Send Message
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // User Message
    addMessage('user', text);
    chatInput.value = '';

    // Show Typing
    typingIndicator.style.display = 'block';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, persona: currentPersona })
        });

        const data = await response.json();

        // Hide Typing
        typingIndicator.style.display = 'none';

        // Bot Message
        addMessage('bot', data.reply);

    } catch (error) {
        console.error('Chat error:', error);
        typingIndicator.style.display = 'none';
        addMessage('bot', "Sorry, I'm having trouble connecting to the server.");
    }
}

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender} animate-fade-in`;

    const config = mentorConfig[currentPersona];

    // Convert newlines to breaks for formatting
    const formattedText = text.replace(/\n/g, '<br>');

    // Check for links and auto-link them
    const linkedText = formattedText.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" style="text-decoration: underline; color: inherit;">$1</a>'
    );

    let content = '';

    if (sender === 'bot') {
        content = `
            <div class="mentor-avatar" style="background: ${config.color}; color: white; width: 32px; height: 32px; font-size: 0.9rem;">
                <i class="fa-solid ${config.icon}"></i>
            </div>
            <div class="msg-content">${linkedText}</div>
        `;
    } else {
        content = `
            <div class="msg-content">${linkedText}</div>
        `;
    }

    div.innerHTML = content;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enter key to send
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
