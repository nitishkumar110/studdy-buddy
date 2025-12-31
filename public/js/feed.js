// Feed Page Logic

let currentUser = null;
let selectedImage = null;

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

    // Set user avatar
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    // Setup event listeners
    setupPostCreation();

    // Load feed
    loadFeed();
});

// Setup Post Creation
function setupPostCreation() {
    const createBtn = document.getElementById('createPostBtn');
    const postContent = document.getElementById('postContent');
    const postImage = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');

    // Image upload
    postImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedImage = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-image" onclick="removeImage()">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            };
            reader.readAsDataURL(file);
        }
    });

    // Create post
    createBtn.addEventListener('click', createPost);

    // Allow Enter+Shift to create post
    postContent.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            createPost();
        }
    });
}

// Remove Image
window.removeImage = function () {
    selectedImage = null;
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreview').innerHTML = '';
};

// Create Post
async function createPost() {
    const content = document.getElementById('postContent').value.trim();

    if (!content && !selectedImage) {
        alert('Please write something or add an image');
        return;
    }

    const token = localStorage.getItem('token');

    // Check if token exists
    if (!token) {
        alert('You are not logged in. Please login first.');
        window.location.href = 'login.html';
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    if (selectedImage) {
        formData.append('image', selectedImage);
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        // Check if response is ok (status 200-299)
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert('Your session has expired. Please login again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Clear form
            document.getElementById('postContent').value = '';
            removeImage();

            // Reload feed
            loadFeed();
        } else {
            alert(data.message || 'Failed to create post');
        }
    } catch (error) {
        console.error('Create post error:', error);
        alert('Error creating post: ' + error.message);
    }
}

// Load Feed
async function loadFeed() {
    const token = localStorage.getItem('token');
    const feedContainer = document.getElementById('feedPosts');

    try {
        const response = await fetch('/api/posts/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Check if response is ok
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }

        const posts = await response.json();

        // Ensure posts is an array
        if (!Array.isArray(posts)) {
            console.error('Expected array but got:', posts);
            throw new Error('Invalid response format');
        }

        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-feed">
                    <i class="fas fa-newspaper"></i>
                    <h3>No posts yet</h3>
                    <p>Be the first to share something with your friends!</p>
                </div>
            `;
            return;
        }

        feedContainer.innerHTML = posts.map(post => createPostCard(post)).join('');

        // Attach event listeners
        attachPostActions();

    } catch (error) {
        console.error('Load feed error:', error);
        feedContainer.innerHTML = '<div class="empty-feed"><p>Error loading feed</p></div>';
    }
}

// Create Post Card
function createPostCard(post) {
    const initials = post.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const timeAgo = getTimeAgo(new Date(post.created_at));
    const isLiked = post.user_liked === 1;

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <div class="user-avatar">${initials}</div>
                <div class="post-author-info">
                    <h4>${post.name}</h4>
                    <p>${post.major} • ${timeAgo}</p>
                </div>
            </div>
            
            <div class="post-content">
                <p class="post-text">${escapeHtml(post.content)}</p>
                ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
            </div>
            
            <div class="post-stats">
                <span><i class="fas fa-heart"></i> ${post.likes_count} likes</span>
                <span>${timeAgo}</span>
            </div>
            
            <div class="post-actions-bar">
                <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                    ${isLiked ? 'Liked' : 'Like'}
                </button>
                <button class="post-action-btn comment-btn" data-post-id="${post.id}">
                    <i class="far fa-comment"></i>
                    Comment
                </button>
                <button class="post-action-btn share-btn" data-post-id="${post.id}">
                    <i class="far fa-share-square"></i>
                    Share
                </button>
            </div>
        </div>
    `;
}

// Attach Post Actions
function attachPostActions() {
    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postId = btn.dataset.postId;
            await toggleLike(postId);
        });
    });

    // Comment buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Comments feature coming soon!');
        });
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postCard = btn.closest('.post-card');
            const author = postCard.querySelector('.post-author-info h4').innerText;
            const content = postCard.querySelector('.post-text').innerText;
            const postId = btn.dataset.postId;

            const shareData = {
                title: `Post by ${author} on Studdy-Buddy`,
                text: content,
                url: `${window.location.origin}/feed.html?post=${postId}` // Hypothetical deep link
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\nRead more at: ${shareData.url}`);

                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 2000);
                }
            } catch (err) {
                console.error('Error sharing:', err);
            }
        });
    });
}

// Toggle Like
async function toggleLike(postId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (data.success) {
            // Update UI
            const btn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            const icon = btn.querySelector('i');

            if (data.liked) {
                btn.classList.add('liked');
                icon.className = 'fas fa-heart';
                btn.innerHTML = `<i class="fas fa-heart"></i> Liked`;
            } else {
                btn.classList.remove('liked');
                icon.className = 'far fa-heart';
                btn.innerHTML = `<i class="far fa-heart"></i> Like`;
            }

            // Update like count
            const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            const statsSpan = postCard.querySelector('.post-stats span:first-child');
            const currentLikes = parseInt(statsSpan.textContent.match(/\d+/)[0]);
            const newLikes = data.liked ? currentLikes + 1 : currentLikes - 1;
            statsSpan.innerHTML = `<i class="fas fa-heart"></i> ${newLikes} likes`;
        }
    } catch (error) {
        console.error('Toggle like error:', error);
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

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
