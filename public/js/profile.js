// Profile Page JavaScript

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : '/api';

let currentUser = null;
let viewingUserId = null;
let isOwnProfile = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = JSON.parse(user);

    // Check if viewing own profile or someone else's
    const urlParams = new URLSearchParams(window.location.search);
    viewingUserId = urlParams.get('id') || currentUser.id;
    isOwnProfile = viewingUserId == currentUser.id;

    // Update auth button
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.textContent = 'Logout';
        authBtn.href = '#';
        authBtn.onclick = logout;
    }

    // Show/hide edit button based on ownership
    const editBtn = document.getElementById('editProfileBtn');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const uploadResumeBtn = document.getElementById('uploadResumeBtn');

    if (!isOwnProfile) {
        if (editBtn) editBtn.style.display = 'none';
        if (avatarUploadBtn) avatarUploadBtn.style.display = 'none';
        if (uploadResumeBtn) uploadResumeBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

async function loadProfile() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE}/users/profile/${viewingUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const profile = await response.json();
        displayProfile(profile);
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}

function displayProfile(profile) {
    // Basic info
    document.getElementById('profileName').textContent = profile.name || 'Anonymous';
    document.getElementById('profileMajor').textContent = profile.major || 'Student';
    document.getElementById('profileQuote').textContent = profile.quote || '"Your study journey starts here"';
    document.getElementById('profileBio').textContent = profile.bio || 'No bio added yet.';

    // Profile image
    const avatar = document.getElementById('profileAvatar');
    if (profile.profile_image) {
        avatar.src = profile.profile_image;
    }

    // Interests
    const interestsContainer = document.getElementById('interestsContainer');
    if (profile.interests && profile.interests.length > 0) {
        interestsContainer.innerHTML = profile.interests.map(interest =>
            `<span class="tag">${escapeHtml(interest)}</span>`
        ).join('');
    } else {
        interestsContainer.innerHTML = '<span class="tag text-muted">No interests added yet</span>';
    }

    // Skills
    const skillsContainer = document.getElementById('skillsContainer');
    if (profile.skills && profile.skills.length > 0) {
        skillsContainer.innerHTML = profile.skills.map(skill =>
            `<span class="tag">${escapeHtml(skill)}</span>`
        ).join('');
    } else {
        skillsContainer.innerHTML = '<span class="tag text-muted">No skills added yet</span>';
    }

    // Resume
    const resumeContainer = document.getElementById('resumeContainer');
    if (profile.resume_url) {
        resumeContainer.innerHTML = `
            <a href="${profile.resume_url}" target="_blank" class="resume-link">
                <i class="fa-solid fa-file-pdf"></i>
                <span>View Resume</span>
            </a>
            ${isOwnProfile ? '<button class="btn btn-secondary" id="uploadResumeBtn"><i class="fa-solid fa-upload"></i> Update Resume</button>' : ''}
        `;
        if (isOwnProfile) {
            document.getElementById('uploadResumeBtn').addEventListener('click', () => {
                document.getElementById('resumeInput').click();
            });
        }
    }

    // Social links
    const socialLinksContainer = document.getElementById('socialLinksContainer');
    if (profile.social_links && Object.keys(profile.social_links).length > 0) {
        let linksHTML = '';
        if (profile.social_links.github) {
            linksHTML += `
                <a href="${profile.social_links.github}" target="_blank" class="social-link github">
                    <i class="fa-brands fa-github"></i>
                    <span>GitHub</span>
                </a>
            `;
        }
        if (profile.social_links.linkedin) {
            linksHTML += `
                <a href="${profile.social_links.linkedin}" target="_blank" class="social-link linkedin">
                    <i class="fa-brands fa-linkedin"></i>
                    <span>LinkedIn</span>
                </a>
            `;
        }
        if (profile.social_links.twitter) {
            linksHTML += `
                <a href="${profile.social_links.twitter}" target="_blank" class="social-link twitter">
                    <i class="fa-brands fa-twitter"></i>
                    <span>Twitter</span>
                </a>
            `;
        }
        socialLinksContainer.innerHTML = linksHTML || '<p class="text-muted">No social links added yet.</p>';
    } else {
        socialLinksContainer.innerHTML = '<p class="text-muted">No social links added yet.</p>';
    }

    // Store profile for editing
    window.currentProfile = profile;
}

function setupEventListeners() {
    // Edit profile button
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }

    // Modal close buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

    // Edit form submit
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);

    // Avatar upload
    document.getElementById('avatarUploadBtn').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });

    document.getElementById('avatarInput').addEventListener('change', handleAvatarUpload);

    // Resume upload
    const uploadResumeBtn = document.getElementById('uploadResumeBtn');
    if (uploadResumeBtn) {
        uploadResumeBtn.addEventListener('click', () => {
            document.getElementById('resumeInput').click();
        });
    }

    document.getElementById('resumeInput').addEventListener('change', handleResumeUpload);

    // Close modal on outside click
    document.getElementById('editProfileModal').addEventListener('click', (e) => {
        if (e.target.id === 'editProfileModal') {
            closeEditModal();
        }
    });
}

function openEditModal() {
    const profile = window.currentProfile;

    // Populate form
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editMajor').value = profile.major || '';
    document.getElementById('editQuote').value = profile.quote || '';
    document.getElementById('editBio').value = profile.bio || '';

    // Interests and skills
    document.getElementById('editInterests').value = profile.interests ? profile.interests.join(', ') : '';
    document.getElementById('editSkills').value = profile.skills ? profile.skills.join(', ') : '';

    // Social links
    document.getElementById('editGithub').value = profile.social_links?.github || '';
    document.getElementById('editLinkedin').value = profile.social_links?.linkedin || '';
    document.getElementById('editTwitter').value = profile.social_links?.twitter || '';

    // Show modal
    document.getElementById('editProfileModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const token = localStorage.getItem('token');

    // Collect form data
    const name = document.getElementById('editName').value.trim();
    const major = document.getElementById('editMajor').value.trim();
    const quote = document.getElementById('editQuote').value.trim();
    const bio = document.getElementById('editBio').value.trim();

    // Parse interests and skills
    const interestsStr = document.getElementById('editInterests').value.trim();
    const skillsStr = document.getElementById('editSkills').value.trim();

    const interests = interestsStr ? interestsStr.split(',').map(s => s.trim()).filter(s => s) : [];
    const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s) : [];

    // Social links
    const social_links = {
        github: document.getElementById('editGithub').value.trim(),
        linkedin: document.getElementById('editLinkedin').value.trim(),
        twitter: document.getElementById('editTwitter').value.trim()
    };

    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                major,
                quote,
                bio,
                interests,
                skills,
                social_links
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        showNotification('Profile updated successfully!', 'success');
        closeEditModal();
        loadProfile(); // Reload profile
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}

async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
        const response = await fetch(`${API_BASE}/users/profile/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        showNotification('Profile image updated!', 'success');

        // Update avatar immediately
        document.getElementById('profileAvatar').src = data.imageUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        showNotification('Failed to upload image', 'error');
    }
}

async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please select a PDF or Word document', 'error');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('Resume size must be less than 10MB', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('resume', file);

    try {
        const response = await fetch(`${API_BASE}/users/profile/resume`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload resume');
        }

        const data = await response.json();
        showNotification('Resume uploaded successfully!', 'success');
        loadProfile(); // Reload to show new resume
    } catch (error) {
        console.error('Error uploading resume:', error);
        showNotification('Failed to upload resume', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
