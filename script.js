document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appWu01VUobV0pbwS'; // Verifica ID Base Corretto!
    // !!! USA IL NUOVO TOKEN !!!
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b'; // !!! Ricorda di proteggere questo token in produzione
    const CONFIG_TABLE_NAME = 'Configurazione';
    const LINKS_TABLE_NAME = 'Links';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie'; // Nome Tabella Categorie
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli'; // Nome Tabella Articoli

    // Mappatura campi Airtable -> nomi chiave script
    const fieldMap = {
        config: {
            title: 'Titolo Pagina',
            titleSize: 'Dimensione Titolo',
            logoUrl: 'Logo',
            footerImageAlt: 'Alt Img Footer',
            footerImageUrl: 'Immagine Footer',
            backgroundUrl: 'Sfondo',
            showLoader: 'Mostra Loader',
            loaderText: 'Testo Loader',
            loaderBarColor: 'Colore Barra Loader',
            loaderTextSize: 'Dimensione Testo Loader',
            loaderWidth: 'Larghezza Loader',
            loaderBarSpeed: 'Velocità Barra Loader',
            buttonFontSize: 'Dimensione Font Pulsanti',
            buttonPadding: 'Padding Pulsanti',
            showCountdown: 'Mostra Countdown',
            countdownTarget: 'Data Target Countdown',
            countdownLabel: 'Etichetta Countdown',
            linkedLinks: 'Link Attivi', // Link ai Links da mostrare
            // Assicurati che esista un campo Link alla Configurazione nelle altre tabelle
            // e che il nome sia consistente se usato nei filtri
            configurazione: 'Configurazione' // Nome del campo link nelle tabelle Links, Menu_Categorie, Menu_Articoli
        },
        links: {
            label: 'Etichetta',
            url: 'Scrivi URL',
            color: 'Scrivi Colore Pulsante'
            // Non serve 'Configurazione' qui perché filtriamo per ID da config.linkedLinks
        },
        menuCategorie: {
            nome: 'Nome Categoria',
            ordine: 'Ordine Visualizzazione',
            attivo: 'Stato Attivo', // Usato nel filtro API
            configurazione: 'Configurazione' // Usato nel filtro API
        },
        menuArticoli: {
            nome: 'Nome Articolo',
            prezzo: 'Prezzo',
            descrizione: 'Descrizione',
            categoria: 'Categoria', // Link a Menu_Categorie
            attivo: 'Stato Attivo', // Usato nel filtro API
            configurazione: 'Configurazione' // Usato nel filtro API
        }
    };

    // Colore default pulsante (da aggiornare con il nuovo stile)
    const defaultButtonColor = 'linear-gradient(45deg, #ccc, #eee)'; // Esempio grigio

    // --- Elementi DOM ---
    const titleElement = document.getElementById('page-title');
    const logoContainer = document.getElementById('logo-container');
    const linkContainer = document.getElementById('link-container');
    const loadingMessage = document.getElementById('loading-message');
    const loader = document.getElementById('loader');
    const loaderTextElement = document.getElementById('loading-text-container');
    const loaderBarElement = loader ? loader.querySelector('.loader-bar') : null;
    const footerImageContainer = document.getElementById('footer-image-container');
    // Countdown
    const countdownContainer = document.getElementById('countdown-container');
    const countdownLabelElement = document.getElementById('countdown-label');
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const countdownMessageElement = document.getElementById('countdown-message');
    let countdownIntervalId = null;
    // Menu
    const menuSection = document.getElementById('menu-section');
    const menuContent = document.getElementById('menu-content');

    // Variabile per memorizzare i dati del menu elaborati
    let processedMenuData = null;
    let isMenuRendered = false; // Flag per ottimizzazione rendering (opzionale)

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => {
        // Verifica se fields esiste prima di accedere
        if (!fields) return defaultValue;
        return (fields[fieldName] !== undefined && fields[fieldName] !== null && fields[fieldName] !== '')
               ? fields[fieldName]
               : defaultValue;
    };
    const getAttachmentUrl = (fields, fieldName) => {
        const attachments = getField(fields, fieldName);
        if (Array.isArray(attachments) && attachments.length > 0) {
            const firstAttachment = attachments[0];
            if (firstAttachment.thumbnails && firstAttachment.thumbnails.large) {
                return firstAttachment.thumbnails.large.url;
            }
            return firstAttachment.url;
        }
        return null;
    };

    // --- Funzioni Menu ---
    function toggleMenu() {
        if (!menuSection) {
            console.error("Elemento #menu-section non trovato.");
            return;
        }
        const isMenuVisible = menuSection.style.display === 'block';

        if (isMenuVisible) {
            menuSection.style.display = 'none';
        } else {
            menuSection.style.display = 'block';
            // Renderizza se ci sono dati (forza il re-render per semplicità ora)
            if (processedMenuData) {
                renderMenu(processedMenuData);
                isMenuRendered = true; // Imposta flag dopo il rendering
                menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                if (menuContent) {
                    menuContent.innerHTML = '<p class="error-message">Dati del menu non ancora disponibili o errore nel caricamento.</p>';
                }
                console.warn("ToggleMenu: Dati menu non pronti.");
            }
        }
    }

    function renderMenu(menuData) {
        if (!menuContent) return;
        if (!menuData || menuData.length === 0) {
             menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>';
             return;
        }

        let menuHTML = '';
        menuData.forEach(category => {
            if (!category.items || category.items.length === 0) return; // Salta categorie vuote

            menuHTML += `
                <div class="menu-category">
                    <h3 class="category-title" tabindex="0">${category.name}</h3>
                    <ul class="item-list" style="max-height: 0; overflow: hidden;">
            `; // tabindex="0" per accessibilità tastiera

            category.items.forEach(item => {
                let formattedPrice = '';
                if (typeof item.price === 'number') {
                    formattedPrice = `€${item.price.toFixed(2)}`;
                } else if (typeof item.price === 'string') {
                    formattedPrice = item.price; // Usa il formato currency di Airtable
                }

                menuHTML += `
                    <li class="menu-item">
                        <div class="item-details">
                           <span class="item-name">${item.name}</span>
                            ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                        </div>
                        ${formattedPrice ? `<span class="item-price">${formattedPrice}</span>` : ''}
                    </li>
                `;
            });

            menuHTML += `
                    </ul>
                </div>
            `;
        });

        menuContent.innerHTML = menuHTML;
        addAccordionListeners();
        console.log("Menu renderizzato.");
    }

    function addAccordionListeners() {
        const categoryTitles = menuContent.querySelectorAll('.category-title');
        categoryTitles.forEach(title => {
            // Gestione Click
            title.addEventListener('click', () => toggleCategory(title));
            // Gestione Tastiera (Invio/Spazio)
            title.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); // Impedisce scroll pagina con Spazio
                    toggleCategory(title);
                }
            });
        });
    }

    function toggleCategory(titleElement) {
        const categoryDiv = titleElement.parentElement;
        const itemList = titleElement.nextElementSibling;
        const isOpen = categoryDiv.classList.contains('category-open');

        // Chiudi tutte le altre categorie (se vuoi comportamento accordion classico)
        // menuContent.querySelectorAll('.menu-category.category-open').forEach(openCategory => {
        //     if (openCategory !== categoryDiv) {
        //         openCategory.classList.remove('category-open');
        //         openCategory.querySelector('.item-list').style.maxHeight = '0';
        //     }
        // });

        if (isOpen) {
            categoryDiv.classList.remove('category-open');
            itemList.style.maxHeight = '0';
        } else {
            categoryDiv.classList.add('category-open');
            itemList.style.maxHeight = itemList.scrollHeight + 'px';
        }
    }

    // --- Funzione Principale di Caricamento ---
    async function loadData() {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (linkContainer) linkContainer.innerHTML = '';
        processedMenuData = null;
        isMenuRendered = false;
        if (menuContent) menuContent.innerHTML = '<p>Caricamento menu...</p>';
        if (menuSection) menuSection.style.display = 'none';

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };

            // 1. Recupera Configurazione
            const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
            console.log("Fetch Config:", configUrl);
            const configResponse = await fetch(configUrl, { headers });
            if (!configResponse.ok) throw new Error(`API Config Error: ${configResponse.status} ${await configResponse.text()}`);
            const configResult = await configResponse.json();
            if (!configResult.records || configResult.records.length === 0) throw new Error("No config record found.");
            const configRecord = configResult.records[0];
            const configFields = configRecord.fields;
            const configRecordId = configRecord.id;
            console.log("Config Data:", configFields, "ID:", configRecordId);

            // 2. Recupera Links Collegati
            const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
            let linksData = [];
            let linksFieldsById = {};
            if (linkedLinkIds.length > 0) {
                const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
                 // Il filtro basato su `linkedLinkIds` è sufficiente se il campo `Configurazione` nei Link è corretto
                 const filterFormulaLinks = `OR(${recordIdFilter})`;
                const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaLinks)}`;
                console.log("Fetch Links:", linksUrl);
                const linksResponse = await fetch(linksUrl, { headers });
                if (!linksResponse.ok) console.warn(`API Links Warning: ${linksResponse.status} ${await linksResponse.text()}`); // Non bloccare tutto se i link falliscono? O sì?
                else {
                    const linksResult = await linksResponse.json();
                    console.log("Links Data Raw:", linksResult.records);
                    if (linksResult.records) {
                        linksResult.records.forEach(linkRecord => {
                            linksFieldsById[linkRecord.id] = {
                                id: linkRecord.id,
                                label: getField(linkRecord.fields, fieldMap.links.label, 'Link'),
                                url: getField(linkRecord.fields, fieldMap.links.url),
                                color: getField(linkRecord.fields, fieldMap.links.color, defaultButtonColor)
                            };
                        });
                    }
                }
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // 3. Recupera Categorie Menu
            let menuCategoriesData = [];
            const filterFormulaCategories = `AND({${fieldMap.menuCategorie.attivo}}=1, {${fieldMap.menuCategorie.configurazione}}='${configRecordId}')`;
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategories)}&${sortOrder}`;
            console.log("Fetch Categories:", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (!categoriesResponse.ok) console.warn(`API Categories Warning: ${categoriesResponse.status} ${await categoriesResponse.text()}`);
            else {
                const categoriesResult = await categoriesResponse.json();
                menuCategoriesData = categoriesResult.records || [];
                console.log("Categories Data Raw:", menuCategoriesData);
            }

             // 4. Recupera Articoli Menu
            let menuItemsData = [];
            const filterFormulaItems = `AND({${fieldMap.menuArticoli.attivo}}=1, {${fieldMap.menuArticoli.configurazione}}='${configRecordId}')`;
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items:", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (!itemsResponse.ok) console.warn(`API Items Warning: ${itemsResponse.status} ${await itemsResponse.text()}`);
             else {
                const itemsResult = await itemsResponse.json();
                menuItemsData = itemsResult.records || [];
                console.log("Items Data Raw:", menuItemsData);
            }

            // 5. Elabora Dati Menu (solo se le categorie sono state caricate)
            if (menuCategoriesData.length > 0) {
                processedMenuData = menuCategoriesData.map(categoryRecord => {
                    const categoryId = categoryRecord.id;
                    const items = menuItemsData
                        .filter(itemRecord => getField(itemRecord.fields, fieldMap.menuArticoli.categoria, [])[0] === categoryId)
                        .map(itemRecord => ({
                            id: itemRecord.id,
                            name: getField(itemRecord.fields, fieldMap.menuArticoli.nome, '?'),
                            price: getField(itemRecord.fields, fieldMap.menuArticoli.prezzo),
                            description: getField(itemRecord.fields, fieldMap.menuArticoli.descrizione, '')
                        }));

                    return {
                        id: categoryId,
                        name: getField(categoryRecord.fields, fieldMap.menuCategorie.nome, '?'),
                        items: items
                    };
                }).filter(category => category.items.length > 0); // Filtra categorie vuote
                console.log("Menu Data Processed:", processedMenuData);
            } else {
                 console.log("Nessuna categoria attiva trovata o errore nel caricamento categorie.");
                 processedMenuData = []; // Assicura sia un array vuoto
            }


            // --- Applica Configurazione Visiva ---

            // Sfondo
            const backgroundUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl);
            if (backgroundUrl) {
                document.body.style.backgroundImage = `url('${backgroundUrl}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
            } else {
                document.body.style.backgroundImage = 'none';
            }

            // Titolo
            const pageTitle = getField(configFields, fieldMap.config.title, 'Menu');
            document.title = pageTitle;
            if (titleElement) {
                titleElement.textContent = pageTitle;
                const titleSize = getField(configFields, fieldMap.config.titleSize);
                if (titleSize) titleElement.style.fontSize = titleSize; else titleElement.style.fontSize = '';
            }

            // Countdown Timer
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            const showCountdown = getField(configFields, fieldMap.config.showCountdown, false);
            const countdownTargetStr = getField(configFields, fieldMap.config.countdownTarget);
            const countdownLabel = getField(configFields, fieldMap.config.countdownLabel, '');
            if (countdownContainer && showCountdown === true && countdownTargetStr) {
                const targetDate = new Date(countdownTargetStr);
                if (!isNaN(targetDate)) {
                    if (countdownLabelElement) countdownLabelElement.textContent = countdownLabel;
                    const updateCountdown = () => { /* ... (logica update) ... */ };
                    updateCountdown();
                    countdownIntervalId = setInterval(updateCountdown, 1000);
                     countdownContainer.style.display = 'block'; // Mostra se attivo
                } else {
                    if (countdownContainer) countdownContainer.style.display = 'none';
                }
            } else {
                if (countdownContainer) countdownContainer.style.display = 'none';
            }

            // Loader
            const showLoader = getField(configFields, fieldMap.config.showLoader, false);
            if (loader) {
                 if (showLoader === true) {
                     loader.style.display = 'flex';
                     // ... (altri stili loader) ...
                 } else {
                    loader.style.display = 'none';
                 }
            }

            // Logo
            const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl);
            logoContainer.innerHTML = '';
            if (logoUrl) { /* ... (crea logo) ... */ }

            // Pulsanti Link (Gestione #menu)
            linkContainer.innerHTML = '';
            if (linksData && linksData.length > 0) {
                const buttonFontSize = getField(configFields, fieldMap.config.buttonFontSize);
                const buttonPadding = getField(configFields, fieldMap.config.buttonPadding);

                linksData.forEach(link => {
                    if (link.url === '#menu') {
                        const button = document.createElement('button');
                        button.textContent = link.label;
                        button.className = 'link-button menu-toggle-button';
                        button.type = 'button';
                        button.style.background = link.color || defaultButtonColor;
                        if (buttonFontSize) button.style.fontSize = buttonFontSize;
                        if (buttonPadding) button.style.padding = buttonPadding;
                        button.addEventListener('click', toggleMenu);
                        linkContainer.appendChild(button);
                    } else if (link.url) {
                        const button = document.createElement('a');
                        button.href = link.url;
                        button.textContent = link.label;
                        button.className = 'link-button';
                        button.target = '_blank';
                        button.rel = 'noopener noreferrer';
                        button.style.background = link.color || defaultButtonColor;
                        if (buttonFontSize) button.style.fontSize = buttonFontSize;
                        if (buttonPadding) button.style.padding = buttonPadding;
                        linkContainer.appendChild(button);
                    } else {
                        console.warn(`Link '${link.label}' skipped (no URL or not #menu).`);
                    }
                });
            } else {
                linkContainer.innerHTML = '<p>Nessun link attivo.</p>';
            }

            // Immagine Footer
            const footerImageUrl = getAttachmentUrl(configFields, fieldMap.config.footerImageUrl);
            if (footerImageContainer) { /* ... (logica immagine footer) ... */ }

            // Nascondi Messaggio Caricamento principale
            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('FATAL ERROR loading data:', error);
            if (linkContainer) linkContainer.innerHTML = `<p class="error-message">Impossibile caricare i dati: ${error.message}</p>`;
            if (titleElement) titleElement.textContent = 'Errore'; document.title = 'Errore';
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (loader) loader.style.display = 'none';
            if (menuSection) menuSection.style.display = 'none';
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            if (countdownContainer) countdownContainer.style.display = 'none';
            document.body.classList.add('error-page');
        }
    }

    // Carica i dati all'avvio
    loadData();
});