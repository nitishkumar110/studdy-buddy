document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Theme Toggling ---
    const themeBtn = document.getElementById('theme-toggle');
    const themes = ['light', 'dark', 'glass', 'pastel'];
    let currentThemeIndex = themes.indexOf(localStorage.getItem('theme')) || 0;
    if (currentThemeIndex === -1) currentThemeIndex = 0;

    // Set initial icon based on theme (optional enhancement)
    updateThemeIcon(themes[currentThemeIndex]);

    themeBtn.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const newTheme = themes[currentThemeIndex];
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeIcon(newTheme);
        
        // Add a little animation to the button
        themeBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => themeBtn.style.transform = 'none', 300);
    });

    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i');
        icon.className = 'fa-solid';
        if (theme === 'light') icon.classList.add('fa-sun');
        else if (theme === 'dark') icon.classList.add('fa-moon');
        else if (theme === 'glass') icon.classList.add('fa-wand-magic-sparkles');
        else if (theme === 'pastel') icon.classList.add('fa-palette');
    }

    // --- 2. Mobile Menu ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // --- 3. Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.animationPlayState = 'running'; // If paused
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select elements to animate. 
    // Note: CSS handles the animation definition, this just triggers or we can add a class
    // For simplicity with existing CSS, we'll select elements with .feature-card and others if needed
    // Actually, in CSS I used .animate-fade-in. Let's make sure they run.
    
    // If elements have .animate-fade-in class, they will run on load.
    // Let's add 'fade-on-scroll' class logic for elements further down.
    
    const scrollElements = document.querySelectorAll('.feature-card, .cta-box');
    scrollElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // Override the observer callback for these manual style ones
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    scrollElements.forEach(el => scrollObserver.observe(el));
});
