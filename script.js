document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF'; // ID Base Corretto
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b'; // Token Corretto
    const CONFIG_TABLE_NAME = 'Configurazione';
    const LINKS_TABLE_NAME = 'Links';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie';
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';

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
            linkedLinks: 'Link Attivi',
            configurazione: 'Configurazione' // Assumendo che questo sia il nome del campo link nelle altre tabelle
        },
        links: {
            label: 'Etichetta',
            url: 'Scrivi URL',
            color: 'Scrivi Colore Pulsante'
        },
        menuCategorie: {
            nome: 'Nome Categoria',
            ordine: 'Ordine Visualizzazione',
            attivo: 'Stato Attivo',
            configurazione: 'Configurazione' // Nome campo per filtro originale
        },
        menuArticoli: {
            nome: 'Nome Articolo',
            prezzo: 'Prezzo',
            descrizione: 'Descrizione',
            categoria: 'Categoria',
            attivo: 'Stato Attivo',
            configurazione: 'Configurazione' // Nome campo per filtro originale
        }
    };

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
    const countdownContainer = document.getElementById('countdown-container');
    const countdownLabelElement = document.getElementById('countdown-label');
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const countdownMessageElement = document.getElementById('countdown-message');
    let countdownIntervalId = null;
    const menuSection = document.getElementById('menu-section');
    const menuContent = document.getElementById('menu-content');

    let processedMenuData = null;
    let isMenuRendered = false;

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => {
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
        if (!menuSection) { console.error("#menu-section non trovato."); return; }
        const isMenuVisible = menuSection.style.display === 'block';
        if (isMenuVisible) {
            menuSection.style.display = 'none';
        } else {
            menuSection.style.display = 'block';
            if (processedMenuData) {
                renderMenu(processedMenuData);
                isMenuRendered = true;
                menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                if (menuContent) { menuContent.innerHTML = '<p class="error-message">Dati del menu non disponibili.</p>'; }
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
            if (!category.items || category.items.length === 0) return;
            menuHTML += `<div class="menu-category"><h3 class="category-title" tabindex="0">${category.name}</h3><ul class="item-list" style="max-height: 0; overflow: hidden;">`;
            category.items.forEach(item => {
                let formattedPrice = '';
                if (typeof item.price === 'number') { formattedPrice = `€${item.price.toFixed(2)}`; }
                else if (typeof item.price === 'string') { formattedPrice = item.price; }
                menuHTML += `<li class="menu-item"><div class="item-details"><span class="item-name">${item.name}</span>${item.description ? `<p class="item-description">${item.description}</p>` : ''}</div>${formattedPrice ? `<span class="item-price">${formattedPrice}</span>` : ''}</li>`;
            });
            menuHTML += `</ul></div>`;
        });
        menuContent.innerHTML = menuHTML;
        addAccordionListeners();
        console.log("Menu renderizzato.");
    }

    function addAccordionListeners() {
        const categoryTitles = menuContent.querySelectorAll('.category-title');
        categoryTitles.forEach(title => {
            title.addEventListener('click', () => toggleCategory(title));
            title.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCategory(title); } });
        });
    }

    function toggleCategory(titleElement) {
        const categoryDiv = titleElement.parentElement;
        const itemList = titleElement.nextElementSibling;
        const isOpen = categoryDiv.classList.contains('category-open');
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
        processedMenuData = null; isMenuRendered = false;
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
            const configRecordId = configRecord.id; // ID Config Principale
            console.log("Config Data:", configFields, "ID:", configRecordId);

            // 2. Recupera Links Collegati
            const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
            let linksData = []; let linksFieldsById = {};
            if (linkedLinkIds.length > 0) {
                const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
                const filterFormulaLinks = `OR(${recordIdFilter})`;
                const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaLinks)}`;
                console.log("Fetch Links:", linksUrl);
                const linksResponse = await fetch(linksUrl, { headers });
                if (linksResponse.ok) {
                    const linksResult = await linksResponse.json();
                    console.log("Links Data Raw:", linksResult.records);
                    if (linksResult.records) { linksResult.records.forEach(rec => { linksFieldsById[rec.id] = { id: rec.id, label: getField(rec.fields, fieldMap.links.label, '?'), url: getField(rec.fields, fieldMap.links.url), color: getField(rec.fields, fieldMap.links.color, defaultButtonColor) }; }); }
                } else { console.warn(`API Links Warning: ${linksResponse.status}`); }
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // 3. Recupera Categorie Menu
            let menuCategoriesData = [];
            // *** MODIFICA TEMPORANEA PER TEST ***
            const filterFormulaCategories = `{${fieldMap.menuCategorie.attivo}}=1`; // Prende TUTTE le categorie attive
            // const filterFormulaCategories = `AND({${fieldMap.menuCategorie.attivo}}=1, {${fieldMap.menuCategorie.configurazione}}='${configRecordId}')`; // FORMULA ORIGINALE
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategories)}&${sortOrder}`;
            console.log("Fetch Categories:", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) {
                const categoriesResult = await categoriesResponse.json();
                menuCategoriesData = categoriesResult.records || [];
                console.log("Categories Data Raw:", menuCategoriesData);
            } else { console.warn(`API Categories Warning: ${categoriesResponse.status}`); }

            // 4. Recupera Articoli Menu
            let menuItemsData = [];
            // *** MODIFICA TEMPORANEA PER TEST ***
            const filterFormulaItems = `{${fieldMap.menuArticoli.attivo}}=1`; // Prende TUTTI gli articoli attivi
            // const filterFormulaItems = `AND({${fieldMap.menuArticoli.attivo}}=1, {${fieldMap.menuArticoli.configurazione}}='${configRecordId}')`; // FORMULA ORIGINALE
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items:", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) {
                const itemsResult = await itemsResponse.json();
                menuItemsData = itemsResult.records || [];
                console.log("Items Data Raw:", menuItemsData);
             } else { console.warn(`API Items Warning: ${itemsResponse.status}`); }

            // 5. Elabora Dati Menu
            // Questa logica ora processerà TUTTE le categorie attive e TUTTI gli articoli attivi trovati
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
                    return { id: categoryId, name: getField(categoryRecord.fields, fieldMap.menuCategorie.nome, '?'), items: items };
                }).filter(category => category.items.length > 0);
                console.log("Menu Data Processed:", processedMenuData);
            } else {
                 console.log("Nessuna categoria attiva trovata (con filtro semplificato).");
                 processedMenuData = [];
            }

            // --- Applica Configurazione Visiva ---
            // (Sfondo, Titolo, Countdown, Loader, Logo - codice omesso per brevità, è invariato)
             const backgroundUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl); if (backgroundUrl) { document.body.style.backgroundImage = `url('${backgroundUrl}')`; document.body.style.backgroundSize = 'cover'; document.body.style.backgroundPosition = 'center center'; document.body.style.backgroundRepeat = 'no-repeat'; document.body.style.backgroundAttachment = 'fixed';} else { document.body.style.backgroundImage = 'none'; }
             const pageTitle = getField(configFields, fieldMap.config.title, 'Menu'); document.title = pageTitle; if (titleElement) { titleElement.textContent = pageTitle; const ts = getField(configFields, fieldMap.config.titleSize); if(ts) titleElement.style.fontSize = ts; else titleElement.style.fontSize = ''; }
             if (countdownIntervalId) clearInterval(countdownIntervalId); const showCD = getField(configFields, fieldMap.config.showCountdown, false); const cdTarget = getField(configFields, fieldMap.config.countdownTarget); const cdLabel = getField(configFields, fieldMap.config.countdownLabel, ''); if (countdownContainer && showCD === true && cdTarget) { const td = new Date(cdTarget); if(!isNaN(td)){ if(countdownLabelElement) countdownLabelElement.textContent = cdLabel; const updateCD = ()=>{}; updateCD(); countdownIntervalId = setInterval(updateCD, 1000); countdownContainer.style.display = 'block';} else {if(countdownContainer) countdownContainer.style.display = 'none';}} else {if(countdownContainer) countdownContainer.style.display = 'none';}
             const showL = getField(configFields, fieldMap.config.showLoader, false); if (loader) { if(showL){ loader.style.display = 'flex';} else { loader.style.display = 'none';}}
             const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl); logoContainer.innerHTML = ''; if (logoUrl) { const logoImg = document.createElement('img'); logoImg.src = logoUrl; logoImg.alt = 'Logo'; logoContainer.appendChild(logoImg); }

            // Pulsanti Link
            linkContainer.innerHTML = '';
            if (linksData && linksData.length > 0) {
                const btnFs = getField(configFields, fieldMap.config.buttonFontSize); const btnPad = getField(configFields, fieldMap.config.buttonPadding);
                linksData.forEach(link => {
                    if (link.url === '#menu') {
                        const btn = document.createElement('button'); btn.textContent = link.label; btn.className = 'link-button menu-toggle-button'; btn.type = 'button'; btn.style.background = link.color || defaultButtonColor; if(btnFs) btn.style.fontSize = btnFs; if(btnPad) btn.style.padding = btnPad; btn.addEventListener('click', toggleMenu); linkContainer.appendChild(btn);
                    } else if (link.url) {
                        const a = document.createElement('a'); a.href = link.url; a.textContent = link.label; a.className = 'link-button'; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.background = link.color || defaultButtonColor; if(btnFs) a.style.fontSize = btnFs; if(btnPad) a.style.padding = btnPad; linkContainer.appendChild(a);
                    } else { console.warn(`Link '${link.label}' skipped.`); }
                });
            } else { linkContainer.innerHTML = '<p>Nessun link attivo.</p>'; }

            // Immagine Footer
             const footerImageUrl = getAttachmentUrl(configFields, fieldMap.config.footerImageUrl); if (footerImageContainer) { footerImageContainer.innerHTML = ''; if(footerImageUrl){ const fImg=document.createElement('img'); fImg.src=footerImageUrl; fImg.alt=getField(configFields, fieldMap.config.footerImageAlt, ''); footerImageContainer.appendChild(fImg);}}

            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('FATAL ERROR loading data:', error);
             if (linkContainer) linkContainer.innerHTML = `<p class="error-message">Impossibile caricare i dati: ${error.message}</p>`;
             if (titleElement) titleElement.textContent = 'Errore'; document.title = 'Errore';
             if (loadingMessage) loadingMessage.style.display = 'none'; if (loader) loader.style.display = 'none'; if (menuSection) menuSection.style.display = 'none'; if (countdownIntervalId) clearInterval(countdownIntervalId); if (countdownContainer) countdownContainer.style.display = 'none'; document.body.classList.add('error-page');
        }
    }

    // Carica i dati all'avvio
    loadData();
});
