console.log('Skrypt załadowany!');

// Funkcja zapobiegająca polskim sierotkom
function fixPolishOrphans(text) {
    // Prosta zamiana spacji przed samotnym "i" na niełamliwą spację
    return text.replace(/\s+i\s+/g, '&nbsp;i ')
              .replace(/\s+i$/g, '&nbsp;i');
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
    } else {
        console.log('Router -> No match found for page.');
    }

    renderNavigationCategories(toolCatalog);
    initializeHamburger(); // To może zostać, jeśli zarządza tylko klasą 'active'
    initializeDropdown(toolCatalog);
    initializeThemeSwitcher();
    initializeMobileMenu(toolCatalog);
    initScrollAnimations();
    applyTypographyRules();

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
    const selectors = '.feature-card p, .tool-info-container p, .hero-section p';
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
    const backButtons = document.querySelectorAll('.mobile-menu-back');
    const submenuLinks = document.querySelectorAll('[data-submenu]');

    if (!hamburger || !overlay || !container) return;

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

    // Handle back button clicks
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanel = button.getAttribute('data-back');
            showMobileMenuPanel(targetPanel);
        });
    });

    // Handle submenu links
    submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPanel = link.getAttribute('data-submenu');
            if (targetPanel === 'tools-menu') {
                populateMobileMenuCategories(toolCatalog);
            }
            showMobileMenuPanel(targetPanel);
        });
    });

    function openMobileMenu() {
        hamburger.classList.add('active');
        overlay.classList.add('active');
        container.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset to main menu
        showMobileMenuPanel('main-menu', false);
    }

    function closeMobileMenu() {
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
        const panels = document.querySelectorAll('.mobile-menu-panel');
        panels.forEach(panel => {
            panel.classList.remove('active', 'sliding-out');
        });
        document.getElementById('main-menu-panel').classList.add('active');
    }
}

function populateMobileMenuCategories(toolCatalog) {
    const categoriesList = document.getElementById('tools-categories-list');
    if (!categoriesList) return;

    categoriesList.innerHTML = '';

    toolCatalog.forEach(category => {
        const listItem = document.createElement('li');
        listItem.className = 'mobile-menu-item';
        
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'mobile-menu-link has-submenu';
        link.innerHTML = category.category;
        link.setAttribute('data-category', category.category);
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            populateMobileMenuSubcategories(category);
            showMobileMenuPanel('category-menu');
        });
        
        listItem.appendChild(link);
        categoriesList.appendChild(listItem);
    });
}

function populateMobileMenuSubcategories(category) {
    const subcategoriesList = document.getElementById('category-subcategories-list');
    const categoryTitle = document.getElementById('category-menu-title');
    
    if (!subcategoriesList || !categoryTitle) return;

    categoryTitle.innerHTML = category.category;
    subcategoriesList.innerHTML = '';

    category.subcategories.forEach(subcategory => {
        const listItem = document.createElement('li');
        listItem.className = 'mobile-menu-item';
        
        const link = document.createElement('a');
        link.href = `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(subcategory.name)}`;
        link.className = 'mobile-menu-link';
        link.textContent = subcategory.name;
        
        listItem.appendChild(link);
        subcategoriesList.appendChild(listItem);
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

function renderNavigationCategories(toolCatalog) {
    const navContainer = document.getElementById('nav-categories');
    if (!navContainer) return;

    navContainer.innerHTML = ''; // Wyczyść kontener

    toolCatalog.forEach(category => {
        const link = document.createElement('a');
        link.href = `category.html?category=${encodeURIComponent(category.category)}`;
        link.innerHTML = category.category;
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
        titleWrapper.innerHTML = `<h3>${category.category}</h3>`;

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
    link.textContent = text;
    
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

    titleElement.innerHTML = category.category;
    
    // Breadcrumb rendering
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());

    const categorySpan = document.createElement('span');
    categorySpan.innerHTML = category.category;
    breadcrumbContainer.appendChild(categorySpan);

    // Page content
    contentGrid.innerHTML = '';
    category.subcategories.forEach(sub => {
        const cardLink = document.createElement('a');
        cardLink.href = `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(sub.name)}`;
        cardLink.className = 'subcategory-card'; 
        cardLink.innerHTML = `<h3>${sub.name}</h3>`;
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

    titleElement.textContent = subcategory.name;

    // Breadcrumb rendering
    breadcrumbContainer.innerHTML = '';
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.textContent = 'Strona główna';
    breadcrumbContainer.appendChild(homeLink);
    breadcrumbContainer.appendChild(createSeparator());
    
    const categorySiblings = toolCatalog.filter(c => c.category !== category.category);
    const categoryCrumb = createInteractiveBreadcrumb(category.category, `category.html?category=${encodeURIComponent(category.category)}`, categorySiblings, 'category');
    breadcrumbContainer.appendChild(categoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());

    const subcategorySpan = document.createElement('span');
    subcategorySpan.textContent = subcategory.name;
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
        titleWrapper.innerHTML = `<h3>${tool.name}</h3>`;

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
    const categoryCrumb = createInteractiveBreadcrumb(category.category, `category.html?category=${encodeURIComponent(category.category)}`, categorySiblings, 'category');
    breadcrumbContainer.appendChild(categoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());
    
    const subcategorySiblings = category.subcategories.filter(s => s.name !== subcategory.name);
    const subcategoryCrumb = createInteractiveBreadcrumb(subcategory.name, `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(subcategory.name)}`, subcategorySiblings, 'subcategory', category.category);
    breadcrumbContainer.appendChild(subcategoryCrumb);
    breadcrumbContainer.appendChild(createSeparator());

    const toolSpan = document.createElement('span');
    toolSpan.textContent = tool.name;
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
            ${category.category}
            <i class="fas fa-chevron-right" style="font-size: 0.8em;"></i>
        `;
        
        subDropdownContainer.appendChild(categoryLink);

        // Rozwijane menu z podkategoriami
        const subDropdownContent = document.createElement('div');
        subDropdownContent.className = 'sub-dropdown-content';
        
        category.subcategories.forEach(subcategory => {
            const subcategoryLink = document.createElement('a');
            subcategoryLink.href = `subcategory.html?category=${encodeURIComponent(category.category)}&subcategory=${encodeURIComponent(subcategory.name)}`;
            subcategoryLink.textContent = subcategory.name;
            subDropdownContent.appendChild(subcategoryLink);
        });

        if (category.subcategories.length > 0) {
            subDropdownContainer.appendChild(subDropdownContent);
        }

        navCategories.appendChild(subDropdownContainer);
    });
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
    // Znajdź wszystkie karty na stronie, które powinny być animowane
    const allCards = document.querySelectorAll('.feature-card, .category-card, .subcategory-card, .tool-card');
    const contactSection = document.querySelector('#contact');
    const heroSection = document.querySelector('.hero-section');

    // Dodaj klasę i ustaw stan początkowy (ukryty i przesunięty) dla wszystkich kart
    allCards.forEach(card => {
        card.classList.add('stagger-item');
        gsap.set(card, { opacity: 0, y: 20 });
    });

    if (contactSection) {
        contactSection.classList.add('scroll-reveal');
    }

    // Intersection Observer dla animacji
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;

                if (target.classList.contains('scroll-reveal')) {
                    // Animacja dla pojedynczych sekcji jak "Kontakt"
                    gsap.to(target, { opacity: 1, duration: 1.5, ease: 'power2.out' });
                    target.classList.add('revealed');
                } else {
                    // Animacja dla kontenerów z elementami .stagger-item
                    const items = target.querySelectorAll('.stagger-item');
                    gsap.to(items, {
                        opacity: 1,
                        y: 0,
                        duration: 1.2,
                        ease: 'power2.out',
                        stagger: 0 // Ustawiamy stagger na 0 dla synchronicznej animacji
                    });
                    items.forEach(item => item.classList.add('animate'));
                }
                
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    // Obserwuj wszystkie relevantne kontenery siatki na dowolnej stronie
    const gridsToObserve = document.querySelectorAll('.features-grid, #tools-grid, #subcategory-grid');
    
    gridsToObserve.forEach(grid => {
        if (grid) {
            observer.observe(grid);
        }
    });

    if (contactSection) {
        observer.observe(contactSection);
    }

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

// Dodaj obsługę sierótek do istniejącego kodu inicjalizacyjnego
// Będzie wywoływane po renderowaniu kart kategorii
function addPolishTypographyToCards() {
    // Opóźnienie dla pewności, że wszystkie elementy są już renderowane
    setTimeout(applyPolishTypography, 100);
} 