// Skrypt załadowany

const DEV_MODE = (typeof __DEV__ !== 'undefined') ? __DEV__ : (
    typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.protocol === 'file:'
    )
);

// Kompleksowa obsługa błędów CORS - głównie dla środowiska deweloperskiego
if (DEV_MODE) {
    (function() {
        'use strict';
        
        // Lista wzorców błędów do ignorowania
        const ignoredErrors = [
            'cross-origin frame',
            'SecurityError',
            'Blocked a frame with origin',
            'Permission denied to access property',
            'Failed to read a named property',
            'Script error',
            'Non-Error promise rejection captured',
            'ResizeObserver loop limit exceeded'
        ];
        
        // Obsługa błędów globalnych
        window.addEventListener('error', function(event) {
            const message = event.message || '';
            const filename = event.filename || '';
            
            // Sprawdź czy to błąd CORS lub związany z zewnętrznymi skryptami
            if (ignoredErrors.some(pattern => message.includes(pattern)) ||
                filename.includes('google') ||
                filename.includes('maps') ||
                filename.includes('all.iife.js') ||
                filename.includes('cdnjs.cloudflare.com')) {
                console.debug('Ignoruję błąd zewnętrznego skryptu', {
                    message: message.substring(0, 100),
                    filename,
                    source: 'iframe/external',
                    protocol: window.location.protocol,
                    hostname: window.location.hostname,
                    note: 'Ten błąd prawdopodobnie zniknie na hostingu HTTPS'
                });

                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, true);
        
        // Obsługa nieprzechwyconych promise rejections
        window.addEventListener('unhandledrejection', function(event) {
            const reason = event.reason || '';
            const reasonStr = reason.toString ? reason.toString() : String(reason);
            
            if (ignoredErrors.some(pattern => reasonStr.includes(pattern))) {
                event.preventDefault();
                return false;
            }
        });
        
        // Przywróć oryginalne console.error z filtrowaniem
        const originalError = console.error;
        console.error = function(...args) {
            const message = args.join(' ');
            if (!ignoredErrors.some(pattern => message.includes(pattern))) {
                originalError.apply(console, args);
            }
        };
        
    })();
}

// ===== LIMIT VISIBLE TOOLS TO 12 WITH SCROLL (desktop) =====
function setupGridScrollLimit() {
    const desktopQuery = window.matchMedia('(min-width: 992px)');
    const updateGridState = () => {
        const isDesktop = desktopQuery.matches;
        document.querySelectorAll('.tools-grid').forEach((grid) => {
            const shouldScroll = isDesktop && grid.children.length > 12;
            grid.classList.toggle('grid-scroll', shouldScroll);
        });
    };

    updateGridState();

    const listener = () => updateGridState();
    if (typeof desktopQuery.addEventListener === 'function') {
        desktopQuery.addEventListener('change', listener);
    } else if (typeof desktopQuery.addListener === 'function') {
        desktopQuery.addListener(listener);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGridScrollLimit);
} else {
    setupGridScrollLimit();
}

// ===== Limit submenu visible items to 12 with scroll =====
function setupSubmenuScrollLimit(visibleCount = 12) {
    const recalc = () => {
        document
            .querySelectorAll('#nav-categories .sub-dropdown .sub-dropdown-content')
            .forEach((contentEl) => {
                if (!contentEl) return;
                const shouldScroll = contentEl.querySelectorAll('a').length > visibleCount;
                contentEl.classList.toggle('submenu-scrollable', shouldScroll);
            });
    };

    recalc();

    const desktopQuery = window.matchMedia('(min-width: 992px)');
    const listener = () => recalc();
    if (typeof desktopQuery.addEventListener === 'function') {
        desktopQuery.addEventListener('change', listener);
    } else if (typeof desktopQuery.addListener === 'function') {
        desktopQuery.addListener(listener);
    }
}

// ===== COOKIE MANAGER =====
class CookieManager {
    static TRACKING_PATTERNS = ['_ga', '_fb', '_clck', '_clsk'];
    static CONSENT_KEY = 'cookieConsent';
    
    // Get consent status from localStorage
    static getConsentStatus() {
        return localStorage.getItem(this.CONSENT_KEY);
    }
    
    // Set consent status in localStorage
    static setConsentStatus(status) {
        localStorage.setItem(this.CONSENT_KEY, status);
    }
    
    // Check if specific tracking cookies exist
    static hasTrackingCookies(patterns = this.TRACKING_PATTERNS) {
        return document.cookie
            .split(';')
            .some(cookie => {
                const name = cookie.trim().split('=')[0];
                return patterns.some(pattern => name.includes(pattern));
            });
    }
    
    // Get specific cookies by pattern
    static getCookiesByPattern(patterns) {
        return document.cookie
            .split(';')
            .filter(cookie => {
                const name = cookie.trim().split('=')[0];
                return patterns.some(pattern => name.includes(pattern));
            })
            .map(cookie => cookie.trim());
    }
    
    // Remove tracking cookies (GDPR compliance)
    static removeTrackingCookies(patterns = this.TRACKING_PATTERNS) {
        let removedCount = 0;
        
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            if (patterns.some(pattern => name.includes(pattern))) {
                // Remove for current path
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                // Remove for current domain
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                removedCount++;
            }
        });
        
        return removedCount;
    }
    
    // Check if consent matches cookie state
    static validateConsentState() {
        const consent = this.getConsentStatus();
        const shouldHaveCookies = consent === 'accepted';
        const hasCookies = this.hasTrackingCookies();
        
        return {
            consent,
            shouldHaveCookies,
            hasCookies,
            isValid: shouldHaveCookies === hasCookies,
            timestamp: new Date().toISOString()
        };
    }
    
    // Get Clarity-specific cookies
    static getClarityCookies() {
        return this.getCookiesByPattern(['_clck', '_clsk']);
    }
    
    // Check if Clarity cookies exist
    static hasClarityCookies() {
        return this.hasTrackingCookies(['_clck', '_clsk']);
    }
}

// ===== ANALYTICS NAMESPACE =====
const Analytics = {
    // Core script loading functionality
    loadScript(src, attrs = {}) {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
        return new Promise((resolve, reject) => {
            s.onload = () => resolve(src);
            s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(s);
        });
    },

    // Facebook Pixel Stub Function
    ensureFbqStub() {
    if (typeof window.fbq === 'undefined') {
        (function(f,b,e,v,n,t,s){
            if(f.fbq)return; n=f.fbq=function(){ n.callMethod ?
                n.callMethod.apply(n,arguments) : n.queue.push(arguments) };
            if(!f._fbq)f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
            n.queue=[]; t=b.createElement(e); t.async=!0; t.src=v; s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }
    },

    // Specialized tracking loaders
    async loadGTM() {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            await Analytics.loadScript('https://www.googletagmanager.com/gtm.js?id=GTM-WLNRPMGP');
        
            // Update consent if gtag is available
            if (typeof window.gtag !== 'undefined') {
                window.gtag('consent', 'update', {
                    'analytics_storage': 'granted',
                    'ad_storage': 'granted',
                    'functionality_storage': 'granted',
                    'personalization_storage': 'granted',
                    'security_storage': 'granted'
                });
            }
            return { success: true, service: 'GTM' };
        } catch (error) {
            return { success: false, service: 'GTM', error: error.message };
        }
    },

    async loadFacebookPixel() {
        try {
            Analytics.ensureFbqStub();
            window.fbq('init', '1469053347622952');
            window.fbq('track', 'PageView');
            
            // Grant consent if available
            if (typeof window.fbq !== 'undefined') {
                window.fbq('consent', 'grant');
            }
            return { success: true, service: 'Facebook Pixel' };
        } catch (error) {
            return { success: false, service: 'Facebook Pixel', error: error.message };
        }
    },

    async loadMicrosoftClarity() {
        try {
            // Load Clarity script
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "t5f2ixde6f");
            
            // Set consent with proper error handling
            await setClarityConsent(true);
            
            // Validate after initialization
            setTimeout(async () => {
                try {
                    await validateClarityConsent();
                } catch(e) {
                    console.warn('⚠️ Validation failed:', e.message);
                }
            }, 5000);
            
            return { success: true, service: 'Microsoft Clarity' };
        } catch (error) {
            return { success: false, service: 'Microsoft Clarity', error: error.message };
        }
    }
};

// Main tracking loader function (uses Analytics namespace)
async function loadTrackingScripts() {
    if (window.__trackingLoaded) return;
    window.__trackingLoaded = true;

    // Load all trackers in parallel with individual error handling
    const trackingResults = await Promise.allSettled([
        Analytics.loadGTM(),
        Analytics.loadFacebookPixel(), 
        Analytics.loadMicrosoftClarity()
    ]);

    // Process results and log outcomes
    const successful = [];
    const failed = [];
    
    trackingResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const { success, service, error } = result.value;
            if (success) {
                successful.push(service);
            } else {
                failed.push(`${service}: ${error}`);
            }
        } else {
            failed.push(`Unknown tracker: ${result.reason}`);
        }
    });
    
    if (successful.length > 0) {
    }
    if (failed.length > 0) {
        console.warn(`⚠️ Tracking failed: ${failed.join('; ')}`);
    }
}

// Funkcja do komunikacji statusu zgody z Microsoft Clarity
function setClarityConsent(granted, maxAttempts = 5, currentAttempt = 1) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('setClarityConsent timeout after 10 seconds'));
        }, 10000);

        function attemptConsent() {
            try {
                if (typeof window.clarity !== 'undefined' && typeof window.clarity === 'function') {
                    clearTimeout(timeout);
                    if (granted) {
                        window.clarity('consent', 'grant');
                    } else {
                        window.clarity('consent', 'deny');
                    }
                    resolve(true);
                } else if (currentAttempt < maxAttempts) {
                    // Exponential backoff: 500ms, 1s, 2s, 4s
                    const delay = 500 * Math.pow(2, currentAttempt - 1);
                    setTimeout(() => {
                        setClarityConsent(granted, maxAttempts, currentAttempt + 1)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                } else {
                    clearTimeout(timeout);
                    reject(new Error(`Microsoft Clarity not available after ${maxAttempts} attempts`));
                }
            } catch(e) {
                clearTimeout(timeout);
                reject(e);
            }
        }

        attemptConsent();
    });
}

// Funkcja do ponownego wyświetlenia popup zgody
function showCookieSettings() {
    const cookiePopup = document.getElementById('cookie-popup');
    if (cookiePopup) {
        cookiePopup.classList.remove('hidden');
        cookiePopup.style.display = 'block';
    }
}

// Funkcja do obsługi zmiany zgody z accepted na rejected
function revokeCookieConsent() {
    // Usuń wszystkie cookies trackingowe używając CookieManager
    const removedCount = CookieManager.removeTrackingCookies();
    
    // Poinformuj trackery o odwołaniu zgody
    setClarityConsent(false).catch(e => {
        console.warn('⚠️ Microsoft Clarity consent revocation failed:', e.message);
    });
    if (typeof window.fbq !== 'undefined') {
        try { window.fbq('consent', 'revoke'); } catch(_) {}
    }
    if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'functionality_storage': 'denied',
            'personalization_storage': 'denied',
            'security_storage': 'denied'
        });
    }
}

// Funkcja walidacji statusu zgody Microsoft Clarity
async function validateClarityConsent() {
    try {
        if (typeof window.clarity === 'undefined') {
            console.warn('⚠️ Microsoft Clarity: Skrypt nie jest załadowany');
            return false;
        }

        const consentStatus = CookieManager.getConsentStatus();
        const shouldHaveCookies = consentStatus === 'accepted';
        const hasClarityCookies = CookieManager.hasClarityCookies();
        
        if (shouldHaveCookies === hasClarityCookies) {
            const status = shouldHaveCookies ? 'zgoda udzielona i cookies aktywne' : 'zgoda cofnięta i cookies nieaktywne';
            return true;
        }
        
        if (shouldHaveCookies && !hasClarityCookies) {
            // Cookies mogą się pojawić z opóźnieniem - czekaj chwilę
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const finalCookiesExist = CookieManager.hasClarityCookies();
            if (finalCookiesExist) {
                return true;
            } else {
                console.warn('⚠️ Microsoft Clarity: Cookies nadal nieaktywne po oczekiwaniu');
                return false;
            }
        }
        
        console.warn('⚠️ Microsoft Clarity: Niezgodność między zgodą a cookies', {
            consent: consentStatus,
            hasCookies: hasClarityCookies
        });
        return false;
        
    } catch(e) {
        console.error('❌ Microsoft Clarity: Błąd walidacji zgody:', e);
        return false;
    }
}

// Automatyczne ładowanie trackerów przy starcie strony, jeśli zgoda została już udzielona (nawet bez widocznego popupu)
(function() {
    try {
        const consent = CookieManager.getConsentStatus();
        if (consent === 'accepted') {
            loadTrackingScripts();
        }
    } catch (_) {}
})();

// Funkcja zapobiegająca polskim sierotkom
function fixPolishOrphans(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Lista polskich spójników i przyimków, które nie mogą być na końcu linii
    const orphans = ['i', 'a', 'o', 'u', 'w', 'z', 'ze', 'na', 'do', 'od', 'po', 'za', 'bez', 'pod', 'nad', 'przez', 'dla', 'lub', 'albo', 'czy', 'że', 'bo', 'ale', 'gdy', 'jak'];
    
    let result = text;
    
    // Dla każdego spójnika/przyimka zastąp spację po nim na &nbsp;
    orphans.forEach(orphan => {
        // Wzorzec: początek słowa lub spacja + spójnik + spacja + następny znak (nie biały)
        const regex = new RegExp(`(^|\\s)(${orphan})\\s+(?=\\S)`, 'gi');
        result = result.replace(regex, `$1$2&nbsp;`);
    });
    
    return result;
}

// Zamień ścieżki względne na root-relative, aby działały przy "ładnych" URL-ach
function toRootPath(path) {
    if (!path) return '/images/placeholder.webp';
    try {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
        return '/' + path.replace(/^\/+/, '');
    } catch (_) {
        return '/images/placeholder.webp';
    }
}

// Slug helper: polish diacritics → ASCII, spaces → hyphens
function slugify(input) {
    if (!input) return '';
    const map = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z',
                  'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ż':'z','Ź':'z' };
    const replaced = String(input).split('').map(ch => map[ch] || ch).join('');
    return replaced.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

function buildPrettyPath(categoryName, subcategoryName, toolId) {
    const parts = ['','narzedzia'];
    if (categoryName) parts.push(slugify(categoryName));
    if (subcategoryName) parts.push(slugify(subcategoryName));
    if (toolId) parts.push(encodeURIComponent(toolId));
    return parts.join('/');
}

function resolveCategory(toolCatalog, input) {
    if (!toolCatalog || !input) return null;
    return toolCatalog.find(c => c.category === input || slugify(c.category) === input) || null;
}

function resolveSubcategory(category, input) {
    if (!category || !input) return null;
    return (category.subcategories || []).find(s => s.name === input || slugify(s.name) === input) || null;
}

// Odczyt parametrów trasy z query lub z 'ładnej' ścieżki
function getRouteParams() {
    try {
        const params = new URLSearchParams(window.location.search);
        let category = params.get('category');
        let subcategory = params.get('subcategory');
        let toolId = params.get('toolId');

        if (!category && !subcategory && !toolId) {
            const parts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
            // Obsługa prefiksu /narzedzia w ładnych URL-ach
            const isPretty = parts[0] === 'narzedzia';
            const base = isPretty ? parts.slice(1) : parts;
            if (base.length >= 1) category = base[0];
            if (base.length >= 2) subcategory = base[1];
            if (base.length >= 3) toolId = base[2];
        }

        return { category, subcategory, toolId };
    } catch (_) {
        return { category: null, subcategory: null, toolId: null };
    }
}

// Czy możemy bezpiecznie używać ładnych ścieżek (bez query) w pasku adresu?
function canUsePrettyUrls() {
    try {
        const { protocol, hostname } = window.location;
        if (protocol === 'file:') return false;
        if (!hostname) return false;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) return false;
        return hostname === 'toolshare.com.pl' || hostname === 'www.toolshare.com.pl';
    } catch (_) {
        return false;
    }
}

async function fetchData() {
    try {
        const response = await fetch('/data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Nie udało się pobrać danych narzędzi:", error);
        return []; // Zwróć pustą tablicę w przypadku błędu
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Determine if this page needs the catalog
    const needsCatalog = !!(
        document.getElementById('why-us') ||
        document.getElementById('category-title') ||
        document.getElementById('subcategory-title') ||
        document.getElementById('tool-details-section')
    );

    const toolCatalog = needsCatalog ? await fetchData() : null;

    // Router oparty na unikalnych elementach strony
    if (document.getElementById('why-us')) {
        if (toolCatalog && toolCatalog.length) {
            renderCategories(toolCatalog);
        }
        initScrollAnimations(toolCatalog);
    } else if (document.getElementById('category-title')) {
        if (toolCatalog && toolCatalog.length) {
            renderSubcategories(toolCatalog);
        }
    } else if (document.getElementById('subcategory-title')) {
        if (toolCatalog && toolCatalog.length) {
            renderTools(toolCatalog);
        }
    } else if (document.getElementById('tool-details-section')) {
        if (toolCatalog && toolCatalog.length) {
            renderToolDetails(toolCatalog);
            initializeSeeAlso(toolCatalog);
        }
    } else if (document.getElementById('about-us-title')) {
        // Strona "O nas" nie wymaga specjalnego renderowania
    } else {
    }

    // Nawigacja i UI, które mogą działać bez katalogu
    if (toolCatalog && toolCatalog.length) {
        renderNavigationCategories(toolCatalog);
        initializeDropdown(toolCatalog);
        initializeMobileMenu(toolCatalog);
        initializeSearch(toolCatalog);
    }
    initializeThemeSwitcher();
    initializeSeoManager(toolCatalog);
    initScrollAnimations();
    initializeContactEventTracking();
    normalizeFooterCopyright();

    // Zastosuj zasady typografii po wszystkich inicjalizacjach
    setTimeout(() => {
        applyTypographyRules();
    }, 100);

    // Logika przycisku przewijania do góry z użyciem GSAP
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    let isButtonVisible = false;
    let isAnimating = false; // Flaga do blokowania animacji

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                if (!isButtonVisible && !isAnimating) {
                    isButtonVisible = true;
                    showButtonEffect();
                }
            } else {
                if (isButtonVisible && !isAnimating) {
                    isButtonVisible = false;
                    jumpOutEffect();
                }
            }
        });

        scrollToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    function showButtonEffect() {
        isAnimating = true;
        gsap.set(scrollToTopBtn, { display: 'flex', y: 50, opacity: 0, scale: 0.8, x: 0, rotation: 0 });
        gsap.to(scrollToTopBtn, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.7)',
            onComplete: () => { isAnimating = false; }
        });
    }

    function jumpOutEffect() {
        isAnimating = true;
        gsap.to(scrollToTopBtn, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
                gsap.set(scrollToTopBtn, { display: 'none' });
                isAnimating = false;
            }
        });
    }

    // Płynne przewijanie dla przycisku "Start"
    const startLink = document.getElementById('start-link');
    if (startLink) {
        startLink.addEventListener('click', (e) => {
            const isHome = !!document.getElementById('why-us');
            if (isHome) {
                // Tylko na stronie głównej nadpisujemy zachowanie dla płynnego scrollu
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Na podstronach pozwalamy przeglądarce wykonać domyślną nawigację (href="/")
                // e.preventDefault() tutaj nie jest wywoływane, by uniknąć pozostania w katalogu.
            }
        });
    }
});

// ===== Meta Pixel: Contact event tracking =====
function trackContactEvent(source) {
    try {
        const consent = CookieManager.getConsentStatus();
        if (consent !== 'accepted') return;
        if (typeof window.fbq === 'undefined') return;
        const params = source ? { content_name: source } : undefined;
        window.fbq('track', 'Contact', params);
    } catch (_) {}
}

function initializeContactEventTracking() {
    try {
        // Event delegation - single listener on document root
        document.addEventListener('click', (event) => {
            const el = event.target.closest('a[href^="tel:"], a[href^="mailto:"], a[href*="#contact"], #call-button, .phone-option');
            
            if (!el) return;
            
            // Determine event source based on element properties
            const href = el.getAttribute('href') || '';
            let source = 'contact';
            
            if (href.startsWith('tel:')) {
                source = `tel:${href.replace('tel:', '')}`;
            } else if (href.startsWith('mailto:')) {
                source = `mailto:${href.replace('mailto:', '')}`;
            } else if (href.includes('#contact')) {
                source = 'contact_section_link';
            } else if (el.id === 'call-button') {
                source = 'open_phone_modal';
            } else if (el.classList?.contains('phone-option')) {
                source = 'phone_option';
            }
            
            trackContactEvent(source);
        }, { passive: true });
        
    } catch (e) {
        console.warn('⚠️ Failed to initialize contact event tracking:', e.message);
    }
}

function applyTypographyRules() {
    // Rozszerzona lista selektorów obejmująca elementy menu
    const selectors = '.feature-card p, .tool-info-container p, .hero-section p, .mobile-menu-link, .dropdown-content a, .sub-dropdown-content a, .breadcrumb span, .category-card-title h3, .tool-card-title h3, .subcategory-card h3';
    const elements = document.querySelectorAll(selectors);
    const conjunctions = ['i', 'a', 'w', 'z', 'o', 'u', 'oraz', 'albo', 'ale', 'aby', 'gdy', 'że', 'za', 'ze', 'do', 'na', 'po', 'bo', 'aż', 'by', 'czy', 'gdyż', 'iż', 'jak', 'jeśli', 'ni', 'od', 'pod', 'to', 'bez'];

    const regex = new RegExp(`(^|\\s|>)(${conjunctions.join('|')})\\s`, 'gi');

    elements.forEach(el => {
        // Zapisujemy oryginalny HTML, aby uniknąć wielokrotnego przetwarzania tych samych spacji
        if (!el.dataset.originalHtml) {
            el.dataset.originalHtml = el.innerHTML;
        }
        el.innerHTML = el.dataset.originalHtml.replace(regex, `$1$2&nbsp;`);
    });
}

// Funkcja debounce ograniczająca częstotliwość wywołań innej funkcji
function debounce(func, wait = 100) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.addEventListener('resize', debounce(applyTypographyRules));


function initializeMobileMenu(toolCatalog) {
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.getElementById('mobile-menu-overlay');
    const container = document.getElementById('mobile-menu-container');
    
    if (!hamburger || !overlay || !container) return;

    // Buforuj elementy DOM dla lepszej wydajności
    const panels = document.querySelectorAll('.mobile-menu-panel');
    const mainMenuPanel = document.getElementById('main-menu-panel');

    // Wypełnij kategorie w menu mobilnym
    populateMobileMenuCategories(toolCatalog);

    // Przełączanie menu mobilnego
    hamburger.addEventListener('click', () => {
        const isActive = container.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Zamknij menu po kliknięciu w tło (overlay)
    overlay.addEventListener('click', closeMobileMenu);

    // Delegowanie zdarzeń dla lepszej wydajności – jeden listener na kontenerze
    container.addEventListener('click', handleContainerClick);

    // Obsługuj wszystkie kliknięcia w kontenerze za pomocą delegowania zdarzeń
    function handleContainerClick(e) {
        const backButton = e.target.closest('.mobile-menu-back');
        const submenuLink = e.target.closest('[data-submenu]');
        const categoryLink = e.target.closest('[data-category]');

        if (backButton) {
            e.preventDefault();
            const targetPanel = backButton.getAttribute('data-back') || 'main-menu';
            showMobileMenuPanel(targetPanel);
        } else if (submenuLink) {
            e.preventDefault();
            const targetPanel = submenuLink.getAttribute('data-submenu');
            if (targetPanel === 'tools-menu') {
                populateMobileMenuCategories(toolCatalog);
            }
            showMobileMenuPanel(targetPanel);
        } else if (categoryLink) {
            e.preventDefault();
            const categoryName = categoryLink.getAttribute('data-category');
            const category = toolCatalog.find(cat => cat.category === categoryName);
            if (category) {
                populateMobileMenuSubcategories(category);
                showMobileMenuPanel('category-menu');
            }
        }
    }

    function openMobileMenu() {
        requestAnimationFrame(() => {
            hamburger.classList.add('active');
            overlay.classList.add('active');
            container.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset to main menu
            showMobileMenuPanel('main-menu', false);
        });
    }

    function closeMobileMenu() {
        requestAnimationFrame(() => {
            hamburger.classList.remove('active');
            overlay.classList.remove('active');
            container.classList.remove('active');
            document.body.style.overflow = '';
            
            // Reset all panels after animation
            setTimeout(() => {
                if (!container.classList.contains('active')) {
                    resetMobileMenuPanels();
                }
            }, 300);
        });
    }

    function showMobileMenuPanel(panelId, animate = true) {
        const panels = document.querySelectorAll('.mobile-menu-panel');
        const targetPanel = document.getElementById(panelId + '-panel');
        
        if (!targetPanel) return;

        if (animate) {
            // Ukryj aktualnie aktywny panel
            panels.forEach(panel => {
                if (panel.classList.contains('active')) {
                    panel.classList.remove('active');
                    panel.classList.add('sliding-out');
                }
            });

            // Pokaż docelowy panel po krótkiej zwłoce
            setTimeout(() => {
                panels.forEach(panel => {
                    panel.classList.remove('sliding-out');
                });
                targetPanel.classList.add('active');
            }, 150);
        } else {
            // Natychmiastowe przełączenie bez animacji
            panels.forEach(panel => {
                panel.classList.remove('active', 'sliding-out');
            });
            targetPanel.classList.add('active');
        }
    }

    function resetMobileMenuPanels() {
        requestAnimationFrame(() => {
            panels.forEach(panel => {
                panel.classList.remove('active', 'sliding-out');
            });
            if (mainMenuPanel) {
                mainMenuPanel.classList.add('active');
            }
        });
    }
}

function populateMobileMenuCategories(toolCatalog) {
    const categoriesList = document.getElementById('tools-categories-list');
    if (!categoriesList) return;

    // Użyj DocumentFragment dla lepszej wydajności
    const fragment = document.createDocumentFragment();

    toolCatalog.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'mobile-menu-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'mobile-menu-link has-submenu';
        link.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));
        link.setAttribute('data-category', category.category);
        
        // Usuń pojedyncze listenery – użyj delegowania zdarzeń
        
        listItem.appendChild(link);
        fragment.appendChild(listItem);
    });
    
    // Single DOM update
    categoriesList.innerHTML = '';
    categoriesList.appendChild(fragment);
    
    // Use requestAnimationFrame for typography rules
    requestAnimationFrame(() => {
        applyTypographyRules();
    });
}

function populateMobileMenuSubcategories(category) {
    const subcategoriesList = document.getElementById('category-subcategories-list');
    const categoryTitle = document.getElementById('category-menu-title');
    
    if (!subcategoriesList || !categoryTitle) return;

    categoryTitle.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));
    subcategoriesList.innerHTML = '';

    category.subcategories.forEach(subcategory => {
        const listItem = document.createElement('li');
        listItem.className = 'mobile-menu-item';
        
        const link = document.createElement('a');
        link.href = buildPrettyPath(category.category, subcategory.name);
        link.className = 'mobile-menu-link';
        link.innerHTML = fixPolishOrphans(stripHtmlTags(subcategory.name));
        
        listItem.appendChild(link);
        subcategoriesList.appendChild(listItem);
    });
    
    // Zastosuj zasady typografii po stworzeniu podmenu
    setTimeout(() => {
        applyTypographyRules();
    }, 50);
}

function showMobileMenuPanel(panelId, animate = true) {
    const panels = document.querySelectorAll('.mobile-menu-panel');
    const targetPanel = document.getElementById(panelId + '-panel');
    
    if (!targetPanel) return;

    if (animate) {
        // Ukryj aktualnie aktywny panel
        panels.forEach(panel => {
            if (panel.classList.contains('active')) {
                panel.classList.remove('active');
                panel.classList.add('sliding-out');
            }
        });

        // Pokaż docelowy panel po krótkiej zwłoce
        setTimeout(() => {
            panels.forEach(panel => {
                panel.classList.remove('sliding-out');
            });
            targetPanel.classList.add('active');
        }, 150);
    } else {
        // Natychmiastowe przełączenie bez animacji
        panels.forEach(panel => {
            panel.classList.remove('active', 'sliding-out');
        });
        targetPanel.classList.add('active');
    }
}

function renderNavigationCategories(toolCatalog) {
    const navContainer = document.getElementById('nav-categories');
    if (!navContainer) return;

    navContainer.innerHTML = ''; // Wyczyść kontener

    toolCatalog.forEach(category => {
        const link = document.createElement('a');
        link.href = buildPrettyPath(category.category);
        link.textContent = stripHtmlTags(category.category);
        link.setAttribute('role', 'menuitem');
        navContainer.appendChild(link);
    });
}

function renderCategories(toolCatalog) {
    const contentGrid = document.getElementById('tools-grid');
    if (!contentGrid) return;

    contentGrid.innerHTML = '';

    toolCatalog.forEach(category => {
        const cardLink = document.createElement('a');
        cardLink.href = buildPrettyPath(category.category);
        cardLink.className = 'category-card'; 

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';

        const img = document.createElement('img');
        img.src = toRootPath(category.image);
        img.alt = category.category;
        img.className = 'category-card-img';
        img.loading = 'lazy';
        img.width = 300;
        img.height = 200;
        img.decoding = 'async';

        imageWrapper.appendChild(img);

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'category-card-title';
        titleWrapper.innerHTML = `<h3>${fixPolishOrphans(stripHtmlTags(category.category))}</h3>`;

        cardLink.appendChild(imageWrapper);
        cardLink.appendChild(titleWrapper);
        
        contentGrid.appendChild(cardLink);
    });
}

function createInteractiveBreadcrumb(text, linkUrl, siblings, type, parentCategoryForSiblings) {
    const wrapper = document.createElement('div');
    wrapper.className = 'breadcrumb-dropdown';

    const link = document.createElement('a');
    link.href = linkUrl;
    
    const textSpan = document.createElement('span');
    textSpan.innerHTML = fixPolishOrphans(text);
    link.appendChild(textSpan);
    
    const arrow = document.createElement('i');
    arrow.className = 'fas fa-chevron-down breadcrumb-arrow';
    link.appendChild(arrow);
    wrapper.appendChild(link);

    if (siblings && siblings.length > 0) {
        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'breadcrumb-dropdown-content';
        siblings.forEach(sibling => {
            const siblingLink = document.createElement('a');
            if (type === 'category') {
                siblingLink.href = buildPrettyPath(sibling.category);
                siblingLink.textContent = sibling.category;
            } else if (type === 'subcategory') {
                siblingLink.href = buildPrettyPath(parentCategoryForSiblings, sibling.name);
                siblingLink.textContent = sibling.name;
            }
            dropdownContent.appendChild(siblingLink);
        });
        wrapper.appendChild(dropdownContent);
    }
    
    return wrapper;
}

function createSeparator() {
    const separator = document.createElement('span');
    separator.className = 'separator';
    separator.textContent = '>';
    return separator;
}

function renderSubcategories(toolCatalog) {
    document.body.classList.add('subpage');
    const { category: categoryParam } = getRouteParams();
    const contentGrid = document.getElementById('subcategory-grid');
    const titleElement = document.getElementById('category-title');
    const breadcrumbContainer = document.querySelector('.breadcrumb');

    if (!categoryParam || !contentGrid || !titleElement || !breadcrumbContainer) return;

    const category = resolveCategory(toolCatalog, categoryParam);
    if (!category) {
        contentGrid.innerHTML = '<p>Kategoria nie została znaleziona.</p>';
        return;
    }

    titleElement.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));

    // Uładnij adres URL w pasku adresu dla SEO/UX (bez query string)
    try {
        if (canUsePrettyUrls()) {
            const prettyPath = buildPrettyPath(category.category);
            if (window.location.pathname !== prettyPath) {
                history.replaceState(null, '', prettyPath);
            }
        }
    } catch (_) {}
    
    // Renderowanie nawigacji okruszkowej (breadcrumb)
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());

    const categorySpan = document.createElement('span');
    categorySpan.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));
    breadcrumbContainer.appendChild(categorySpan);

    // Zawartość strony
    contentGrid.innerHTML = '';
    category.subcategories.forEach(sub => {
        const cardLink = document.createElement('a');
        cardLink.href = buildPrettyPath(category.category, sub.name);
        cardLink.className = 'subcategory-card'; 
        cardLink.innerHTML = `<h3>${fixPolishOrphans(stripHtmlTags(sub.name))}</h3>`;
        contentGrid.appendChild(cardLink);
    });
    
}

function renderTools(toolCatalog) {
    document.body.classList.add('subpage');
    const { category: categoryParam2, subcategory: subcategoryParam2 } = getRouteParams();

    const contentGrid = document.getElementById('tools-grid');
    const titleElement = document.getElementById('subcategory-title');
    const breadcrumbContainer = document.querySelector('.breadcrumb');

    if (!categoryParam2 || !subcategoryParam2 || !contentGrid || !titleElement || !breadcrumbContainer) return;

    const category = resolveCategory(toolCatalog, categoryParam2);
    const subcategory = category ? resolveSubcategory(category, subcategoryParam2) : null;

    if (!subcategory) {
        contentGrid.innerHTML = '<p>Podkategoria nie została znaleziona.</p>';
        return;
    }

    titleElement.innerHTML = fixPolishOrphans(stripHtmlTags(subcategory.name));

    // Uładnij adres URL w pasku adresu (kategoria/podkategoria)
    try {
        if (canUsePrettyUrls()) {
            const prettyPath = buildPrettyPath(category.category, subcategory.name);
            if (window.location.pathname !== prettyPath) {
                history.replaceState(null, '', prettyPath);
            }
        }
    } catch (_) {}

    // Renderowanie nawigacji okruszkowej (breadcrumb)
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());
    
    const categorySiblings = toolCatalog.filter(c => c.category !== category.category);
    const categoryCrumb = createInteractiveBreadcrumb(stripHtmlTags(category.category), buildPrettyPath(category.category), categorySiblings, 'category');
    breadcrumbContainer.appendChild(categoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());

    const subcategorySpan = document.createElement('span');
    subcategorySpan.innerHTML = fixPolishOrphans(stripHtmlTags(subcategory.name));
    breadcrumbContainer.appendChild(subcategorySpan);

    // Zawartość strony
    contentGrid.innerHTML = '';
    const enabledTools = subcategory.tools.filter(tool => tool.enabled !== false);

    if (enabledTools.length === 0) {
        contentGrid.innerHTML = '<p>Brak narzędzi w tej podkategorii.</p>';
        return;
    }

    enabledTools.forEach(tool => {
        const toolCard = document.createElement('a');
        toolCard.className = 'tool-card';
        toolCard.href = buildPrettyPath(category.category, subcategory.name, tool.id);

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';

        const img = document.createElement('img');
        img.src = toRootPath(tool.image);
        img.alt = tool.name;
        img.className = 'tool-card-img';
        img.loading = 'lazy';
        img.width = 300;
        img.height = 200;
        img.decoding = 'async';

        imageWrapper.appendChild(img);

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'tool-card-title';
        titleWrapper.innerHTML = `<h3>${fixPolishOrphans(tool.name)}</h3>`;

        toolCard.appendChild(imageWrapper);
        toolCard.appendChild(titleWrapper);
        contentGrid.appendChild(toolCard);
    });
    
}

function renderToolDetails(toolCatalog) {
    document.body.classList.add('subpage');
    const { toolId } = getRouteParams();

    if (!toolId) return;

    let tool, category, subcategory;
    // Znajdź narzędzie, jego kategorię i podkategorię
    for (const cat of toolCatalog) {
        for (const sub of cat.subcategories) {
            // Filter out disabled tools before searching
            const foundTool = sub.tools.filter(t => t.enabled !== false).find(t => t.id === toolId);
            if (foundTool) {
                tool = foundTool;
                category = cat;
                subcategory = sub;
                break;
            }
        }
        if (tool) break;
    }

    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (!tool || !breadcrumbContainer) {
        const content = document.getElementById('tool-details-content');
        if (content) content.innerHTML = '<p>Narzędzie nie zostało znalezione.</p>';
        return;
    }

    // Uładnij adres URL w pasku adresu (kategoria/podkategoria/narzędzie)
    try {
        if (canUsePrettyUrls()) {
            const prettyPath = buildPrettyPath(category.category, subcategory.name, tool.id);
            if (window.location.pathname !== prettyPath) {
                history.replaceState(null, '', prettyPath);
            }
        }
    } catch (_) {}

    // Renderowanie nawigacji okruszkowej (breadcrumb)
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());

    const categorySiblings = toolCatalog.filter(c => c.category !== category.category);
    const categoryCrumb = createInteractiveBreadcrumb(stripHtmlTags(category.category), buildPrettyPath(category.category), categorySiblings, 'category');
    breadcrumbContainer.appendChild(categoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());
    
    const subcategorySiblings = category.subcategories.filter(s => s.name !== subcategory.name);
    const subcategoryCrumb = createInteractiveBreadcrumb(stripHtmlTags(subcategory.name), buildPrettyPath(category.category, subcategory.name), subcategorySiblings, 'subcategory', category.category);
    breadcrumbContainer.appendChild(subcategoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());

    const toolSpan = document.createElement('span');
    toolSpan.innerHTML = fixPolishOrphans(tool.name);
    breadcrumbContainer.appendChild(toolSpan);

    // Uzupełnij dane na stronie
    document.title = `${tool.name} - ToolShare`;
    document.getElementById('tool-name').textContent = tool.name;

    const descriptionElement = document.getElementById('tool-description');
    if (descriptionElement) {
        descriptionElement.textContent = tool.description;
    }

    const imageElement = document.getElementById('tool-image');
    imageElement.src = toRootPath(tool.image);
    imageElement.alt = tool.name;
    imageElement.width = 800;
    imageElement.height = 600;
    imageElement.loading = 'eager';
    imageElement.decoding = 'async';

    // Uzupełnij tabelę z cennikiem
    const pricingTableBody = document.querySelector('#pricing-table tbody');
    pricingTableBody.innerHTML = '';
    for (const [period, price] of Object.entries(tool.pricing)) {
        if (period.toLowerCase().includes('kaucja')) {
            continue; // Pomijamy wpisy z kluczem zawierającym "kaucja"
        }
        const row = document.createElement('tr');
        const periodCell = document.createElement('td');
        const priceCell = document.createElement('td');
        
        periodCell.textContent = period;
        
        // Poprawka do obsługi placeholderów
        if (typeof price === 'number') {
            priceCell.textContent = period.toLowerCase().includes('kaucja') ? `${price} zł` : `${price} zł / dzień`;
        } else {
            priceCell.textContent = price;
        }
        
        row.appendChild(periodCell);
        row.appendChild(priceCell);
        pricingTableBody.appendChild(row);
    }

    // Centralized Deposit row logic
    const depositKey = Object.keys(tool.pricing).find(p => p.toLowerCase().includes('kaucja'));
    const depositFromPricing = depositKey ? tool.pricing[depositKey] : undefined;

    if (tool.deposit !== undefined || depositFromPricing !== undefined) {
        const depositValue = tool.deposit !== undefined ? tool.deposit : depositFromPricing;

        const depositRow = document.createElement('tr');
        const depositLabelCell = document.createElement('td'); // Zmiana z 'th' na 'td'
        depositLabelCell.innerHTML = 'Kaucja <sup>**</sup>';
        const depositValueCell = document.createElement('td');
        
        if (typeof depositValue === 'number') {
            depositValueCell.textContent = `${depositValue} zł`;
        } else {
            depositValueCell.textContent = depositValue;
        }
        
        depositRow.appendChild(depositLabelCell);
        depositRow.appendChild(depositValueCell);
        pricingTableBody.appendChild(depositRow);
    }
}

function initializeDropdown(toolCatalog) {
    const navCategories = document.getElementById('nav-categories');
    if (!navCategories) return;

    navCategories.innerHTML = ''; 

    toolCatalog.forEach(category => {
        // Kontener dla kategorii i jej podmenu
        const subDropdownContainer = document.createElement('div');
        subDropdownContainer.className = 'sub-dropdown';

        // Link główny kategorii
        const categoryLink = document.createElement('a');
        categoryLink.href = buildPrettyPath(category.category);
        categoryLink.innerHTML = `
            ${fixPolishOrphans(stripHtmlTags(category.category))}
            <i class="fas fa-chevron-right" style="font-size: 0.8em;"></i>
        `;
        
        subDropdownContainer.appendChild(categoryLink);

        // Rozwijane menu z podkategoriami
        const subDropdownContent = document.createElement('div');
        subDropdownContent.className = 'sub-dropdown-content';
        
        category.subcategories.forEach(subcategory => {
            const subcategoryLink = document.createElement('a');
            subcategoryLink.href = buildPrettyPath(category.category, subcategory.name);
            subcategoryLink.innerHTML = fixPolishOrphans(stripHtmlTags(subcategory.name));
            subDropdownContent.appendChild(subcategoryLink);
        });

        if (category.subcategories.length > 0) {
            subDropdownContainer.appendChild(subDropdownContent);
        }

        navCategories.appendChild(subDropdownContainer);
    });
    
    // Zastosuj zasady typografii po stworzeniu dropdown menu
    setTimeout(() => {
        applyTypographyRules();
        // Limituj widoczne elementy submenu do 12 i dodaj scroll
        setupSubmenuScrollLimit(12);
    }, 50);
}

// ===== Footer copyright normalize (remove hardcoded year) =====
function normalizeFooterCopyright() {
    try {
        const nodes = document.querySelectorAll('.footer .footer-info p');
        nodes.forEach(p => {
            const txt = (p.textContent || '').trim();
            if (txt.includes('ToolShare - wypożyczalnia narzędzi')) {
                p.innerHTML = '&copy; ToolShare - wypożyczalnia narzędzi';
            }
        });
    } catch (_) {}
}


// Usunięto pustą funkcję zgodności initializeHamburger – logikę obsługuje initializeMobileMenu

function initializeThemeSwitcher() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        let newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function initializeSeoManager(toolCatalog) {
    try {
        const setMetaRobots = (value) => {
            upsertMetaByName('robots', value);
        };
        const url = new URL(window.location.href);
        const isCategoryPage = !!document.getElementById('category-title');
        const isSubcategoryPage = !!document.getElementById('subcategory-title');
        const isToolPage = !!document.getElementById('tool-details-section');
        const isHomePage = !!document.getElementById('why-us');
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        const canonicalHref = canonicalEl?.getAttribute('href') || '';
        const normalizedPath = window.location.pathname
            .replace(/index\.html$/, '')
            .replace(/\/$/, '') || '/';
        const canonicalLooksPretty = canonicalHref && !canonicalHref.endsWith('.html');
        const canonicalMatchesPath = canonicalLooksPretty && canonicalHref.includes(normalizedPath);
        const hydrationRequired = !canonicalMatchesPath;

        if (isHomePage && hydrationRequired) {
            ensureOgTwitterDefaults('https://toolshare.com.pl/images/logo.webp');
            updateCanonical('https://toolshare.com.pl/');
            upsertMetaByProperty('og:type', 'website');
            setMetaRobots('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }

        if (!toolCatalog || !toolCatalog.length) {
            return;
        }

        if (isCategoryPage && hydrationRequired) {
            // Domyślnie nie indeksuj dopóki parametry niepoprawne
            setMetaRobots('noindex, follow');
            let categoryName = new URLSearchParams(url.search).get('category');
            if (!categoryName) {
                const parts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
                if (parts[0] === 'narzedzia') categoryName = parts[1]; else categoryName = parts[0];
            }
            const category = resolveCategory(toolCatalog, categoryName);
            if (!category) return;

            const pageUrl = `https://toolshare.com.pl/${buildPrettyPath(category.category)}`;
            const description = `${stripHtmlTags(category.category)} do wypożyczenia w gminie Czernica (Chrząstawa Wielka). Atrakcyjne ceny i elastyczne godziny odbioru.`;
            const dynamicTitle = `${stripHtmlTags(category.category)} – wypożyczalnia narzędzi Chrząstawa Wielka | ToolShare`;

            // Tytuł i meta tagi
            if (document.title) {
                document.title = dynamicTitle;
            }
            upsertMetaByName('description', description);
            ensureOgTwitterDefaults('https://toolshare.com.pl/images/logo.webp');
            upsertMetaByProperty('og:type', 'website');
            upsertMetaByProperty('og:title', dynamicTitle);
            upsertMetaByProperty('og:description', description);
            upsertMetaByProperty('og:url', pageUrl);
            upsertMetaByName('twitter:title', dynamicTitle);
            upsertMetaByName('twitter:description', description);
            upsertMetaByName('twitter:image', 'https://toolshare.com.pl/images/logo.webp');
            updateCanonical(pageUrl);
            setMetaRobots('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

            const breadcrumbItems = [
                { name: 'Strona główna', url: 'https://toolshare.com.pl/' },
                { name: stripHtmlTags(category.category), url: pageUrl }
            ];
            if (!hasJsonLdType('BreadcrumbList')) {
                injectJsonLd(buildBreadcrumbList(breadcrumbItems));
            }

            const itemList = buildItemList(
                category.subcategories.map(sub => ({
                    name: stripHtmlTags(sub.name),
                    url: `https://toolshare.com.pl/${buildPrettyPath(category.category, sub.name)}`
                })),
                pageUrl
            );
            injectJsonLd(itemList);
        }

        if (isSubcategoryPage && hydrationRequired) {
            // Domyślnie nie indeksuj dopóki parametry niepoprawne
            setMetaRobots('noindex, follow');
            let categoryName, subcategoryName;
            {
                const params = new URLSearchParams(url.search);
                categoryName = params.get('category');
                subcategoryName = params.get('subcategory');
                if (!categoryName || !subcategoryName) {
                    const parts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
                    if (parts[0] === 'narzedzia') {
                        if (!categoryName && parts.length >= 2) categoryName = parts[1];
                        if (!subcategoryName && parts.length >= 3) subcategoryName = parts[2];
                    } else {
                        if (!categoryName && parts.length >= 1) categoryName = parts[0];
                        if (!subcategoryName && parts.length >= 2) subcategoryName = parts[1];
                    }
                }
            }
            const category = resolveCategory(toolCatalog, categoryName);
            const subcategory = category ? resolveSubcategory(category, subcategoryName) : null;
            if (!subcategory) return;

            const pageUrl = `https://toolshare.com.pl/${buildPrettyPath(category.category, subcategory.name)}`;
            const description = `${stripHtmlTags(subcategory.name)} do wypożyczenia – gmina Czernica. Odbiór w Chrząstawie Wielkiej, szybki kontakt, szybka obsługa.`;
            const dynamicTitle = `${stripHtmlTags(subcategory.name)} – wypożyczalnia narzędzi Chrząstawa Wielka | ToolShare`;

            // Tytuł i meta tagi
            if (document.title) {
                document.title = dynamicTitle;
            }
            upsertMetaByName('description', description);
            ensureOgTwitterDefaults('https://toolshare.com.pl/images/logo.webp');
            upsertMetaByProperty('og:type', 'website');
            upsertMetaByProperty('og:title', dynamicTitle);
            upsertMetaByProperty('og:description', description);
            upsertMetaByProperty('og:url', pageUrl);
            upsertMetaByName('twitter:title', dynamicTitle);
            upsertMetaByName('twitter:description', description);
            upsertMetaByName('twitter:image', 'https://toolshare.com.pl/images/logo.webp');
            updateCanonical(pageUrl);
            setMetaRobots('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

            const breadcrumbItems = [
                { name: 'Strona główna', url: 'https://toolshare.com.pl/' },
                { name: stripHtmlTags(category.category), url: `https://toolshare.com.pl/${buildPrettyPath(category.category)}` },
                { name: stripHtmlTags(subcategory.name), url: pageUrl }
            ];
            injectJsonLd(buildBreadcrumbList(breadcrumbItems));

            const enabledTools = (subcategory.tools || []).filter(t => t.enabled !== false);
            const itemList = buildItemList(
                enabledTools.map(t => ({
                    name: stripHtmlTags(t.name),
                    url: `https://toolshare.com.pl/${buildPrettyPath(category.category, subcategory.name, t.id)}`
                })),
                pageUrl
            );
            if (!hasJsonLdType('ItemList')) {
                injectJsonLd(itemList);
            }
        }

        if (isToolPage && hydrationRequired) {
            // Domyślnie nie indeksuj dopóki parametry niepoprawne
            setMetaRobots('noindex, follow');
            let toolId = new URLSearchParams(url.search).get('toolId');
            if (!toolId) {
                const parts = decodeURIComponent(window.location.pathname).split('/').filter(Boolean);
                if (parts.length >= 3) toolId = parts[2];
            }
            const toolCtx = findToolById(toolId, toolCatalog);
            const tool = toolCtx?.tool;
            const category = toolCtx?.category;
            const subcategory = toolCtx?.subcategory;
            if (!tool) return;

            const pageUrl = `https://toolshare.com.pl/${buildPrettyPath(category.category, subcategory.name, tool.id)}`;
            const firstPrice = getFirstNumericPrice(tool?.pricing);
            const schemaPrice = formatPriceForSchema(firstPrice);
            const descriptionBase = `${stripHtmlTags(tool.name)} do wypożyczenia. ${stripHtmlTags(category.category)} › ${stripHtmlTags(subcategory.name)}. Odbiór w Chrząstawie Wielkiej, elastyczne godziny.`;
            const description = firstPrice ? `${descriptionBase} Ceny od ${firstPrice} zł/dzień.` : descriptionBase;

            upsertMetaByName('description', description);
            ensureOgTwitterDefaults(absoluteUrl(tool.image));
            upsertMetaByProperty('og:type', 'product');
            upsertMetaByProperty('og:title', document.title || 'Narzędzie – ToolShare');
            upsertMetaByProperty('og:description', description);
            upsertMetaByProperty('og:url', pageUrl);
            upsertMetaByName('twitter:title', document.title || 'Narzędzie – ToolShare');
            upsertMetaByName('twitter:description', description);
            upsertMetaByName('twitter:image', absoluteUrl(tool.image));
            updateCanonical(pageUrl);

            // Product JSON-LD
            try {
                const offer = {
                    '@type': 'Offer',
                    priceCurrency: 'PLN',
                    availability: 'https://schema.org/InStock',
                    url: pageUrl
                };
                if (schemaPrice !== null) {
                    offer.price = schemaPrice;
                }

                const product = {
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: stripHtmlTags(tool.name),
                    image: [absoluteUrl(tool.image)],
                    category: `${stripHtmlTags(category.category)} > ${stripHtmlTags(subcategory.name)}`,
                    url: pageUrl,
                    offers: offer
                };
                if (!hasJsonLdType('Product')) {
                    injectJsonLd(product);
                }
            } catch (_) {}

            setMetaRobots('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

            const breadcrumbItems = [
                { name: 'Strona główna', url: 'https://toolshare.com.pl/' },
                { name: stripHtmlTags(category.category), url: `https://toolshare.com.pl/${buildPrettyPath(category.category)}` },
                { name: stripHtmlTags(subcategory.name), url: `https://toolshare.com.pl/${buildPrettyPath(category.category, subcategory.name)}` },
                { name: stripHtmlTags(tool.name), url: pageUrl }
            ];
            if (!hasJsonLdType('BreadcrumbList')) {
                injectJsonLd(buildBreadcrumbList(breadcrumbItems));
            }
        }

        if (!hydrationRequired && canonicalEl && canonicalLooksPretty && !canonicalHref.endsWith('/')) {
            canonicalEl.setAttribute('href', `${canonicalHref}/`);
        }
    } catch (_) {}
}

function upsertMetaRobots() {
    upsertMetaByName('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
}

function ensureOgTwitterDefaults(defaultImageUrl) {
    upsertMetaByProperty('og:site_name', 'ToolShare');
    upsertMetaByProperty('og:image', defaultImageUrl);
    upsertMetaByProperty('og:image:width', '1200');
    upsertMetaByProperty('og:image:height', '630');
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:image', defaultImageUrl);
}

function upsertMetaByName(name, content) {
    if (!name || !content) return;
    let el = document.head.querySelector(`meta[name="${CSS.escape(name)}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertMetaByProperty(property, content) {
    if (!property || !content) return;
    let el = document.head.querySelector(`meta[property="${CSS.escape(property)}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function normalizeCanonicalUrl(url) {
    try {
        const canonical = new URL(url, window.location.origin);
        const path = canonical.pathname || '';
        const hasExtension = /\.[a-z0-9]{2,5}$/i.test(path);
        if (path && !path.endsWith('/') && !hasExtension) {
            canonical.pathname = `${path}/`;
        }
        return canonical.toString();
    } catch (_) {
        return url;
    }
}

function updateCanonical(url) {
    if (!url) return;
    const normalized = normalizeCanonicalUrl(url);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    link.setAttribute('href', normalized);
}

function buildBreadcrumbList(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'name': item.name,
            'item': item.url
        }))
    };
}

function buildItemList(entries, pageUrl) {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'url': pageUrl,
        'itemListElement': entries.map((entry, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'url': entry.url,
            'name': entry.name
        }))
    };
}

function injectJsonLd(object) {
    if (!object) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(object);
    document.head.appendChild(script);
}

// Check if JSON-LD of given @type already exists in the document
function hasJsonLdType(type) {
    try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
            try {
                const data = JSON.parse(s.textContent || '{}');
                const t = data['@type'] || (data['@graph'] && data['@graph'][0] && data['@graph'][0]['@type']);
                if (!t) continue;
                if (Array.isArray(t)) {
                    if (t.includes(type)) return true;
                } else if (typeof t === 'string' && t.toLowerCase() === type.toLowerCase()) {
                    return true;
                }
            } catch (_) { /* ignore parse errors */ }
        }
    } catch (_) {}
    return false;
}

function absoluteUrl(path) {
    if (!path) return 'https://toolshare.com.pl/images/logo.webp';
    try {
        const u = new URL(path, 'https://toolshare.com.pl/');
        return u.toString();
    } catch (_) {
        return 'https://toolshare.com.pl/images/logo.webp';
    }
}

function getFirstNumericPrice(pricing) {
    if (!pricing || typeof pricing !== 'object') return null;
    const val = Object.values(pricing).find(p => typeof p === 'number');
    return typeof val === 'number' ? val : null;
}

function formatPriceForSchema(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getFirstPriceText(pricing) {
    if (!pricing || typeof pricing !== 'object') return null;
    for (const [label, value] of Object.entries(pricing)) {
        if (typeof value === 'string' && !label.toLowerCase().includes('kaucja')) {
            const trimmed = value.trim();
            if (trimmed) return trimmed;
        }
    }
    return null;
}

let gsapLoaderPromise = null;
function loadGsapLibrary() {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.gsap) return Promise.resolve(window.gsap);
    if (gsapLoaderPromise) return gsapLoaderPromise;

    const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    gsapLoaderPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.onload = () => resolve(window.gsap || null);
        script.onerror = () => reject(new Error('GSAP failed to load'));
        document.head.appendChild(script);
    }).catch(() => null);

    return gsapLoaderPromise;
}

function initScrollAnimations() {
    loadGsapLibrary().then(gsapInstance => {
        const gsapRef = gsapInstance || window.gsap;
        if (!gsapRef) {
            return;
        }

        const allCards = document.querySelectorAll('.feature-card, .category-card, .subcategory-card, .tool-card');
        const contactItems = document.querySelectorAll('.contact-details, .contact-map');
        const heroSection = document.querySelector('.hero-section');

        allCards.forEach(card => {
            card.classList.add('stagger-item');
            gsapRef.set(card, { opacity: 0, y: 20 });
        });

        contactItems.forEach(item => {
            item.classList.add('stagger-item');
            gsapRef.set(item, { opacity: 0, y: 30 });
        });

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries, observerRef) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const target = entry.target;
                const items = target.querySelectorAll('.stagger-item');
                if (items.length > 0) {
                    gsapRef.to(items, {
                        opacity: 1,
                        y: 0,
                        duration: 1.2,
                        ease: 'power2.out',
                        stagger: target.id === 'contact' ? 0.3 : 0
                    });
                    items.forEach(item => item.classList.add('animate'));
                }

                observerRef.unobserve(target);
            });
        }, observerOptions);

        document
            .querySelectorAll('.features-grid, #tools-grid, #subcategory-grid, #contact')
            .forEach(grid => grid && observer.observe(grid));

        if (heroSection) {
            const heroElements = [
                heroSection.querySelector('h1'),
                heroSection.querySelector('p'),
                heroSection.querySelector('.btn')
            ].filter(Boolean);

            gsapRef.fromTo(heroElements, {
                opacity: 0
            }, {
                opacity: 1,
                color: 'white',
                duration: 1.5,
                delay: 0.3,
                ease: 'power2.out'
            });
        }
    });
}


// Zastosuj poprawki do wszystkich tytułów po załadowaniu treści
function applyPolishTypography() {
    const titles = document.querySelectorAll('.category-card-title h3, .tool-card-title h3, .dropdown-content a, .breadcrumb span:last-of-type, .mobile-menu-link, .mobile-menu-title');
    
    titles.forEach(title => {
        if (title.textContent) {
            title.innerHTML = fixPolishOrphans(title.textContent);
        }
    });
}

// Dodaj obsługę sierotek do istniejącego kodu inicjalizacyjnego
// Będzie wywoływane po renderowaniu kart kategorii
function addPolishTypographyToCards() {
    // Opóźnienie dla pewności, że wszystkie elementy są już renderowane
    setTimeout(applyPolishTypography, 100);
} 

// Dodaj funkcję pomocniczą do usuwania tagów HTML z nazw kategorii
function stripHtmlTags(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || div.innerText || '';
}

function initializeSearch(toolCatalog) {
    const searchToggle = document.getElementById('search-toggle');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    const searchClose = document.getElementById('search-close');
    const searchResults = document.getElementById('search-results');
    
    if (!searchToggle || !searchContainer || !searchInput || !searchClose || !searchResults) {
        return;
    }
    
    let isSearchOpen = false;
    let selectedIndex = -1;
    let searchResultItems = [];
    
    // Funkcje do zarządzania historią wyszukiwań
    function getSearchHistory() {
        try {
            const history = localStorage.getItem('toolshare_search_history');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }
    
    function saveToSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        try {
            let history = getSearchHistory();
            
            // Usuń jeśli już istnieje
            history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
            
            // Dodaj na początek
            history.unshift(query);
            
            // Ogranicz do 5 ostatnich
            history = history.slice(0, 5);
            
            localStorage.setItem('toolshare_search_history', JSON.stringify(history));
        } catch (e) {
            console.error('Error saving search history:', e);
        }
    }
    
    function clearSearchHistory() {
        try {
            localStorage.removeItem('toolshare_search_history');
            showSearchHistory(); // Odśwież widok historii
        } catch (e) {
            console.error('Error clearing search history:', e);
        }
    }
    
    function showSearchHistory() {
        const history = getSearchHistory();
        if (history.length === 0) {
            searchResults.classList.remove('active');
            return;
        }
        
        searchResults.innerHTML = `
            <div class="search-history-header">Ostatnio oglądane narzędzia</div>
            ${history.map(query => `
                <div class="search-history-item" data-query="${escapeHtml(query)}">
                    <i class="fas fa-tools search-history-icon"></i>
                    <span class="search-history-text">${escapeHtml(query)}</span>
                </div>
            `).join('')}
            <div class="search-history-footer">
                <button class="clear-history-btn">Wyczyść historię</button>
            </div>
        `;
        
        searchResults.classList.add('active');
        
        // Dodaj event listenery do elementów historii
        const historyItems = searchResults.querySelectorAll('.search-history-item');
        historyItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                const toolName = item.getAttribute('data-query');
                searchInput.value = toolName;
                performSearch(toolName, toolCatalog);
            });
            
            item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateHistorySelection();
            });
        });
        
        // Dodaj event listener dla przycisku czyszczenia historii
        const clearBtn = searchResults.querySelector('.clear-history-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Zapobiegnij zamknięciu wyszukiwania
                clearSearchHistory();
            });
        }
        
        searchResultItems = historyItems;
        selectedIndex = -1;
    }
    
    function updateHistorySelection() {
        const historyItems = searchResults.querySelectorAll('.search-history-item');
        historyItems.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Animacja otwierania wyszukiwania
    searchToggle.addEventListener('click', () => {
        if (!isSearchOpen) {
            openSearch();
        }
    });
    
    // Zamykanie wyszukiwania
    searchClose.addEventListener('click', () => {
        closeSearch();
    });
    
    // Zamykanie przy kliknięciu Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isSearchOpen) {
            closeSearch();
        }
        
        // Nawigacja strzałkami w wynikach
        if (isSearchOpen && searchResultItems.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, searchResultItems.length - 1);
                updateSelection();
                updateHistorySelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
                updateHistorySelection();
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                searchResultItems[selectedIndex].click();
            }
        }
    });
    
    // Pokaż historię przy kliknięciu w input
    searchInput.addEventListener('click', () => {
        if (!searchInput.value.trim()) {
            showSearchHistory();
        }
    });
    
    // Wyszukiwanie w czasie rzeczywistym
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            showSearchHistory();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query, toolCatalog);
        }, 150);
    });
    
    function openSearch() {
        isSearchOpen = true;
        
        // Pokaż pasek wyszukiwania z CSS transition
        searchContainer.classList.remove('hidden');
        searchContainer.classList.add('active');
        
        // Focus po zakończeniu animacji CSS
        setTimeout(() => {
            searchInput.focus();
        }, 300); // 300ms to match CSS transition
    }
    
    function closeSearch() {
        isSearchOpen = false;
        selectedIndex = -1;
        searchInput.value = '';
        searchResults.classList.remove('active');
        searchResults.innerHTML = '';
        
        // Zamknij pasek z CSS transition
        searchContainer.classList.remove('active');
        
        // Ukryj po zakończeniu animacji CSS
        setTimeout(() => {
            searchContainer.classList.add('hidden');
        }, 300); // 300ms to match CSS transition
    }
    
    function performSearch(query, toolCatalog) {
        if (!query || query.length < 2) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            searchResultItems = [];
            selectedIndex = -1;
            return;
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Przeszukaj wszystkie narzędzia
        toolCatalog.forEach(category => {
            category.subcategories.forEach(subcategory => {
                subcategory.tools
                    .filter(tool => tool.enabled !== false)
                    .forEach(tool => {
                        const nameMatch = tool.name.toLowerCase().includes(queryLower);
                        const descMatch = tool.description && tool.description.toLowerCase().includes(queryLower);
                        const categoryMatch = category.category.toLowerCase().includes(queryLower);
                        const subcategoryMatch = subcategory.name.toLowerCase().includes(queryLower);
                        
                        if (nameMatch || descMatch || categoryMatch || subcategoryMatch) {
                            results.push({
                                tool,
                                category: category.category,
                                subcategory: subcategory.name,
                                matchType: nameMatch ? 'name' : descMatch ? 'description' : 'category'
                            });
                        }
                    });
            });
        });
        
        displaySearchResults(results, query);
    }
    
    function displaySearchResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">Nie znaleziono narzędzi dla tej frazy</div>';
            searchResults.classList.add('active');
            searchResultItems = [];
            selectedIndex = -1;
            return;
        }
        
        // Sortuj wyniki - najpierw dopasowania w nazwie, potem w opisie, na końcu w kategoriach
        results.sort((a, b) => {
            const order = { 'name': 0, 'description': 1, 'category': 2 };
            return order[a.matchType] - order[b.matchType];
        });
        
        searchResults.innerHTML = results.map(result => {
            const highlightedName = highlightText(result.tool.name, query);
            return `
                <div class="search-result-item" data-tool-id="${result.tool.id}">
                    <img src="${result.tool.image}" alt="${result.tool.name}" class="search-result-image" loading="lazy" width="80" height="80" decoding="async">
                    <div class="search-result-info">
                        <div class="search-result-title">${highlightedName}</div>
                        <div class="search-result-category">${stripHtmlTags(result.category)} › ${stripHtmlTags(result.subcategory)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        searchResults.classList.add('active');
        
        // Dodaj event listenery do wyników
        searchResultItems = searchResults.querySelectorAll('.search-result-item');
        searchResultItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                const toolId = item.getAttribute('data-tool-id');
                
                // Znajdź nazwę narzędzia i zapisz do historii
                const toolResult = results.find(r => r.tool.id === toolId);
                if (toolResult) {
                    saveToSearchHistory(toolResult.tool.name);
                }
                
                window.location.href = `/tool.html?toolId=${toolId}`;
            });
            
            item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                updateSelection();
            });
        });
        
        selectedIndex = -1;
    }
    
    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function updateSelection() {
        searchResultItems.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('highlighted');
            } else {
                item.classList.remove('highlighted');
            }
        });
    }
}

// Cookie Popup
document.addEventListener('DOMContentLoaded', function() {
    const cookiePopup = document.getElementById('cookie-popup');
    if (!cookiePopup) return; // Sprawdź czy element istnieje
    
    const acceptBtn = document.getElementById('accept-cookies');
    const rejectBtn = document.getElementById('reject-cookies');

    // TESTOWANIE: Usuń tę linię w produkcji
    // localStorage.removeItem('cookieConsent');

    // Używamy globalnych helperów trackingowych: loadTrackingScripts()

    // Tryb domyślny: nic nie ładujemy przed zgodą

    // Sprawdź czy użytkownik już podjął decyzję
    const consent = CookieManager.getConsentStatus();
    if (consent) {
        cookiePopup.classList.add('hidden');
        
        // Jeśli zaakceptowano wcześniej – doładuj trackery teraz
        if (consent === 'accepted') {
            loadTrackingScripts();
        } else {
        }
    } else {
        // Upewnij się, że popup jest widoczny
        cookiePopup.style.display = 'block';
        cookiePopup.classList.remove('hidden');
    }

    // Funkcja zamykania popup
    function hidePopup() {
        cookiePopup.classList.add('hidden');
        setTimeout(() => {
            cookiePopup.style.display = 'none';
        }, 300);
    }

    // Akceptacja cookies
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            CookieManager.setConsentStatus('accepted');
            hidePopup();
            
            // Załaduj i włącz trackery po akceptacji
            loadTrackingScripts();
        });
    }

    // Odrzucenie cookies
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            CookieManager.setConsentStatus('rejected');
            hidePopup();
            
            // Poinformuj Microsoft Clarity o odrzuceniu zgody
            setClarityConsent(false).catch(e => {
                console.warn('⚠️ Microsoft Clarity consent denial failed:', e.message);
            });
            
            // Nic nie ładujemy – pozostaje wyłączone
        });
    }
    
    // Obsługa linku "Ustawienia cookies" w stopce
    const cookieSettingsLink = document.getElementById('cookie-settings-link');
    if (cookieSettingsLink) {
        cookieSettingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const currentConsent = CookieManager.getConsentStatus();
            if (currentConsent === 'accepted') {
                // Jeśli aktualnie zaakceptowane, cofnij zgodę przed pokazaniem popup
                revokeCookieConsent();
                CookieManager.setConsentStatus('rejected');
            }
            
            showCookieSettings();
        });
    }
});

// ========== ZOBACZ RÓWNIEŻ FUNCTIONALITY ==========

// Stałe dla karuzeli „Zobacz również”
const SEE_ALSO_CONFIG = {
    MAX_TOOLS: 10,
    CARD_WIDTH: 225,
    CARD_GAP: 20,
    LOADING_DELAY: 200,
    SCROLL_TOLERANCE: 5,
    SWIPE_THRESHOLD: 10,
    SNAP_TIMEOUT: 100,
    ANIMATION_DURATION: 400
};

// Pomocnicze: odczytaj rzeczywistą wartość odstępu (gap) z obliczonych styli (z fallbackiem)
function getCarouselGapPx(track) {
    try {
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap || style.columnGap || style.rowGap || '');
        return Number.isFinite(gap) ? gap : SEE_ALSO_CONFIG.CARD_GAP;
    } catch (_) {
        return SEE_ALSO_CONFIG.CARD_GAP;
    }
}

function initializeSeeAlso(toolCatalog) {
    const seeAlsoSection = document.getElementById('zobacz-takze-section');
    const track = document.getElementById('zobacz-takze-track');
    if (!seeAlsoSection || !track) return;

    const hasStaticCards = !!track.querySelector('.zobacz-takze-card');
    if (hasStaticCards) {
        setupCarouselNavigation();
        setTimeout(() => applyTypographyRules(), 60);
        return;
    }

    const { toolId: currentToolId } = getRouteParams();
    
    if (!currentToolId) return;

    try {
        // Find current tool and its context
        const currentToolData = findToolById(currentToolId, toolCatalog);
        if (!currentToolData) {
            console.warn('Current tool not found:', currentToolId);
            seeAlsoSection.style.display = 'none';
            return;
        }

        // Wygeneruj powiązane narzędzia
        const relatedTools = generateRelatedTools(currentToolId, currentToolData, toolCatalog);
        
        if (relatedTools.length === 0) {
            console.info('No related tools found for:', currentToolId);
            seeAlsoSection.style.display = 'none';
            return;
        }

        // Renderuj karuzelę
        renderSeeAlsoCards(relatedTools);

        // Skonfiguruj nawigację
        setupCarouselNavigation();
        
        // Zastosuj poprawki typograficzne
        setTimeout(() => {
            applyTypographyRules();
        }, 100);
        
    } catch (error) {
        console.error('Error initializing Zobacz również section:', error);
        seeAlsoSection.style.display = 'none';
    }
}

function findToolById(toolId, toolCatalog) {
    for (const category of toolCatalog) {
        for (const subcategory of category.subcategories) {
            const tool = subcategory.tools.find(t => t.id === toolId && t.enabled !== false);
            if (tool) {
                return {
                    tool,
                    category,
                    subcategory
                };
            }
        }
    }
    return null;
}

function generateRelatedTools(currentToolId, currentToolData, toolCatalog) {
    const { tool: currentTool, category: currentCategory, subcategory: currentSubcategory } = currentToolData;
    const relatedTools = [];
    const maxTools = SEE_ALSO_CONFIG.MAX_TOOLS;

    // Funkcja wczesnego zakończenia dla poprawy wydajności
    const addToolsWithLimit = (toolsToAdd) => {
        const remainingSlots = maxTools - relatedTools.length;
        if (remainingSlots <= 0) return false;
        
        const toolsToTake = toolsToAdd.slice(0, remainingSlots);
        relatedTools.push(...toolsToTake);
        return relatedTools.length < maxTools;
    };

    // Priorytet 1: Ta sama podkategoria (bez bieżącego narzędzia)
    const sameSubcategoryTools = currentSubcategory.tools
        .filter(tool => tool.id !== currentToolId && tool.enabled !== false)
        .map(tool => ({
            tool,
            category: currentCategory,
            subcategory: currentSubcategory,
            priority: 1
        }));
    
    if (!addToolsWithLimit(sameSubcategoryTools)) {
        return relatedTools.slice(0, maxTools);
    }

    // Priorytet 2: Ta sama kategoria, inne podkategorie
    for (const subcategory of currentCategory.subcategories) {
        if (subcategory.name === currentSubcategory.name) continue;
        
        const categoryTools = subcategory.tools
            .filter(tool => tool.enabled !== false)
            .map(tool => ({
                tool,
                category: currentCategory,
                subcategory,
                priority: 2
            }));
        
        if (!addToolsWithLimit(categoryTools)) {
            return relatedTools.slice(0, maxTools);
        }
    }

    // Priorytet 3: Powiązane kategorie (jeśli nadal brakuje narzędzi)
    const relatedCategories = findRelatedCategories(currentCategory.category, toolCatalog);
    
    for (const category of relatedCategories) {
        for (const subcategory of category.subcategories) {
            const otherCategoryTools = subcategory.tools
                .filter(tool => tool.enabled !== false)
                .map(tool => ({
                    tool,
                    category,
                    subcategory,
                    priority: 3
                }));
            
            if (!addToolsWithLimit(otherCategoryTools)) {
                return relatedTools.slice(0, maxTools);
            }
        }
    }

    // Posortuj wg priorytetu i zwróć wynik
    return relatedTools
        .sort((a, b) => a.priority - b.priority)
        .slice(0, maxTools);
}

function findRelatedCategories(currentCategoryName, toolCatalog) {
    // Wyodrębnij nazwy kategorii z danych, aby uniknąć sztywnych wartości
    const allCategories = toolCatalog.map(cat => cat.category);
    
    // Zdefiniuj powiązania kategorii na podstawie faktycznych danych
    const categoryRelationships = {
        'Elektronarzędzia': ['Sprzęt budowlany i ogrodniczy', 'Narzędzia pomiarowe'],
        'Sprzęt budowlany i ogrodniczy': ['Elektronarzędzia', 'Mycie i sprzątanie'],
        'Narzędzia pomiarowe': ['Elektronarzędzia', 'Sprzęt pomocniczy'],
        'Mycie i sprzątanie': ['Sprzęt budowlany i ogrodniczy', 'Sprzęt pomocniczy'],
        'Sprzęt pomocniczy': ['Narzędzia pomiarowe', 'Mycie i sprzątanie'],
        'Akcesoria samochodowe': ['Sprzęt pomocniczy', 'Mycie i sprzątanie']
    };

    const relatedCategoryNames = categoryRelationships[currentCategoryName] || [];
    
    // Przefiltruj tak, by zostawić tylko kategorie istniejące w danych
    const validRelatedNames = relatedCategoryNames.filter(name => allCategories.includes(name));
    
    return toolCatalog.filter(category => 
        validRelatedNames.includes(category.category)
    );
}

function renderSeeAlsoCards(relatedTools) {
    const track = document.getElementById('zobacz-takze-track');
    if (!track) return;

    // Wyczyść istniejącą zawartość
    track.innerHTML = '';

    // Utwórz stan ładowania
    track.innerHTML = '<div class="loading-state">Ładowanie powiązanych narzędzi...</div>';

    // Użyj setTimeout, aby krótko pokazać stan ładowania (lepszy UX)
    setTimeout(() => {
        const fragment = document.createDocumentFragment();

        relatedTools.forEach(({ tool, category, subcategory }) => {
            const toolCard = createSeeAlsoCard(tool, category, subcategory);
            fragment.appendChild(toolCard);
        });

        track.innerHTML = '';
        track.appendChild(fragment);

        // Skonfiguruj leniwe ładowanie obrazów
        // Zaktualizuj stan nawigacji po renderowaniu
        setTimeout(() => {
            const carousel = document.getElementById('zobacz-takze-carousel');
            if (carousel) {
                // Wywołaj aktualizację stanu nawigacji
                const event = new Event('scroll');
                carousel.dispatchEvent(event);
            }
        }, 50);
        
    }, SEE_ALSO_CONFIG.LOADING_DELAY);
}

function createSeeAlsoCard(tool, category, subcategory) {
    const card = document.createElement('a');
    card.className = 'zobacz-takze-card';
    card.href = buildPrettyPath(category?.category, subcategory?.name, tool.id);
    card.setAttribute('data-tool-id', tool.id);

    // Validate tool data and provide fallbacks
    const toolName = tool.name || 'Nienazwane narzędzie';
    const toolImage = toRootPath(tool.image || 'images/placeholder.webp');
    const categoryName = category?.category || 'Nieznana kategoria';
    const subcategoryName = subcategory?.name || 'Nieznana podkategoria';

    // Get pricing info with better error handling
    let priceText = 'Zapytaj o cenę';
    if (tool.pricing && typeof tool.pricing === 'object') {
        const firstPrice = Object.values(tool.pricing).find(price => 
            typeof price === 'number' || (typeof price === 'string' && price !== 'Zapytaj o cenę')
        );
        
        if (firstPrice && typeof firstPrice === 'number') {
            priceText = `od ${firstPrice} zł/dzień`;
        }
    }

    // Sanitize content to prevent XSS
    const safeToolName = fixPolishOrphans(stripHtmlTags(toolName));
    const safeCategoryName = fixPolishOrphans(stripHtmlTags(categoryName));
    const safeSubcategoryName = fixPolishOrphans(stripHtmlTags(subcategoryName));

    card.innerHTML = `
        <div class="zobacz-takze-card-image">
            <img src="${toolImage}" alt="${safeToolName}" loading="lazy" class="card-img" onerror="this.src='/images/placeholder.webp'" width="300" height="200" decoding="async">
            <div class="card-overlay">
                <span class="card-price">${priceText}</span>
            </div>
        </div>
        <div class="zobacz-takze-card-content">
            <h3 class="card-title">${safeToolName}</h3>
            <p class="card-category">${safeCategoryName} › ${safeSubcategoryName}</p>
        </div>
    `;

    return card;
}

function setupCarouselNavigation() {
    const carousel = document.getElementById('zobacz-takze-carousel');
    const track = document.getElementById('zobacz-takze-track');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');

    if (!carousel || !track || !prevButton || !nextButton) return;

    let currentIndex = 0;
    let isAnimating = false;

    // Zdebounce'owany handler przewijania dla wydajności
    const handleScroll = debounce(() => {
        updateNavigationState();
    }, 100);

    // Aktualizuj stan przycisków nawigacji
    function updateNavigationState() {
        const scrollLeft = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const tolerance = SEE_ALSO_CONFIG.SCROLL_TOLERANCE;

        // Jeśli zawartości jest za mało do przewinięcia – wyłącz oba przyciski
        if (maxScroll <= tolerance) {
            prevButton.disabled = true;
            nextButton.disabled = true;
        } else {
            // Standardowa logika, gdy jest co przewijać
            prevButton.disabled = scrollLeft <= tolerance;
            nextButton.disabled = scrollLeft >= maxScroll - tolerance;
        }
        
        prevButton.classList.toggle('disabled', prevButton.disabled);
        nextButton.classList.toggle('disabled', nextButton.disabled);
    }

    // Funkcja płynnego przewijania
    function smoothScroll(direction) {
        if (isAnimating) return;
        
        isAnimating = true;
        
        // Clear any text selection to prevent highlighting during rapid clicking
        clearTextSelection();
        const cardWidth = track.firstElementChild?.offsetWidth || SEE_ALSO_CONFIG.CARD_WIDTH;
        const gap = getCarouselGapPx(track);
        const scrollDistance = cardWidth + gap;
        const currentScroll = carousel.scrollLeft;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        
        let targetScroll;
        if (direction === 'next') {
            targetScroll = currentScroll + scrollDistance;
            // Jeżeli jesteśmy blisko końca, przewiń do samego końca, aby ostatnia karta była w pełni widoczna
            if (targetScroll > maxScroll - scrollDistance) {
                targetScroll = maxScroll;
            }
        } else {
            targetScroll = currentScroll - scrollDistance;
        }

        // Upewnij się, że nie przewiniemy poza zakres
        targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

        carousel.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });

        // Zresetuj flagę animacji po zakończeniu przewijania
        setTimeout(() => {
            isAnimating = false;
            updateNavigationState();
        }, SEE_ALSO_CONFIG.ANIMATION_DURATION);
    }

    // Dodaj atrybuty dostępności (ARIA)
    prevButton.setAttribute('aria-label', 'Poprzednie narzędzia');
    nextButton.setAttribute('aria-label', 'Następne narzędzia');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-label', 'Powiązane narzędzia');

    // Funkcja globalnego czyszczenia zaznaczenia tekstu
    function clearTextSelection() {
        if (window.getSelection) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                selection.removeAllRanges();
            }
        }
        if (document.selection && document.selection.clear) {
            document.selection.clear();
        }
    }

    // Funkcja tymczasowego wyłączenia zaznaczania tekstu
    function disableTextSelection() {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
    }

    // Funkcja ponownego włączenia zaznaczania tekstu
    function enableTextSelection() {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.body.style.mozUserSelect = '';
        document.body.style.msUserSelect = '';
    }

    // Listenery przycisków
    prevButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        disableTextSelection();
        clearTextSelection();
        smoothScroll('prev');
        // Re-enable text selection after animation completes
        setTimeout(enableTextSelection, SEE_ALSO_CONFIG.ANIMATION_DURATION + 50);
    });

    nextButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        disableTextSelection();
        clearTextSelection();
        smoothScroll('next');
        // Re-enable text selection after animation completes
        setTimeout(enableTextSelection, SEE_ALSO_CONFIG.ANIMATION_DURATION + 50);
    });

    // Zapobiegaj zaznaczaniu przy mousedown
    prevButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    nextButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    // Listener zdarzenia przewijania (scroll)
    carousel.addEventListener('scroll', handleScroll);

    // Nawigacja klawiaturą
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            smoothScroll('prev');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            smoothScroll('next');
        }
    });

    // Początkowa aktualizacja stanu po wyrenderowaniu zawartości
    if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(updateNavigationState);
    } else {
        updateNavigationState();
    }
    setTimeout(updateNavigationState, 250);

    // Zachowaj funkcję sprzątającą na przyszłość
    const resizeHandler = debounce(updateNavigationState, 200);
    window.addEventListener('resize', resizeHandler);
    
    // Dołącz funkcję sprzątającą do elementu, aby móc ją wywołać później
    carousel.seeAlsoCleanup = () => {
        window.removeEventListener('resize', resizeHandler);
        carousel.removeEventListener('scroll', handleScroll);
    };
}

// ========== PHONE MODAL FUNCTIONALITY ==========

function initPhoneModal() {
    const callButton = document.getElementById('call-button');
    const phoneModal = document.getElementById('phone-modal');
    const closeButton = document.getElementById('close-phone-modal');
    const modalOverlay = phoneModal?.querySelector('.phone-modal-overlay');

    if (!callButton || !phoneModal) return;

    // Show modal
    function showModal() {
        // Immediately show modal with background blur
        phoneModal.style.display = 'flex';
        phoneModal.style.opacity = '1';
        document.body.style.overflow = 'hidden';
        
        // Start with modal content hidden and scaled down
        const modalContent = phoneModal.querySelector('.phone-modal-content');
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.8)';
            modalContent.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

            // Animate modal content in (to 85% size)
            requestAnimationFrame(() => {
                modalContent.style.opacity = '1';
                modalContent.style.transform = 'scale(0.85)';
            });
        }
    }

    // Hide modal
    function hideModal() {
        const modalContent = phoneModal.querySelector('.phone-modal-content');
        if (modalContent) {
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.8)';
        }
        
        setTimeout(() => {
            phoneModal.style.display = 'none';
            phoneModal.style.opacity = '';
            document.body.style.overflow = '';
            
            // Reset modal content styles
            if (modalContent) {
                modalContent.style.opacity = '';
                modalContent.style.transform = '';
                modalContent.style.transition = '';
            }
        }, 300);
    }

    // Event listeners
    callButton.addEventListener('click', showModal);
    
    if (closeButton) {
        closeButton.addEventListener('click', hideModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', hideModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && phoneModal.style.display === 'flex') {
            hideModal();
        }
    });

    // Close modal after phone number selection
    const phoneOptions = phoneModal.querySelectorAll('.phone-option');
    phoneOptions.forEach(option => {
        option.addEventListener('click', () => {
            setTimeout(hideModal, 100); // Small delay to allow the call to initiate
        });
    });
}

// Initialize phone modal when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhoneModal);
} else {
    initPhoneModal();
}
