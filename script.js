console.log('Skrypt załadowany!');

// Kompleksowa obsługa błędów CORS - głównie dla środowiska deweloperskiego
(function() {
    'use strict';
    
    // Sprawdź czy to środowisko deweloperskie
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.protocol === 'file:' ||
                         window.location.hostname.includes('192.168.');
    
    console.log('🔧 Środowisko:', isDevelopment ? 'Development (HTTP)' : 'Production (HTTPS)');
    console.log('ℹ️ Informacja: Błędy CORS iframe Google Maps są normalne i nie wpływają na funkcjonalność mapy');
    console.log('📚 Źródło: Same-Origin Policy to zabezpieczenie przeglądarek - nie błąd w kodzie');
    
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
            
            console.log('🔇 Ignorowany błąd CORS/external:', {
                message: message.substring(0, 100),
                filename: filename,
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
            console.log('🔇 Ignorowany promise rejection:', reasonStr.substring(0, 100));
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

async function fetchData() {
    try {
        const response = await fetch('data.json');
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
    const toolCatalog = await fetchData();

    if (!toolCatalog || toolCatalog.length === 0) {
        console.error("Brak danych narzędzi do wyświetlenia.");
        // Można tu dodać komunikat dla użytkownika na stronie
        return;
    }

    // Router oparty na unikalnych elementach strony
    if (document.getElementById('why-us')) {
        renderCategories(toolCatalog);
        initScrollAnimations(toolCatalog);
    } else if (document.getElementById('category-title')) {
        renderSubcategories(toolCatalog);
    } else if (document.getElementById('subcategory-title')) {
        renderTools(toolCatalog);
    } else if (document.getElementById('tool-details-section')) {
        renderToolDetails(toolCatalog);
    } else if (document.getElementById('about-us-title')) {
        // Strona "O nas" nie wymaga specjalnego renderowania
        console.log('Router -> About us page');
    } else {
        console.log('Router -> No match found for page.');
    }

    renderNavigationCategories(toolCatalog);
    initializeHamburger(); // To może zostać, jeśli zarządza tylko klasą 'active'
    initializeDropdown(toolCatalog);
    initializeThemeSwitcher();
    initializeMobileMenu(toolCatalog);
    initializeSearch(toolCatalog);
    initScrollAnimations();
    
    // Zastosuj zasady typografii po wszystkich inicjalizacjach
    setTimeout(() => {
        applyTypographyRules();
    }, 100);

    // Scroll-to-top button logic with GSAP
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
            e.preventDefault();
            // Sprawdzamy, czy jesteśmy na stronie głównej
            if (document.getElementById('why-us')) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                // Jeśli na podstronie, przejdź do strony głównej
                window.location.href = 'index.html';
            }
        });
    }
});

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

// Debounce function to limit the rate at which a function gets called.
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

    // Cache DOM elements for better performance
    const panels = document.querySelectorAll('.mobile-menu-panel');
    const mainMenuPanel = document.getElementById('main-menu-panel');

    // Populate categories in mobile menu
    populateMobileMenuCategories(toolCatalog);

    // Toggle mobile menu
    hamburger.addEventListener('click', () => {
        const isActive = container.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', closeMobileMenu);

    // Event delegation for better performance - single listener on container
    container.addEventListener('click', handleContainerClick);

    // Handle all clicks within container using event delegation
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
            // Hide current active panel
            panels.forEach(panel => {
                if (panel.classList.contains('active')) {
                    panel.classList.remove('active');
                    panel.classList.add('sliding-out');
                }
            });

            // Show target panel after a brief delay
            setTimeout(() => {
                panels.forEach(panel => {
                    panel.classList.remove('sliding-out');
                });
                targetPanel.classList.add('active');
            }, 150);
        } else {
            // Immediate switch without animation
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

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    toolCatalog.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'mobile-menu-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'mobile-menu-link has-submenu';
        link.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));
        link.setAttribute('data-category', category.category);
        
        // Remove individual event listeners - use event delegation instead
        
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
        link.href = `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(subcategory.name)}`;
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
        // Hide current active panel
        panels.forEach(panel => {
            if (panel.classList.contains('active')) {
                panel.classList.remove('active');
                panel.classList.add('sliding-out');
            }
        });

        // Show target panel after a brief delay
        setTimeout(() => {
            panels.forEach(panel => {
                panel.classList.remove('sliding-out');
            });
            targetPanel.classList.add('active');
        }, 150);
    } else {
        // Immediate switch without animation
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
        link.href = `category.html?category=${encodeURIComponent(category.category)}`;
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
        cardLink.href = `category.html?category=${encodeURIComponent(category.category)}`;
        cardLink.className = 'category-card'; 

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';

        const img = document.createElement('img');
        img.src = category.image;
        img.alt = category.category;
        img.className = 'category-card-img';
        img.loading = 'lazy';

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
                siblingLink.href = `category.html?category=${encodeURIComponent(sibling.category)}`;
                siblingLink.textContent = sibling.category;
            } else if (type === 'subcategory') {
                siblingLink.href = `subcategory.html?category=${encodeURIComponent(parentCategoryForSiblings)}&subcategory=${encodeURIComponent(sibling.name)}`;
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
    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get('category');
    const contentGrid = document.getElementById('subcategory-grid');
    const titleElement = document.getElementById('category-title');
    const breadcrumbContainer = document.querySelector('.breadcrumb');

    if (!categoryName || !contentGrid || !titleElement || !breadcrumbContainer) return;

    const category = toolCatalog.find(c => c.category === categoryName);
    if (!category) {
        contentGrid.innerHTML = '<p>Kategoria nie została znaleziona.</p>';
        return;
    }

    titleElement.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));
    
    // Breadcrumb rendering
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());

    const categorySpan = document.createElement('span');
    categorySpan.innerHTML = fixPolishOrphans(stripHtmlTags(category.category));
    breadcrumbContainer.appendChild(categorySpan);

    // Page content
    contentGrid.innerHTML = '';
    category.subcategories.forEach(sub => {
        const cardLink = document.createElement('a');
        cardLink.href = `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(sub.name)}`;
        cardLink.className = 'subcategory-card'; 
        cardLink.innerHTML = `<h3>${fixPolishOrphans(stripHtmlTags(sub.name))}</h3>`;
        contentGrid.appendChild(cardLink);
    });
    
}

function renderTools(toolCatalog) {
    document.body.classList.add('subpage');
    const params = new URLSearchParams(window.location.search);
    const categoryName = params.get('category');
    const subcategoryName = params.get('subcategory');

    const contentGrid = document.getElementById('tools-grid');
    const titleElement = document.getElementById('subcategory-title');
    const breadcrumbContainer = document.querySelector('.breadcrumb');

    if (!categoryName || !subcategoryName || !contentGrid || !titleElement || !breadcrumbContainer) return;

    const category = toolCatalog.find(c => c.category === categoryName);
    const subcategory = category ? category.subcategories.find(s => s.name === subcategoryName) : null;

    if (!subcategory) {
        contentGrid.innerHTML = '<p>Podkategoria nie została znaleziona.</p>';
        return;
    }

    titleElement.innerHTML = fixPolishOrphans(stripHtmlTags(subcategory.name));

    // Breadcrumb rendering
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());
    
    const categorySiblings = toolCatalog.filter(c => c.category !== category.category);
    const categoryCrumb = createInteractiveBreadcrumb(stripHtmlTags(category.category), `category.html?category=${encodeURIComponent(category.category)}`, categorySiblings, 'category');
    breadcrumbContainer.appendChild(categoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());

    const subcategorySpan = document.createElement('span');
    subcategorySpan.innerHTML = fixPolishOrphans(stripHtmlTags(subcategory.name));
    breadcrumbContainer.appendChild(subcategorySpan);

    // Page content
    contentGrid.innerHTML = '';
    const enabledTools = subcategory.tools.filter(tool => tool.enabled !== false);

    if (enabledTools.length === 0) {
        contentGrid.innerHTML = '<p>Brak narzędzi w tej podkategorii.</p>';
        return;
    }

    enabledTools.forEach(tool => {
        const toolCard = document.createElement('a');
        toolCard.className = 'tool-card';
        toolCard.href = `tool.html?toolId=${tool.id}`;

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';

        const img = document.createElement('img');
        img.src = tool.image;
        img.alt = tool.name;
        img.className = 'tool-card-img';
        img.loading = 'lazy';

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
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('toolId');

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

    // Breadcrumb rendering
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());

    const categorySiblings = toolCatalog.filter(c => c.category !== category.category);
    const categoryCrumb = createInteractiveBreadcrumb(stripHtmlTags(category.category), `category.html?category=${encodeURIComponent(category.category)}`, categorySiblings, 'category');
    breadcrumbContainer.appendChild(categoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());
    
    const subcategorySiblings = category.subcategories.filter(s => s.name !== subcategory.name);
    const subcategoryCrumb = createInteractiveBreadcrumb(stripHtmlTags(subcategory.name), `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(subcategory.name)}`, subcategorySiblings, 'subcategory', category.category);
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
    imageElement.src = tool.image;
    imageElement.alt = tool.name;

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
    
    // Initialize carousel after tool details are rendered
    initializeToolCarousel(toolCatalog);
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
        categoryLink.href = `category.html?category=${encodeURIComponent(category.category)}`;
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
            subcategoryLink.href = `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(subcategory.name)}`;
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
    }, 50);
}

function initializeHamburger() {
    // Hamburger functionality is now handled by initializeMobileMenu()
    // This function is kept for compatibility but functionality moved to mobile menu
}

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

function initScrollAnimations() {
    // Znajdź wszystkie karty na stronie, które powinny być animowane (excluding carousel cards)
    const allCards = document.querySelectorAll('.feature-card, .category-card, .subcategory-card, .tool-card:not(.carousel .tool-card)');
    const contactSection = document.querySelector('#contact');
    const contactItems = document.querySelectorAll('.contact-details, .contact-map');
    const heroSection = document.querySelector('.hero-section');

    // Dodaj klasę i ustaw stan początkowy (ukryty i przesunięty) dla wszystkich kart (excluding carousel cards)
    allCards.forEach(card => {
        // Skip cards that are inside carousel
        if (!card.closest('.carousel')) {
            card.classList.add('stagger-item');
            gsap.set(card, { opacity: 0, y: 20 });
        }
    });

    // Dodaj animacje dla elementów kontaktu
    contactItems.forEach(item => {
        item.classList.add('stagger-item');
        gsap.set(item, { opacity: 0, y: 30 });
    });

    // Intersection Observer dla animacji
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;

                // Animacja dla kontenerów z elementami .stagger-item (w tym kontakt)
                const items = target.querySelectorAll('.stagger-item');
                if (items.length > 0) {
                    gsap.to(items, {
                        opacity: 1,
                        y: 0,
                        duration: 1.2,
                        ease: 'power2.out',
                        stagger: target.id === 'contact' ? 0.3 : 0 // Stagger dla kontaktu
                    });
                    items.forEach(item => item.classList.add('animate'));
                }
                
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    // Obserwuj wszystkie relevantne kontenery siatki na dowolnej stronie
    const gridsToObserve = document.querySelectorAll('.features-grid, #tools-grid, #subcategory-grid, #contact');
    
    gridsToObserve.forEach(grid => {
        if (grid) {
            observer.observe(grid);
        }
    });

    // Animacja hero section przy załadowaniu strony
    if (heroSection) {
        const heroElements = [
            heroSection.querySelector('h1'),
            heroSection.querySelector('p'),
            heroSection.querySelector('.btn')
        ].filter(el => el); // Usuń null/undefined elementy
        
        // Użyj fromTo, aby jawnie zdefiniować stan końcowy (w tym kolor)
        gsap.fromTo(heroElements, {
            opacity: 0, // Stan początkowy
        }, {
            opacity: 1, // Stan końcowy
            color: 'white', // Wymuś biały kolor na koniec animacji
            duration: 1.5,
            delay: 0.3,
            ease: 'power2.out'
        });
    }
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
        console.log('Search elements not found on this page - skipping initialization');
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
                    <img src="${result.tool.image}" alt="${result.tool.name}" class="search-result-image" loading="lazy">
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
                
                window.location.href = `tool.html?toolId=${toolId}`;
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

    // Inicjalizacja Google Consent Mode
    if (typeof gtag !== 'undefined') {
        // Domyślnie wyłącz wszystkie cookies
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'functionality_storage': 'denied',
            'personalization_storage': 'denied',
            'security_storage': 'granted'
        });
        console.log('🔒 Google Consent Mode zainicjalizowany - domyślnie wyłączony');
    }

    // Inicjalizacja Meta Pixel - domyślnie wyłączony
    if (typeof fbq !== 'undefined') {
        // Wyłącz automatyczne śledzenie Meta Pixel
        fbq('consent', 'revoke');
        console.log('🔒 Meta Pixel zainicjalizowany - domyślnie wyłączony');
    }

    // Sprawdź czy użytkownik już podjął decyzję
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
        cookiePopup.classList.add('hidden');
        
        // Zastosuj zapisaną preferencję
        if (typeof gtag !== 'undefined') {
            if (consent === 'accepted') {
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
                console.log('✅ Google Analytics włączony na podstawie zapisanych preferencji');
            } else {
                gtag('consent', 'update', {
                    'analytics_storage': 'denied'
                });
                console.log('❌ Google Analytics wyłączony na podstawie zapisanych preferencji');
            }
        }

        // Zastosuj preferencję dla Meta Pixel
        if (typeof fbq !== 'undefined') {
            if (consent === 'accepted') {
                fbq('consent', 'grant');
                console.log('✅ Meta Pixel włączony na podstawie zapisanych preferencji');
            } else {
                fbq('consent', 'revoke');
                console.log('❌ Meta Pixel wyłączony na podstawie zapisanych preferencji');
            }
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
            localStorage.setItem('cookieConsent', 'accepted');
            hidePopup();
            console.log('Cookies zostały zaakceptowane');
            
            // Włącz Google Tag Manager po akceptacji
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
                console.log('✅ Google Analytics włączony po akceptacji cookies');
            }

            // Włącz Meta Pixel po akceptacji
            if (typeof fbq !== 'undefined') {
                fbq('consent', 'grant');
                console.log('✅ Meta Pixel włączony po akceptacji cookies');
            }
        });
    }

    // Odrzucenie cookies
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'rejected');
            hidePopup();
            console.log('Cookies zostały odrzucone');
            
            // Wyłącz Google Tag Manager po odrzuceniu
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', {
                    'analytics_storage': 'denied'
                });
                console.log('❌ Google Analytics wyłączony po odrzuceniu cookies');
            }

            // Wyłącz Meta Pixel po odrzuceniu
            if (typeof fbq !== 'undefined') {
                fbq('consent', 'revoke');
                console.log('❌ Meta Pixel wyłączony po odrzuceniu cookies');
            }
        });
    }
});

/**
 * Simple Infinite Carousel - Clean and bulletproof implementation
 * Focus: Simple infinite loop that never breaks or shows empty space
 */
class ToolCarousel {
    constructor(toolCatalog) {
        console.log('🏗️ ToolCarousel constructor starting...');
        
        // DOM references
        this.carouselTrack = document.querySelector('.carousel-track');
        this.leftArrow = document.querySelector('.nav-arrow.left');
        this.rightArrow = document.querySelector('.nav-arrow.right');
        this.similarToolsSection = document.getElementById('similar-tools');
        
        console.log('🔍 DOM element check:');
        console.log('   - carouselTrack:', this.carouselTrack ? 'found' : 'NOT FOUND');
        console.log('   - leftArrow:', this.leftArrow ? 'found' : 'not found (may be hidden)');
        console.log('   - rightArrow:', this.rightArrow ? 'found' : 'not found (may be hidden)');
        console.log('   - similarToolsSection:', this.similarToolsSection ? 'found' : 'NOT FOUND');
        
        // CRITICAL FIX: More flexible initialization - handle missing elements gracefully
        if (!this.similarToolsSection) {
            console.error('❌ Similar tools section not found - carousel cannot initialize');
            return;
        }
        
        // CRITICAL FIX: If carousel track is missing, try to create it or handle gracefully
        if (!this.carouselTrack) {
            console.warn('⚠️ Carousel track element not found - attempting recovery');
            const carouselContainer = this.similarToolsSection.querySelector('.carousel');
            if (carouselContainer) {
                // Try to create missing track element
                const track = document.createElement('div');
                track.className = 'carousel-track';
                carouselContainer.appendChild(track);
                this.carouselTrack = track;
                console.log('✅ Carousel track element created successfully');
            } else {
                console.error('❌ Cannot recover - carousel container also missing');
                // Keep section visible on mobile even if carousel fails
                const isMobileScreen = window.innerWidth <= 768;
                if (isMobileScreen && this.similarToolsSection) {
                    this.similarToolsSection.style.display = 'block';
                    this.similarToolsSection.style.visibility = 'visible';
                    console.log('📱 Mobile fallback - kept section visible despite missing elements');
                }
                return;
            }
        }
        
        // Arrows are optional (hidden on mobile) but log if missing
        if (!this.leftArrow || !this.rightArrow) {
            console.log('⚠️ Navigation arrows not found - likely hidden on mobile, continuing with touch-only carousel');
        }
        
        console.log('✅ DOM elements validated, continuing with carousel initialization...');
        
        // Store bound functions for proper cleanup - optimized for immediate response
        this.boundHandleLeftClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Allow arrows on wider mobile screens (landscape/tablet) for better UX
            if (!this.isNarrowMobile) {
                // Immediate response - no debouncing
                this.slide(-1);
            }
        };
        
        this.boundHandleRightClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Allow arrows on wider mobile screens (landscape/tablet) for better UX
            if (!this.isNarrowMobile) {
                // Immediate response - no debouncing
                this.slide(1);
            }
        };
        
        this.boundHandleCardClick = (e) => {
            // Prevent click if we just finished dragging
            if (this.state.hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            const card = e.target.closest('.tool-card');
            if (!card) return;
            
            const toolId = card.dataset.toolId;
            if (toolId) {
                window.location.href = `tool.html?toolId=${toolId}`;
            }
        };
        
        this.boundHandleResize = () => {
            // Clear any existing timeout for better responsiveness
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            // Reduced timeout for faster response on mobile
            this.resizeTimeout = setTimeout(() => {
                // Update mobile detection with enhanced checks
                const wasMobile = this.isMobile;
                const wasNarrowMobile = this.isNarrowMobile;
                
                // Re-detect mobile capabilities on resize
                this.detectMobileCapabilities();
                
                // Re-bind events if mobile status changed
                if (wasMobile !== this.isMobile || wasNarrowMobile !== this.isNarrowMobile) {
                    this.unbindTouchEvents();
                    this.unbindMouseEvents();
                    if (this.isMobile) {
                        this.bindTouchEvents();
                    }
                    // Re-bind mouse events for narrow screens without touch
                    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                    const narrowScreen = window.innerWidth <= 768;
                    if (narrowScreen && !hasTouch) {
                        this.bindMouseEvents();
                    }
                    // Update accessibility when mobile state changes
                    this.updateArrowAccessibility();
                    // Update config for immediate response
                    this.config.animationDuration = this.isMobile ? 0.2 : 0.5;
                    this.config.debounceDelay = this.isMobile ? 0 : 50;
                }
                
                this.calculateDimensions();
                this.repositionAfterResize();
            }, this.isMobile ? 50 : 100); // Faster resize response on mobile
        };
        
        // Enhanced mobile detection - check for touch capabilities and viewport
        this.detectMobileCapabilities();
        
        // Debug mobile detection
        this.logMobileDetection();
        this.updateArrowAccessibility();
        
        // Configuration - optimized for mobile with immediate response
        this.config = {
            animationDuration: this.isMobile ? 0.2 : 0.5, // Faster response on mobile
            maxSimilarTools: 12,
            cloneMultiplier: this.isMobile ? 2 : 3, // Less cloning on mobile for performance
            // Touch settings - optimized for immediate response
            swipeThreshold: this.isMobile ? 25 : 50, // Lower threshold for more responsive touch
            swipeVelocityThreshold: this.isMobile ? 0.15 : 0.3, // More sensitive for immediate response
            touchMoveThreshold: this.isMobile ? 5 : 10, // More responsive on mobile
            dragResistance: this.isMobile ? 0.9 : 0.8, // Higher resistance for better control
            debounceDelay: this.isMobile ? 0 : 50 // No debounce on mobile for instant response
        };
        
        // State
        this.state = {
            currentIndex: 0,
            cardWidth: 0,
            isAnimating: false,
            tools: [],
            // Touch state
            touchStartX: 0,
            touchStartY: 0,
            touchCurrentX: 0,
            touchCurrentY: 0,
            touchStartTime: 0,
            isDragging: false,
            startTransform: 0,
            hasMoved: false,
            // Persistent state - tracks if user has ever interacted with carousel
            hasEverMoved: false
        };
        
        // Initialize
        this.init(toolCatalog);
    }
    
    init(toolCatalog) {
        try {
            console.log('🔄 Getting similar tools from catalog...');
            const similarTools = this.getSimilarTools(toolCatalog);
            console.log('📊 Similar tools found:', similarTools.length);
            
            if (similarTools.length === 0) {
                console.warn('⚠️ No similar tools found, showing mobile-friendly message');
                
                // Instead of hiding section, show a message
                if (this.similarToolsSection) {
                    this.similarToolsSection.style.display = 'block';
                    this.similarToolsSection.style.visibility = 'visible';
                    this.similarToolsSection.style.opacity = '1';
                    
                    const carouselContainer = this.similarToolsSection.querySelector('.carousel-container');
                    if (carouselContainer) {
                        carouselContainer.innerHTML = `
                            <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
                                <p>Brak podobnych narzędzi do wyświetlenia</p>
                            </div>
                        `;
                    }
                }
                return;
            }
            
            console.log('✅ Setting up carousel with', similarTools.length, 'tools');
            this.state.tools = similarTools;
            
            // CRITICAL FIX: Ensure section is always visible before setup
            if (this.similarToolsSection) {
                this.similarToolsSection.style.display = 'block';
                this.similarToolsSection.style.visibility = 'visible';
                this.similarToolsSection.style.opacity = '1';
            }
            
            this.setupCarousel();
            this.bindEvents();
            
        } catch (error) {
            console.error('❌ Carousel initialization failed:', error);
            console.error('Error details:', error.stack);
            
            // Debug DOM structure on failure
            console.log('🔍 DOM structure debug:');
            const h2 = similarToolsSection.querySelector('h2');
            const container = similarToolsSection.querySelector('.carousel-container');
            const carousel = similarToolsSection.querySelector('.carousel');
            const track = similarToolsSection.querySelector('.carousel-track');
            
            console.log('  - H2 element:', h2 ? 'found' : 'NOT FOUND');
            console.log('  - Container element:', container ? 'found' : 'NOT FOUND');
            console.log('  - Carousel element:', carousel ? 'found' : 'NOT FOUND');
            console.log('  - Track element:', track ? 'found' : 'NOT FOUND');
            
            // CRITICAL FIX: Better error handling - always keep section visible on mobile
            const isMobileScreen = window.innerWidth <= 768;
            if (isMobileScreen) {
                console.log('📱 Mobile error fallback - keeping section visible');
                if (this.similarToolsSection) {
                    this.similarToolsSection.style.display = 'block';
                    this.similarToolsSection.style.visibility = 'visible';
                    const carousel = this.similarToolsSection.querySelector('.carousel');
                    if (carousel) {
                        carousel.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; min-height: 120px; color: #666; padding: 1rem; text-align: center; font-size: 0.9rem;">Problem z ładowaniem podobnych narzędzi</div>';
                    }
                }
            } else {
                // Always keep section visible with appropriate message
                if (this.similarToolsSection) {
                    this.similarToolsSection.style.display = 'block';
                    this.similarToolsSection.style.visibility = 'visible';
                    this.similarToolsSection.style.opacity = '1';
                    
                    const carouselContainer = this.similarToolsSection.querySelector('.carousel-container');
                    if (carouselContainer) {
                        carouselContainer.innerHTML = `
                            <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
                                <p>Brak podobnych narzędzi do wyświetlenia</p>
                            </div>
                        `;
                    }
                }
            }
        }
    }
    
    getSimilarTools(toolCatalog) {
        const params = new URLSearchParams(window.location.search);
        const currentToolId = params.get('toolId');
        
        console.log('🔍 Carousel: Looking for similar tools to:', currentToolId);
        
        // Find current tool
        let currentTool = null;
        let currentCategory = null;
        let currentSubcategory = null;
        
        for (const cat of toolCatalog) {
            for (const sub of cat.subcategories) {
                const tool = sub.tools.find(t => t.id === currentToolId && t.enabled !== false);
                if (tool) {
                    currentTool = tool;
                    currentCategory = cat;
                    currentSubcategory = sub;
                    break;
                }
            }
            if (currentTool) break;
        }
        
        if (!currentTool) {
            console.warn('❌ Current tool not found:', currentToolId);
            return [];
        }
        
        console.log('✅ Found current tool:', currentTool.name, 'in category:', currentCategory.category);
        
        const similarTools = [];
        
        // Same subcategory first (excluding current tool)
        const subcategoryTools = currentSubcategory.tools
            .filter(tool => tool.id !== currentToolId && tool.enabled !== false);
        similarTools.push(...subcategoryTools.slice(0, 4));
        console.log('📦 Same subcategory tools:', subcategoryTools.length, 'added:', subcategoryTools.slice(0, 4).length);
        
        // Same category, different subcategories
        if (similarTools.length < this.config.maxSimilarTools) {
            currentCategory.subcategories.forEach(sub => {
                if (sub !== currentSubcategory) {
                    sub.tools
                        .filter(tool => tool.enabled !== false)
                        .forEach(tool => {
                            if (similarTools.length < this.config.maxSimilarTools) {
                                similarTools.push({
                                    ...tool,
                                    category: currentCategory.category,
                                    subcategory: sub.name
                                });
                            }
                        });
                }
            });
        }
        console.log('🏗️ After same category:', similarTools.length, 'tools');
        
        // Other categories if needed
        if (similarTools.length < this.config.maxSimilarTools) {
            toolCatalog.forEach(cat => {
                if (cat !== currentCategory) {
                    cat.subcategories.forEach(sub => {
                        sub.tools
                            .filter(tool => tool.enabled !== false)
                            .forEach(tool => {
                                if (similarTools.length < this.config.maxSimilarTools) {
                                    similarTools.push({
                                        ...tool,
                                        category: cat.category,
                                        subcategory: sub.name
                                    });
                                }
                            });
                    });
                }
            });
        }
        
        console.log('🎯 Final similar tools count:', similarTools.length);
        console.log('🛠️ Similar tools:', similarTools.map(t => t.name));
        
        return similarTools;
    }
    
    setupCarousel() {
        this.createCards();
        this.calculateDimensions();
        this.setInitialPosition();
    }
    
    createCards() {
        const fragment = document.createDocumentFragment();
        const tools = this.state.tools;
        
        console.log('🎠 Creating carousel with', tools.length, 'tools and', this.config.cloneMultiplier, 'sets');
        
        // Create multiple sets for smooth infinite scrolling
        // Pattern: [tools] [tools] [tools] [tools] [tools]
        // We start viewing the middle set, can scroll left/right seamlessly
        for (let set = 0; set < this.config.cloneMultiplier; set++) {
            tools.forEach((tool, index) => {
                const card = this.createToolCard(tool);
                card.dataset.originalIndex = index;
                card.dataset.setIndex = set;
                fragment.appendChild(card);
            });
        }
        
        console.log('🃏 Total cards created:', this.config.cloneMultiplier * tools.length);
        
        this.carouselTrack.innerHTML = '';
        this.carouselTrack.appendChild(fragment);
        
        // Verify cards were added
        const totalCards = this.carouselTrack.children.length;
        console.log('✅ Cards in DOM:', totalCards);
    }
    
    createToolCard(tool) {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.dataset.toolId = tool.id;
        
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';
        
        const img = document.createElement('img');
        img.src = tool.image;
        img.alt = tool.name; // Maintain accessibility with proper alt text
        img.className = 'tool-card-img';
        img.loading = 'lazy';
        
        imageWrapper.appendChild(img);
        card.appendChild(imageWrapper);
        
        // Ensure carousel cards are visible (prevent scroll animation interference)
        gsap.set(card, { opacity: 1, y: 0 });
        
        return card;
    }
    
    calculateDimensions() {
        const card = this.carouselTrack.querySelector('.tool-card');
        if (!card) {
            console.warn('⚠️ No cards found for dimension calculation');
            return;
        }
        
        // Get actual card width including gap
        const cardRect = card.getBoundingClientRect();
        const trackStyle = getComputedStyle(this.carouselTrack);
        const gap = parseFloat(trackStyle.gap) || (this.isNarrowMobile ? 16 : 24);
        
        // DEBUGGING: Comprehensive viewport and positioning information
        const viewportInfo = {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            orientationAngle: screen.orientation?.angle || 'unknown'
        };
        
        const trackRect = this.carouselTrack.getBoundingClientRect();
        const containerRect = this.carouselTrack.parentElement.getBoundingClientRect();
        
        console.log('🔍 VIEWPORT & POSITIONING DEBUG:');
        console.log('📱 Viewport Info:', viewportInfo);
        console.log('📦 Container Rect:', {
            x: containerRect.x,
            y: containerRect.y,
            width: containerRect.width,
            height: containerRect.height,
            top: containerRect.top,
            left: containerRect.left,
            bottom: containerRect.bottom,
            right: containerRect.right
        });
        console.log('🎠 Track Rect:', {
            x: trackRect.x,
            y: trackRect.y,
            width: trackRect.width,
            height: trackRect.height,
            top: trackRect.top,
            left: trackRect.left,
            bottom: trackRect.bottom,
            right: trackRect.right
        });
        console.log('🎯 Card Rect:', {
            x: cardRect.x,
            y: cardRect.y,
            width: cardRect.width,
            height: cardRect.height,
            top: cardRect.top,
            left: cardRect.left,
            bottom: cardRect.bottom,
            right: cardRect.right
        });
        console.log('📏 Calculated Values:', {
            gap: gap,
            cardWidth: cardRect.width,
            totalCardWidth: cardRect.width + gap,
            cardsVisibleInViewport: Math.floor(viewportInfo.width / (cardRect.width + gap))
        });
        console.log('🎛️ Track CSS Properties:', {
            display: trackStyle.display,
            flexDirection: trackStyle.flexDirection,
            gap: trackStyle.gap,
            width: trackStyle.width,
            transform: trackStyle.transform,
            position: trackStyle.position
        });
        
        // CRITICAL FIX: On narrow mobile, use actual rendered dimensions
        if (this.isNarrowMobile) {
            // Force recalculation after any layout changes
            this.carouselTrack.style.visibility = 'visible';
            this.carouselTrack.style.display = 'flex';
            
            // Wait for layout to settle, then get accurate measurements
            setTimeout(() => {
                const updatedCard = this.carouselTrack.querySelector('.tool-card');
                if (updatedCard) {
                    const updatedRect = updatedCard.getBoundingClientRect();
                    this.state.cardWidth = updatedRect.width + gap;
                    
                    console.log('📏 Updated card dimensions for narrow mobile:');
                    console.log('   Card width:', updatedRect.width);
                    console.log('   Gap:', gap);
                    console.log('   Total card width:', this.state.cardWidth);
                    
                    // CRITICAL FIX: Only reset position if carousel hasn't been used yet
                    // Don't reset if user has already interacted with carousel
                    if (this.state.currentIndex === 0 && !this.state.hasEverMoved) {
                        console.log('🔄 Resetting position for initial setup only');
                        this.setInitialPosition();
                    } else {
                        console.log('⚠️ Skipping position reset - user has interacted with carousel');
                    }
                }
            }, 10);
        } else {
            this.state.cardWidth = cardRect.width + gap;
        }
        
        console.log('📏 Card dimensions:');
        console.log('   Card width:', cardRect.width);
        console.log('   Gap:', gap);
        console.log('   Total card width:', this.state.cardWidth);
    }
    
    setInitialPosition() {
        // Start at the middle set (index 1 of cloneMultiplier sets)
        const middleSetIndex = Math.floor(this.config.cloneMultiplier / 2);
        let initialOffset = -(middleSetIndex * this.state.tools.length * this.state.cardWidth);
        
        // CRITICAL FIX: On narrow mobile, ensure content is visible within viewport
        if (this.isNarrowMobile && this.state.cardWidth > 0) {
            const viewportWidth = window.innerWidth;
            // Start with first card visible (small left margin for visual appeal)
            const desiredFirstCardPosition = 8; // 8px from left edge
            const containerLeft = this.carouselTrack.parentElement.getBoundingClientRect().x;
            
            // Calculate what offset would place first card at desired position
            const desiredOffset = desiredFirstCardPosition - containerLeft;
            
            console.log('📱 Narrow mobile positioning fix:', {
                originalOffset: initialOffset,
                containerLeft: containerLeft,
                desiredFirstCardPos: desiredFirstCardPosition,
                calculatedOffset: desiredOffset
            });
            
            // Use the calculated offset to ensure visibility
            initialOffset = desiredOffset;
            console.log('📱 Adjusted initial offset for narrow mobile visibility:', initialOffset);
        }
        
        console.log('🎯 Setting initial position:');
        console.log('   Middle set index:', middleSetIndex);
        console.log('   Tools count:', this.state.tools.length);
        console.log('   Card width:', this.state.cardWidth);
        console.log('   Initial offset:', initialOffset);
        console.log('   Viewport width:', window.innerWidth);
        console.log('   Is narrow mobile:', this.isNarrowMobile);
        
        gsap.set(this.carouselTrack, { 
            x: initialOffset,
            force3D: true 
        });
        
        this.state.currentIndex = 0; // Logical index within the tools array
        
        console.log('✅ Initial position set, carousel should show tools starting from index 0');
    }
    
    bindEvents() {
        // Arrow clicks - desktop only (if arrows exist)
        if (this.leftArrow) {
            this.leftArrow.addEventListener('click', this.boundHandleLeftClick);
        }
        if (this.rightArrow) {
            this.rightArrow.addEventListener('click', this.boundHandleRightClick);
        }
        
        // Touch events for mobile - bind with multiple detection methods
        console.log('🎯 Touch event binding - isMobile:', this.isMobile);
        console.log('   - Window width:', window.innerWidth);
        console.log('   - Touch capability:', 'ontouchstart' in window);
        console.log('   - Max touch points:', navigator.maxTouchPoints || 0);
        
        // DEBUGGING: Add simple touch test
        if (this.carouselTrack) {
            console.log('🧪 Adding simple touch test to carousel track');
            this.carouselTrack.addEventListener('touchstart', function(e) {
                console.log('🚨 SIMPLE TOUCH TEST - touchstart fired on carousel track!');
            }, { passive: true });
        }
        
        // Enhanced touch detection with fallbacks
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        const narrowScreen = window.innerWidth <= 768;
        
        console.log('📱 Touch detection results:', {
            isMobile: this.isMobile,
            hasTouch: hasTouch,
            narrowScreen: narrowScreen,
            shouldBind: this.isMobile || hasTouch || narrowScreen
        });
        
        // ALWAYS bind touch events on mobile screens, regardless of other detection
        if (this.isMobile || hasTouch || narrowScreen) {
            console.log('✅ Binding touch events - mobile/touch capability detected');
            this.bindTouchEvents();
        } else {
            console.log('⚠️ Touch events NOT bound - no touch capability detected');
        }
        
        // CRITICAL FIX: On narrow screens, also bind mouse events as fallback
        if (narrowScreen && !hasTouch) {
            console.log('🖱️ Binding mouse events as touch fallback for narrow screens');
            this.bindMouseEvents();
        }
        
        // Card clicks - handle after touch/drag
        this.carouselTrack.addEventListener('click', this.boundHandleCardClick);
        
        // Resize handling with mobile detection update
        window.addEventListener('resize', this.boundHandleResize);
    }
    
    bindMouseEvents() {
        console.log('🖱️ bindMouseEvents called - setting up mouse handlers as touch fallback');
        
        let isMouseDown = false;
        
        // Mouse down (equivalent to touch start)
        this.handleMouseDown = (e) => {
            if (e.button !== 0) return; // Only left mouse button
            
            console.log('🖱️ Mouse down detected', {
                button: e.button,
                clientX: e.clientX,
                clientY: e.clientY,
                isAnimating: this.state.isAnimating
            });
            
            if (this.state.isAnimating) return;
            
            isMouseDown = true;
            this.state.touchStartX = e.clientX;
            this.state.touchStartY = e.clientY;
            this.state.touchCurrentX = e.clientX;
            this.state.touchCurrentY = e.clientY;
            this.state.touchStartTime = Date.now();
            this.state.isDragging = false;
            this.state.hasMoved = false;
            
            // Get current transform for smooth dragging continuation
            this.state.startTransform = gsap.getProperty(this.carouselTrack, "x");
            
            e.preventDefault();
            console.log('✅ Mouse down handled successfully');
        };
        
        // Mouse move (equivalent to touch move)
        this.handleMouseMove = (e) => {
            if (!isMouseDown || !this.state.touchStartX) {
                return;
            }
            
            this.state.touchCurrentX = e.clientX;
            this.state.touchCurrentY = e.clientY;
            
            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const deltaY = this.state.touchCurrentY - this.state.touchStartY;
            
            console.log('🖱️ Mouse move', {deltaX, deltaY, isDragging: this.state.isDragging, threshold: this.config.touchMoveThreshold});
            
            // Determine if this is a horizontal drag
            if (!this.state.isDragging && Math.abs(deltaX) > this.config.touchMoveThreshold) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    console.log('🔄 Starting horizontal drag');
                    this.state.isDragging = true;
                    this.state.hasMoved = true;
                    this.state.hasEverMoved = true; // Mark permanent interaction
                    this.carouselTrack.classList.add('dragging');
                    e.preventDefault();
                }
            }
            
            // Apply drag resistance and move carousel if dragging
            if (this.state.isDragging) {
                e.preventDefault();
                const dragDistance = deltaX * this.config.dragResistance;
                const newPosition = this.state.startTransform + dragDistance;
                
                console.log('🏃 Dragging carousel', {dragDistance, newPosition, startTransform: this.state.startTransform});
                gsap.set(this.carouselTrack, { x: newPosition });
            }
        };
        
        // Mouse up (equivalent to touch end)
        this.handleMouseUp = (e) => {
            console.log('🖱️ Mouse up detected', {
                touchStartX: this.state.touchStartX,
                isDragging: this.state.isDragging,
                hasMoved: this.state.hasMoved
            });
            
            if (!isMouseDown) return;
            isMouseDown = false;
            
            if (!this.state.touchStartX) {
                this.resetTouchState();
                return;
            }
            
            // Calculate swipe metrics
            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const deltaTime = Date.now() - this.state.touchStartTime;
            const velocity = Math.abs(deltaX) / Math.max(deltaTime, 1);
            
            const isSwipe = Math.abs(deltaX) >= this.config.swipeThreshold && 
                           velocity >= this.config.swipeVelocityThreshold;
            
            console.log('📊 Mouse swipe analysis', {
                deltaX,
                deltaTime,
                velocity,
                swipeThreshold: this.config.swipeThreshold,
                velocityThreshold: this.config.swipeVelocityThreshold,
                isSwipe,
                isDragging: this.state.isDragging
            });
            
            if (this.state.isDragging && isSwipe) {
                // Determine direction and trigger slide
                const direction = deltaX > 0 ? -1 : 1; // Mouse right = slide left (previous)
                console.log('🎯 Triggering slide in direction:', direction);
                this.slide(direction);
            } else if (this.state.isDragging) {
                // Snap back to current position if not enough swipe
                console.log('↩️ Snapping back to current position');
                this.snapToCurrentPosition();
            }
            
            // Reset touch state immediately for better responsiveness
            const resetDelay = this.isMobile ? 10 : 100;
            setTimeout(() => {
                this.resetTouchState();
            }, resetDelay);
        };
        
        // Bind mouse events with error handling
        console.log('🔗 Binding mouse event listeners to carousel-track');
        try {
            this.carouselTrack.addEventListener('mousedown', this.handleMouseDown, { passive: false });
            document.addEventListener('mousemove', this.handleMouseMove, { passive: false });
            document.addEventListener('mouseup', this.handleMouseUp, { passive: false });
            
            console.log('✅ All mouse events bound successfully');
        } catch (error) {
            console.error('❌ Failed to bind mouse events:', error);
        }
    }
    
    bindTouchEvents() {
        console.log('📱 bindTouchEvents called - setting up touch handlers');
        
        // Touch start
        this.handleTouchStart = (e) => {
            console.log('🚨 TOUCH START FIRED!', {
                touches: e.touches.length,
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                isAnimating: this.state.isAnimating,
                screenWidth: window.innerWidth,
                isNarrowMobile: this.isNarrowMobile,
                target: e.target.className,
                currentTarget: e.currentTarget.className
            });
            
            if (this.state.isAnimating) {
                console.log('⏸️ Touch start blocked - animation in progress');
                return;
            }
            
            const touch = e.touches[0];
            this.state.touchStartX = touch.clientX;
            this.state.touchStartY = touch.clientY;
            this.state.touchCurrentX = touch.clientX;
            this.state.touchCurrentY = touch.clientY;
            this.state.touchStartTime = Date.now();
            this.state.isDragging = false;
            this.state.hasMoved = false;
            this.state.startTransform = gsap.getProperty(this.carouselTrack, "x");
            
            // Add dragging class for visual feedback
            this.carouselTrack.classList.add('dragging');
            
            // Only prevent default on horizontal movement to allow vertical scrolling
            // Don't prevent default immediately - wait for movement direction
            console.log('✅ Touch start handled successfully');
        };
        
        // Touch move
        this.handleTouchMove = (e) => {
            if (!this.state.touchStartX) {
                console.log('⚠️ Touch move ignored - no touch start');
                return;
            }
            
            const touch = e.touches[0];
            this.state.touchCurrentX = touch.clientX;
            this.state.touchCurrentY = touch.clientY;
            
            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const deltaY = this.state.touchCurrentY - this.state.touchStartY;
            
            console.log('🚨 TOUCH MOVE FIRED!', {
                deltaX,
                deltaY,
                isDragging: this.state.isDragging,
                threshold: this.config.touchMoveThreshold,
                screenWidth: window.innerWidth,
                isNarrowMobile: this.isNarrowMobile,
                absX: Math.abs(deltaX),
                absY: Math.abs(deltaY)
            });
            
            // Check if this is a horizontal swipe (not vertical scroll)
            if (!this.state.isDragging) {
                if (Math.abs(deltaX) > this.config.touchMoveThreshold) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        console.log('🔄 Starting horizontal drag');
                        this.state.isDragging = true;
                        this.state.hasMoved = true;
                        this.state.hasEverMoved = true; // Mark permanent interaction
                        // Prevent page scrolling when we detect horizontal movement
                        e.preventDefault();
                    } else {
                        console.log('↕️ Vertical movement detected - allowing scroll');
                    }
                } else {
                    console.log('🔍 Movement below threshold');
                }
            }
            
            // If we're dragging horizontally, move the carousel
            if (this.state.isDragging) {
                e.preventDefault();
                
                // Apply drag with configurable resistance for smooth feel
                const dragDistance = deltaX * this.config.dragResistance;
                const newPosition = this.state.startTransform + dragDistance;
                
                console.log('🏃 Dragging carousel', {
                    dragDistance,
                    newPosition,
                    startTransform: this.state.startTransform
                });
                
                // Update position in real-time
                gsap.set(this.carouselTrack, { x: newPosition });
            }
        };
        
        // Touch end
        this.handleTouchEnd = (e) => {
            console.log('🚨 TOUCH END FIRED!', {
                touchStartX: this.state.touchStartX,
                isDragging: this.state.isDragging,
                hasMoved: this.state.hasMoved,
                screenWidth: window.innerWidth,
                isNarrowMobile: this.isNarrowMobile
            });
            
            if (!this.state.touchStartX) {
                console.log('⚠️ Touch end ignored - no touch start');
                return;
            }
            
            // Remove dragging class
            this.carouselTrack.classList.remove('dragging');
            
            const deltaX = this.state.touchCurrentX - this.state.touchStartX;
            const deltaTime = Date.now() - this.state.touchStartTime;
            const velocity = Math.abs(deltaX) / deltaTime; // pixels per ms
            
            // Determine if this was a swipe
            const isSwipe = Math.abs(deltaX) > this.config.swipeThreshold || 
                           velocity > this.config.swipeVelocityThreshold;
            
            console.log('📊 Swipe analysis', {
                deltaX,
                deltaTime,
                velocity,
                swipeThreshold: this.config.swipeThreshold,
                velocityThreshold: this.config.swipeVelocityThreshold,
                isSwipe,
                isDragging: this.state.isDragging
            });
            
            if (this.state.isDragging && isSwipe) {
                // Determine direction and trigger slide
                const direction = deltaX > 0 ? -1 : 1; // Swipe right = slide left (previous)
                console.log('🎯 Triggering slide in direction:', direction);
                this.slide(direction);
            } else if (this.state.isDragging) {
                // Snap back to current position if not enough swipe
                console.log('↩️ Snapping back to current position');
                this.snapToCurrentPosition();
            }
            
            // Reset touch state immediately on mobile for better responsiveness
            const resetDelay = this.isMobile ? 10 : 100;
            setTimeout(() => {
                this.resetTouchState();
            }, resetDelay);
        };
        
        // Create bound touch cancel handler for proper cleanup
        this.handleTouchCancel = (e) => {
            this.carouselTrack.classList.remove('dragging');
            if (this.state.isDragging) {
                this.snapToCurrentPosition();
            }
            this.resetTouchState();
        };
        
        // Bind touch events with error handling
        console.log('🔗 Binding touch event listeners to carousel-track', {
            trackElement: !!this.carouselTrack,
            screenWidth: window.innerWidth,
            isMobile: this.isMobile,
            isNarrowMobile: this.isNarrowMobile,
            trackClass: this.carouselTrack?.className
        });
        try {
            this.carouselTrack.addEventListener('touchstart', this.handleTouchStart, { passive: false });
            this.carouselTrack.addEventListener('touchmove', this.handleTouchMove, { passive: false });
            this.carouselTrack.addEventListener('touchend', this.handleTouchEnd, { passive: false });
            this.carouselTrack.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
            
            console.log('✅ All touch events bound successfully to:', this.carouselTrack.className);
        } catch (error) {
            console.error('❌ Failed to bind touch events:', error);
            // Fallback: try with passive listeners
            try {
                this.carouselTrack.addEventListener('touchstart', this.handleTouchStart, { passive: true });
                this.carouselTrack.addEventListener('touchmove', this.handleTouchMove, { passive: true });
                this.carouselTrack.addEventListener('touchend', this.handleTouchEnd, { passive: true });
                this.carouselTrack.addEventListener('touchcancel', this.handleTouchCancel, { passive: true });
                console.log('⚠️  Touch events bound with passive listeners (fallback)');
            } catch (fallbackError) {
                console.error('❌ Failed to bind touch events even with passive listeners:', fallbackError);
            }
        }
    }
    
    unbindTouchEvents() {
        if (this.handleTouchStart) {
            this.carouselTrack.removeEventListener('touchstart', this.handleTouchStart);
            this.carouselTrack.removeEventListener('touchmove', this.handleTouchMove);
            this.carouselTrack.removeEventListener('touchend', this.handleTouchEnd);
            this.carouselTrack.removeEventListener('touchcancel', this.handleTouchCancel);
        }
    }
    
    unbindMouseEvents() {
        if (this.handleMouseDown) {
            this.carouselTrack.removeEventListener('mousedown', this.handleMouseDown);
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    }
    
    resetTouchState() {
        // Clear any pending timeout to prevent race conditions
        if (this.touchResetTimeout) {
            clearTimeout(this.touchResetTimeout);
        }
        
        // Reset touch state immediately
        Object.assign(this.state, {
            touchStartX: 0,
            touchStartY: 0,
            touchCurrentX: 0,
            touchCurrentY: 0,
            touchStartTime: 0,
            isDragging: false,
            startTransform: 0
        });
        
        // Optimized delay for mobile responsiveness
        const hasMovedResetDelay = this.isMobile ? 20 : 50;
        this.touchResetTimeout = setTimeout(() => {
            this.state.hasMoved = false;
        }, hasMovedResetDelay);
    }
    
    // Enhanced mobile detection with comprehensive capability checking
    detectMobileCapabilities() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Basic mobile detection
        this.isMobile = width <= 768 || 'ontouchstart' in window;
        this.isNarrowMobile = width <= 480;
        
        // Enhanced detection for edge cases
        const isTouchDevice = 'ontouchstart' in window || 
                             navigator.maxTouchPoints > 0 || 
                             navigator.msMaxTouchPoints > 0;
        
        // Detect tablet in portrait vs mobile
        const isTablet = isTouchDevice && Math.min(width, height) >= 768;
        
        // Detect devices that might have both touch and pointer
        const hasPointer = window.matchMedia('(pointer: fine)').matches;
        const hasTouch = window.matchMedia('(pointer: coarse)').matches;
        
        // Store enhanced capabilities
        this.deviceCapabilities = {
            width,
            height,
            isTouchDevice,
            isTablet,
            hasPointer,
            hasTouch,
            aspectRatio: width / height,
            isLandscape: width > height
        };
        
        // Override mobile detection for hybrid devices
        if (hasPointer && hasTouch && !isTablet) {
            this.isMobile = true; // Treat hybrid as mobile for touch interactions
        }
    }
    
    // Debug logging for mobile detection
    logMobileDetection() {
        console.log('🔍 Enhanced Mobile Detection Debug:');
        console.log('   - Window dimensions:', `${this.deviceCapabilities.width}x${this.deviceCapabilities.height}`);
        console.log('   - Touch support:', this.deviceCapabilities.isTouchDevice);
        console.log('   - Has fine pointer:', this.deviceCapabilities.hasPointer);
        console.log('   - Has coarse pointer:', this.deviceCapabilities.hasTouch);
        console.log('   - Is tablet:', this.deviceCapabilities.isTablet);
        console.log('   - Is landscape:', this.deviceCapabilities.isLandscape);
        console.log('   - Final isMobile:', this.isMobile);
        console.log('   - Final isNarrowMobile:', this.isNarrowMobile);
        
        // Warn about potential issues
        if (this.deviceCapabilities.hasPointer && this.deviceCapabilities.hasTouch) {
            console.log('⚠️  Hybrid device detected - both touch and pointer available');
        }
        if (this.isMobile && this.deviceCapabilities.width > 768) {
            console.log('⚠️  Large mobile device detected - may need special handling');
        }
    }
    
    // Update arrow accessibility based on mobile state
    updateArrowAccessibility() {
        if (!this.leftArrow || !this.rightArrow) {
            console.log('Arrows not found, skipping accessibility updates');
            return;
        }
        
        if (this.isNarrowMobile) {
            // Hide arrows from screen readers on narrow mobile
            this.leftArrow.setAttribute('aria-hidden', 'true');
            this.rightArrow.setAttribute('aria-hidden', 'true');
            this.leftArrow.setAttribute('tabindex', '-1');
            this.rightArrow.setAttribute('tabindex', '-1');
        } else {
            // Make arrows accessible on larger screens
            this.leftArrow.removeAttribute('aria-hidden');
            this.rightArrow.removeAttribute('aria-hidden');
            this.leftArrow.removeAttribute('tabindex');
            this.rightArrow.removeAttribute('tabindex');
        }
    }
    
    snapToCurrentPosition() {
        // Smoothly return to the correct position
        const middleSetIndex = Math.floor(this.config.cloneMultiplier / 2);
        let baseOffset = -(middleSetIndex * this.state.tools.length * this.state.cardWidth);
        const currentOffset = -(this.state.currentIndex * this.state.cardWidth);
        let correctPosition = baseOffset + currentOffset;
        
        // CRITICAL FIX: On narrow mobile, ensure snap position is visible
        if (this.isNarrowMobile && this.state.cardWidth > 0) {
            const desiredFirstCardPosition = 8; // 8px from left edge
            const containerLeft = this.carouselTrack.parentElement.getBoundingClientRect().x;
            const baseOffset = desiredFirstCardPosition - containerLeft;
            
            // Calculate position for current card index
            correctPosition = baseOffset - (this.state.currentIndex * this.state.cardWidth);
            
            console.log('📱 Adjusted snap position for narrow mobile:', {
                currentIndex: this.state.currentIndex,
                baseOffset: baseOffset,
                cardWidth: this.state.cardWidth,
                finalPosition: correctPosition
            });
        }
        
        gsap.to(this.carouselTrack, {
            x: correctPosition,
            duration: this.config.animationDuration * 0.7, // Slightly faster snap back
            ease: "power2.out"
        });
    }
    
    slide(direction) {
        if (this.state.isAnimating) return;
        
        this.state.isAnimating = true;
        this.state.hasEverMoved = true; // Mark that user has interacted with carousel
        this.calculateDimensions(); // Recalculate in case of resize
        
        // Update logical index
        if (direction === 1) {
            this.state.currentIndex = (this.state.currentIndex + 1) % this.state.tools.length;
        } else {
            this.state.currentIndex = (this.state.currentIndex - 1 + this.state.tools.length) % this.state.tools.length;
        }
        
        // Get current position
        const currentTransform = gsap.getProperty(this.carouselTrack, "x");
        const newPosition = currentTransform - (direction * this.state.cardWidth);
        
        // Choose easing based on platform - more bounce on mobile feels native
        const easing = this.isMobile ? "power2.out" : "power2.out";
        
        // Animate to new position
        console.log('🎬 GSAP Animation:', {
            element: this.carouselTrack,
            fromX: currentTransform,
            toX: newPosition,
            duration: this.config.animationDuration,
            direction
        });
        
        gsap.to(this.carouselTrack, {
            x: newPosition,
            duration: this.config.animationDuration,
            ease: easing,
            onStart: () => {
                console.log('✅ GSAP animation started');
            },
            onComplete: () => {
                console.log('✅ GSAP animation completed, final x:', gsap.getProperty(this.carouselTrack, "x"));
                this.state.isAnimating = false;
                this.checkAndReposition();
            }
        });
    }
    
    checkAndReposition() {
        const currentX = gsap.getProperty(this.carouselTrack, "x");
        const totalWidth = this.config.cloneMultiplier * this.state.tools.length * this.state.cardWidth;
        const setWidth = this.state.tools.length * this.state.cardWidth;
        
        // If we've moved too far in either direction, jump to equivalent position
        const threshold = setWidth * 0.5; // Half a set width as threshold
        
        let newX = currentX;
        
        // Too far right (past first set)
        if (currentX > -threshold) {
            newX = currentX - setWidth;
        }
        // Too far left (past last set)
        else if (currentX < -(totalWidth - threshold)) {
            newX = currentX + setWidth;
        }
        
        // Instant reposition if needed (user won't notice)
        if (newX !== currentX) {
            gsap.set(this.carouselTrack, { x: newX });
        }
    }
    
    repositionAfterResize() {
        // Maintain current logical position after resize
        const middleSetIndex = Math.floor(this.config.cloneMultiplier / 2);
        const baseOffset = -(middleSetIndex * this.state.tools.length * this.state.cardWidth);
        const currentOffset = -(this.state.currentIndex * this.state.cardWidth);
        
        gsap.set(this.carouselTrack, { 
            x: baseOffset + currentOffset,
            force3D: true 
        });
    }
    
    hideSimilarToolsSection() {
        console.log('🙈 Request to hide similar tools section');
        
        // CRITICAL FIX: Always keep section visible on mobile to prevent disappearing issue
        const isMobileScreen = window.innerWidth <= 768; // Extended mobile range for better compatibility
        
        if (isMobileScreen) {
            console.log('📱 On mobile screen - keeping section visible with fallback message');
            if (this.similarToolsSection) {
                // Keep section visible but show appropriate message
                this.similarToolsSection.style.display = 'block';
                this.similarToolsSection.style.visibility = 'visible';
                const carousel = this.similarToolsSection.querySelector('.carousel');
                if (carousel) {
                    carousel.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; min-height: 120px; color: #666; padding: 1rem; text-align: center; font-size: 0.9rem;">Brak podobnych narzędzi do wyświetlenia</div>';
                }
            }
            return;
        }
        
        // On desktop, proceed with normal hiding
        if (this.similarToolsSection) {
            this.similarToolsSection.style.display = 'none';
            console.log('✅ Similar tools section hidden via style.display = none (desktop only)');
        } else {
            console.log('❌ Cannot hide - similar tools section not found');
        }
    }
    
    destroy() {
        // Clear any pending timeouts
        if (this.touchResetTimeout) {
            clearTimeout(this.touchResetTimeout);
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Clean up touch and mouse events
        this.unbindTouchEvents();
        this.unbindMouseEvents();
        
        // Clean up other event listeners using bound functions
        if (this.leftArrow && this.boundHandleLeftClick) {
            this.leftArrow.removeEventListener('click', this.boundHandleLeftClick);
        }
        if (this.rightArrow && this.boundHandleRightClick) {
            this.rightArrow.removeEventListener('click', this.boundHandleRightClick);
        }
        if (this.carouselTrack && this.boundHandleCardClick) {
            this.carouselTrack.removeEventListener('click', this.boundHandleCardClick);
        }
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
        }
        
        // Clear any ongoing animations
        if (this.carouselTrack) {
            gsap.killTweensOf(this.carouselTrack);
        }
        
        // Clear function references
        this.boundHandleLeftClick = null;
        this.boundHandleRightClick = null;
        this.boundHandleCardClick = null;
        this.boundHandleResize = null;
        this.handleTouchStart = null;
        this.handleTouchMove = null;
        this.handleTouchEnd = null;
        this.handleTouchCancel = null;
        this.handleMouseDown = null;
        this.handleMouseMove = null;
        this.handleMouseUp = null;
        
        console.log('Carousel destroyed with cleanup');
    }
}

// Initialize carousel with proper cleanup and mobile fallbacks
function initializeToolCarousel(toolCatalog) {
    console.log('🎠 Initializing tool carousel with', toolCatalog ? toolCatalog.length : 'no', 'categories');
    
    // Check if similar-tools section exists
    const similarToolsSection = document.getElementById('similar-tools');
    if (!similarToolsSection) {
        console.error('❌ #similar-tools section not found in DOM');
        return;
    } else {
        console.log('✅ #similar-tools section found');
    }
    
    // FORCE SECTION VISIBILITY ON ALL DEVICES
    console.log('🔧 Forcing carousel section visibility');
    similarToolsSection.style.display = 'block';
    similarToolsSection.style.visibility = 'visible';
    similarToolsSection.style.opacity = '1';
    similarToolsSection.style.minHeight = '200px';
    similarToolsSection.style.position = 'static';
    similarToolsSection.style.transform = 'none';
    
    // Debug section position and dimensions
    const rect = similarToolsSection.getBoundingClientRect();
    console.log('📐 Similar tools section dimensions:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
        visible: rect.height > 0 && rect.width > 0
    });
    
    // CRITICAL FIX: Always ensure section is visible first (especially on mobile)
    const isMobileScreen = window.innerWidth <= 768;
    if (isMobileScreen) {
        console.log('📱 Mobile screen detected - ensuring section visibility');
        similarToolsSection.style.display = 'block';
        similarToolsSection.style.visibility = 'visible';
        similarToolsSection.style.opacity = '1';
        
        // Also ensure carousel container exists and is visible
        const carouselContainer = similarToolsSection.querySelector('.carousel');
        if (carouselContainer) {
            carouselContainer.style.display = 'block';
            carouselContainer.style.visibility = 'visible';
            carouselContainer.style.opacity = '1';
        }
    }
    
    // Clean up existing carousel if present
    if (window.activeCarousel) {
        console.log('🔄 Cleaning up existing carousel');
        window.activeCarousel.destroy();
    }
    
    // Create new carousel instance with error handling
    try {
        console.log('🎯 Creating new ToolCarousel instance');
        window.activeCarousel = new ToolCarousel(toolCatalog);
        
        if (window.activeCarousel) {
            console.log('✅ ToolCarousel instance created successfully');
            
            // Debug DOM elements after successful creation
            setTimeout(() => {
                const h2 = similarToolsSection.querySelector('h2');
                const container = similarToolsSection.querySelector('.carousel-container');
                const carousel = similarToolsSection.querySelector('.carousel');
                const track = similarToolsSection.querySelector('.carousel-track');
                
                console.log('🔍 Post-creation DOM check:');
                console.log('  - H2:', h2 ? 'found' : 'NOT FOUND');
                console.log('  - Container:', container ? 'found' : 'NOT FOUND');
                console.log('  - Carousel:', carousel ? 'found' : 'NOT FOUND'); 
                console.log('  - Track:', track ? 'found' : 'NOT FOUND');
                
                if (track) {
                    console.log('  - Track children:', track.children.length);
                    const trackRect = track.getBoundingClientRect();
                    console.log('  - Track dimensions:', {
                        width: trackRect.width,
                        height: trackRect.height,
                        visible: trackRect.height > 0 && trackRect.width > 0
                    });
                }
            }, 100);
        } else {
            console.error('❌ Failed to create ToolCarousel instance');
        }
    } catch (error) {
        console.error('❌ ToolCarousel initialization threw error:', error);
        
        // CRITICAL FIX: Mobile fallback when carousel fails completely
        if (isMobileScreen) {
            console.log('📱 Mobile carousel fallback - keeping section visible');
            if (similarToolsSection) {
                const carousel = similarToolsSection.querySelector('.carousel');
                if (carousel) {
                    carousel.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; min-height: 120px; color: #666; padding: 1rem; text-align: center; font-size: 0.9rem;">Podobne narzędzia będą wkrótce dostępne</div>';
                }
            }
        }
    }
    
    // Setup cleanup on page unload
    const cleanup = () => {
        if (window.activeCarousel) {
            window.activeCarousel.destroy();
            window.activeCarousel = null;
        }
    };
    
    window.addEventListener('beforeunload', cleanup);
    
    // Store cleanup for external access
    if (!window.carouselCleanup) {
        window.carouselCleanup = [];
    }
    window.carouselCleanup.push(cleanup);
}

 