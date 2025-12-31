// Home Page - Load Recent Posts

document.addEventListener('DOMContentLoaded', () => {
    loadRecentPosts();
});

// Load Recent Posts for Home Page
async function loadRecentPosts() {
    const postsContainer = document.getElementById('homePosts');

    if (!postsContainer) return; // Not on home page

    try {
        const response = await fetch('/api/posts/recent');

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const posts = await response.json();

        if (!Array.isArray(posts)) {
            console.error('Expected array but got:', posts);
            throw new Error('Invalid response format');
        }

        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>No posts yet. Be the first to share!</p>
                </div>
            `;
            return;
        }

        postsContainer.innerHTML = posts.map(post => createHomePostCard(post)).join('');

    } catch (error) {
        console.error('Load posts error:', error);
        postsContainer.innerHTML = `
            <div class="empty-state">
                <p>Unable to load posts. Please try again later.</p>
            </div>
        `;
    }
}

// Create Post Card for Home Page
function createHomePostCard(post) {
    const initials = post.name ? post.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    const timeAgo = getTimeAgo(new Date(post.created_at));

    return `
        <div class="post-card">
            <div class="post-header">
                <div class="user-avatar">${initials}</div>
                <div class="post-author-info">
                    <h4>${escapeHtml(post.name || 'Anonymous')}</h4>
                    <p>${escapeHtml(post.major || 'Student')} • ${timeAgo}</p>
                </div>
            </div>
            
            <div class="post-content">
                <p class="post-text">${escapeHtml(post.content)}</p>
                ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
            </div>
            
            <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${post.likes_count || 0} likes</span>
                <span>${timeAgo}</span>
            </div>
        </div>
    `;
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

// Utility: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
