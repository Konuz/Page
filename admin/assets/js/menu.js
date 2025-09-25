document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('admin-mobile-nav');
    const overlay = document.getElementById('admin-menu-overlay');

    const closeMenu = () => {
        mobileNav.classList.remove('is-active');
        overlay.classList.remove('is-active');
        hamburgerBtn.classList.remove('is-active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        mobileNav.classList.add('is-active');
        overlay.classList.add('is-active');
        hamburgerBtn.classList.add('is-active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    };

    if (hamburgerBtn && mobileNav && overlay) {
        hamburgerBtn.addEventListener('click', () => {
            if (mobileNav.classList.contains('is-active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        overlay.addEventListener('click', closeMenu);
    }
});
