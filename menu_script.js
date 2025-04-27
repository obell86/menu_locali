document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF'; // ID Base Confermato
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b'; // Token Confermato
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie'; // Nome Tabella Categorie (Verifica Esattezza)
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';   // Nome Tabella Articoli (Verifica Esattezza)

    // Mappatura campi Menu
    const fieldMap = {
        menuCategorie: {
            nome: 'Nome Categoria',           // Verifica Esattezza
            ordine: 'Ordine Visualizzazione', // Verifica Esattezza
            attivo: 'Stato Attivo',           // Verifica Esattezza
            configurazione: 'Configurazione'  // Verifica Esattezza
        },
        menuArticoli: {
            nome: 'Nome Articolo',            // Verifica Esattezza
            prezzo: 'Prezzo',                 // Verifica Esattezza
            descrizione: 'Descrizione',       // Verifica Esattezza
            categoria: 'Categoria',           // Verifica Esattezza (Link a Menu_Categorie)
            attivo: 'Stato Attivo',           // Verifica Esattezza
            configurazione: 'Configurazione'  // Verifica Esattezza (Link a Configurazione)
        }
    };

    // --- Elementi DOM ---
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => {
        if (!fields) return defaultValue;
        const value = fields[fieldName]; // Usa variabile per chiarezza
        // Controlla specificamente per undefined, null o stringa vuota
        return (value !== undefined && value !== null && value !== '')
               ? value
               : defaultValue;
    };

    // --- Funzioni Menu ---
    function renderMenu(menuData) {
        if (!menuContent) { console.error("Errore: Elemento #menu-content non trovato."); return; }
        if (!menuData || menuData.length === 0) {
             menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>';
             console.log("renderMenu: Nessun dato valido ricevuto per la visualizzazione.");
             return;
        }
        let menuHTML = '';
        menuData.forEach(category => {
            if (!category.items || category.items.length === 0) return; // Salta categorie senza articoli abbinati

            menuHTML += `<div class="menu-category">`;
            menuHTML += `<h3 class="category-title" tabindex="0">${getField(category, 'name', 'Categoria Errata')}</h3>`; // Usa getField per sicurezza
            menuHTML += `<ul class="item-list" style="max-height: 0; overflow: hidden;">`;

            category.items.forEach(item => {
                let formattedPrice = '';
                const priceValue = getField(item, 'price'); // Usa getField
                if (typeof priceValue === 'number') { formattedPrice = `€${priceValue.toFixed(2)}`; }
                else if (typeof priceValue === 'string') { formattedPrice = priceValue; }

                menuHTML += `<li class="menu-item">`;
                menuHTML += `<div class="item-details">`;
                menuHTML += `<span class="item-name">${getField(item, 'name', 'Articolo Errato')}</span>`; // Usa getField
                const description = getField(item, 'description'); // Usa getField
                if(description) { menuHTML += `<p class="item-description">${description}</p>`; }
                menuHTML += `</div>`;
                if(formattedPrice) { menuHTML += `<span class="item-price">${formattedPrice}</span>`; }
                menuHTML += `</li>`;
            });
            menuHTML += `</ul>`;
            menuHTML += `</div>`;
        });
        menuContent.innerHTML = menuHTML;
        addAccordionListeners();
        console.log("Menu renderizzato (menu.html).");
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
        if (!itemList || itemList.tagName !== 'UL') { console.error("Struttura HTML errata: UL non trovato dopo H3."); return; } // Controllo aggiuntivo
        const isOpen = categoryDiv.classList.contains('category-open');
        if (isOpen) { categoryDiv.classList.remove('category-open'); itemList.style.maxHeight = '0'; }
        else { categoryDiv.classList.add('category-open'); itemList.style.maxHeight = itemList.scrollHeight + 'px'; }
    }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        // ====> !!! VERIFICA CHE QUESTO SIA L'ID CORRETTO DEL TUO RECORD 'Configurazione Principale' !!! <====
        const configRecordId = 'recowUo9ecB5zLSSm'; // ID Config Principale dai log precedenti
        // ====================================================================================================

        if (!configRecordId) {
             console.error("ID Configurazione MANCANTE/errato in menu_script.js!");
             if (menuContent) menuContent.innerHTML = '<p class="error-message">Errore: Configurazione ID non specificata correttamente nello script.</p>';
             if (menuLoadingMessage) menuLoadingMessage.style.display = 'none'; return;
        }

        // Verifica nomi campo filtro
        const catAttivoField = fieldMap.menuCategorie.attivo;
        const catConfigField = fieldMap.menuCategorie.configurazione;
        const itemAttivoField = fieldMap.menuArticoli.attivo;
        const itemConfigField = fieldMap.menuArticoli.configurazione;
        const catCategoriaField = fieldMap.menuArticoli.categoria; // Nome campo link categoria in Articoli
        console.log(`NOMI CAMPO USATI: Categoria[Attivo='${catAttivoField}', Config='${catConfigField}'], Articolo[Attivo='${itemAttivoField}', Config='${itemConfigField}', CategoriaLink='${catCategoriaField}']`);

        // Verifica che i nomi campo esistano nel fieldMap
        if (!catAttivoField || !catConfigField || !itemAttivoField || !itemConfigField || !catCategoriaField) {
             console.error("Errore nel fieldMap: uno o più nomi campo essenziali mancano!");
             if (menuContent) menuContent.innerHTML = `<p class="error-message">Errore: Configurazione fieldMap nello script.</p>`;
             if (menuLoadingMessage) menuLoadingMessage.style.display = 'none'; return;
        }

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let menuCategoriesData = []; let menuItemsData = [];

            // 1. Recupera Categorie Menu (Filtrate)
            const filterFormulaCategories = `AND({${catAttivoField}}=1, {${catConfigField}}='${configRecordId}')`;
            console.log("Filtro Categorie INVIATO:", filterFormulaCategories);
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategories)}&${sortOrder}`;
            console.log("Fetch Categories (menu.html):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) {
                 const categoriesResult = await categoriesResponse.json(); menuCategoriesData = categoriesResult.records || []; console.log("Categories Data Raw (menu.html):", menuCategoriesData);
            } else { throw new Error(`API Categorie: ${categoriesResponse.status} ${await categoriesResponse.text()}`); }

            // 2. Recupera Articoli Menu (Filtrati)
            const filterFormulaItems = `AND({${itemAttivoField}}=1, {${itemConfigField}}='${configRecordId}')`;
            console.log("Filtro Articoli INVIATO:", filterFormulaItems);
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items (menu.html):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) {
                 const itemsResult = await itemsResponse.json(); menuItemsData = itemsResult.records || []; console.log("Items Data Raw (menu.html):", menuItemsData);
             } else { throw new Error(`API Articoli: ${itemsResponse.status} ${await itemsResponse.text()}`); }

            // 3. Elabora Dati Menu
            let processedMenuData = [];
            if (menuCategoriesData.length > 0 && menuItemsData.length > 0) {
                 processedMenuData = menuCategoriesData.map(catRec => {
                     const catId = catRec.id;
                     const items = menuItemsData.filter(itemRec => {
                            // Verifica robusta del collegamento Categoria
                            const linkedCategoryIds = getField(itemRec.fields, catCategoriaField, []); // Usa nome campo da fieldMap
                            return Array.isArray(linkedCategoryIds) && linkedCategoryIds.includes(catId);
                         })
                         .map(itemRec => ({
                             id: itemRec.id,
                             name: getField(itemRec.fields, fieldMap.menuArticoli.nome, 'Nome Mancante'),
                             price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo),
                             description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '')
                         }));
                     return {
                         id: catId,
                         name: getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante'),
                         items: items
                     };
                 }).filter(category => category.items.length > 0); // Filtra categorie senza articoli abbinati

                 console.log("Menu Data Processed (menu.html):", processedMenuData);
                 if (processedMenuData.length === 0) { // Log specifici se il processing fallisce
                     console.warn("ATTENZIONE: Dati Categoria e Articolo ricevuti, ma NESSUN articolo risulta collegato correttamente a una categoria attiva. Controllare il campo LINK 'Categoria' negli articoli in Airtable!");
                 }
            } else {
                 // Log specifici se uno dei due array è vuoto
                 if (menuCategoriesData.length === 0) { console.log("Nessuna categoria attiva trovata per questa configurazione (Filtro: Stato Attivo=1 e Configurazione=ID)."); }
                 if (menuItemsData.length === 0) { console.log("Nessun articolo attivo trovato per questa configurazione (Filtro: Stato Attivo=1 e Configurazione=ID)."); }
            }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) {
            console.error('ERRORE CARICAMENTO DATI MENU:', error);
            // Mostra messaggio più specifico se possibile
            const errorMsg = error.message.includes("API") ? error.message : "Errore imprevisto nello script.";
            if (menuContent) menuContent.innerHTML = `<p class="error-message">Impossibile caricare il menu: ${errorMsg}</p>`;
        } finally {
            if (menuLoadingMessage) menuLoadingMessage.style.display = 'none';
        }
    }

    // Carica i dati del menu all'avvio
    loadMenuData();

}); // Fine DOMContentLoaded
