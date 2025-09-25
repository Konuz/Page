document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 CMS Menu debugging aktywne');

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('admin-mobile-nav');
    const overlay = document.getElementById('admin-menu-overlay');

    console.log('🔍 CMS Menu elementy:', {
        hamburgerBtn: !!hamburgerBtn,
        mobileNav: !!mobileNav,
        overlay: !!overlay
    });

    // EMERGENCY: Wymuś ukrycie menu przy załadowaniu
    const ensureCmsMenuClosed = () => {
        console.log('🚨 CMS: Wymuszanie ukrycia menu mobilnego');

        if (mobileNav) {
            mobileNav.classList.remove('is-active');
            // Dodatkowo wymuś style inline dla pewności
            mobileNav.style.transform = 'translateX(100%)';
            console.log('✅ CMS: mobileNav ukryte');
        }

        if (overlay) {
            overlay.classList.remove('is-active');
            // Dodatkowo wymuś style inline dla pewności
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            console.log('✅ CMS: overlay ukryte');
        }

        if (hamburgerBtn) {
            hamburgerBtn.classList.remove('is-active');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            console.log('✅ CMS: hamburgerBtn reset');
        }
    };

    // Wymuś ukrycie natychmiast
    ensureCmsMenuClosed();

    const closeMenu = () => {
        console.log('🔐 CMS: Zamykanie menu');
        mobileNav?.classList.remove('is-active');
        overlay?.classList.remove('is-active');
        hamburgerBtn?.classList.remove('is-active');
        hamburgerBtn?.setAttribute('aria-expanded', 'false');

        // Usuń wymuszone style po animacji
        setTimeout(() => {
            if (mobileNav && !mobileNav.classList.contains('is-active')) {
                mobileNav.style.transform = '';
            }
            if (overlay && !overlay.classList.contains('is-active')) {
                overlay.style.opacity = '';
                overlay.style.visibility = '';
            }
        }, 300);
    };

    const openMenu = () => {
        console.log('🔓 CMS: Otwieranie menu');
        mobileNav?.classList.add('is-active');
        overlay?.classList.add('is-active');
        hamburgerBtn?.classList.add('is-active');
        hamburgerBtn?.setAttribute('aria-expanded', 'true');
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

        // Dodaj escape key support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNav.classList.contains('is-active')) {
                console.log('⌨️ CMS: Escape - zamykanie menu');
                closeMenu();
            }
        });

        // Dodaj okresowe sprawdzenie na wypadek problemów
        setInterval(() => {
            // Jeśli hamburger nie ma active ale menu jest active - napraw
            const hamburgerActive = hamburgerBtn.classList.contains('is-active');
            const menuActive = mobileNav.classList.contains('is-active');
            const overlayActive = overlay.classList.contains('is-active');

            if (!hamburgerActive && (menuActive || overlayActive)) {
                console.log('🔧 CMS: Wykryto desynchronizację - naprawianie');
                closeMenu();
            }
        }, 2000);
    } else {
        console.log('⚠️ CMS: Nie wszystkie elementy menu znalezione');
    }

    // Dodaj sprawdzenie po całkowitym załadowaniu
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('🔄 CMS: Dodatkowe sprawdzenie po load');
            ensureCmsMenuClosed();
        }, 100);
    });
});
