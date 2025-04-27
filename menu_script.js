document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF'; // ID Base Corretto!
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b'; // Token Corretto!
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie';
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';
    // const CONFIG_TABLE_NAME = 'Configurazione'; // Serve solo se leggi da lì

    // Mappatura campi Menu
    const fieldMap = {
        menuCategorie: { nome: 'Nome Categoria', ordine: 'Ordine Visualizzazione', attivo: 'Stato Attivo', configurazione: 'Configurazione' },
        menuArticoli: { nome: 'Nome Articolo', prezzo: 'Prezzo', descrizione: 'Descrizione', categoria: 'Categoria', attivo: 'Stato Attivo', configurazione: 'Configurazione' }
    };

    // --- Elementi DOM ---
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { /* ... (stessa funzione di script.js) ... */ };

    // --- Funzioni Menu ---
    function renderMenu(menuData) {
        if (!menuContent) return;
        if (!menuData || menuData.length === 0) { menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>'; return; }
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
        const isOpen = categoryDiv.classList.contains('category-open');
        if (isOpen) { categoryDiv.classList.remove('category-open'); itemList.style.maxHeight = '0'; }
        else { categoryDiv.classList.add('category-open'); itemList.style.maxHeight = itemList.scrollHeight + 'px'; }
    }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        // ====> !!! METTI QUI L'ID DEL TUO RECORD 'Configurazione Principale' !!! <====
        const configRecordId = 'recowUo9ecB5zLSSm'; // Esempio ID dai log, VERIFICA SIA GIUSTO!
        // ============================================================================

        if (!configRecordId) {
             console.error("ID Configurazione MANCANTE in menu_script.js!");
             if (menuContent) menuContent.innerHTML = '<p class="error-message">Errore: Configurazione non trovata.</p>';
             if (menuLoadingMessage) menuLoadingMessage.style.display = 'none'; return;
        }

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let menuCategoriesData = []; let menuItemsData = [];

            // 1. Recupera Categorie Menu (Filtrate per Configurazione)
            const filterFormulaCategories = `AND({${fieldMap.menuCategorie.attivo}}=1, {${fieldMap.menuCategorie.configurazione}}='${configRecordId}')`;
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategories)}&${sortOrder}`;
            console.log("Fetch Categories (menu.html):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) {
                const categoriesResult = await categoriesResponse.json(); menuCategoriesData = categoriesResult.records || []; console.log("Categories Data Raw (menu.html):", menuCategoriesData);
            } else { throw new Error(`Errore API Categorie: ${categoriesResponse.status}`); }

            // 2. Recupera Articoli Menu (Filtrati per Configurazione)
            const filterFormulaItems = `AND({${fieldMap.menuArticoli.attivo}}=1, {${fieldMap.menuArticoli.configurazione}}='${configRecordId}')`;
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items (menu.html):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) {
                 const itemsResult = await itemsResponse.json(); menuItemsData = itemsResult.records || []; console.log("Items Data Raw (menu.html):", menuItemsData);
             } else { throw new Error(`Errore API Articoli: ${itemsResponse.status}`); }

            // 3. Elabora Dati Menu
            let processedMenuData = [];
            if (menuCategoriesData.length > 0) {
                 processedMenuData = menuCategoriesData.map(catRec => {
                     const catId = catRec.id;
                     const items = menuItemsData.filter(itemRec => getField(itemRec.fields, fieldMap.menuArticoli.categoria, [])[0] === catId)
                                             .map(itemRec => ({ id: itemRec.id, name: getField(itemRec.fields, fieldMap.menuArticoli.nome, '?'), price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo), description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '') }));
                     return { id: catId, name: getField(catRec.fields, fieldMap.menuCategorie.nome, '?'), items: items };
                 }).filter(category => category.items.length > 0);
                 console.log("Menu Data Processed (menu.html):", processedMenuData);
            } else { console.log("Nessuna categoria attiva trovata per questa configurazione."); }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) {
            console.error('ERRORE caricamento dati menu:', error);
            if (menuContent) menuContent.innerHTML = `<p class="error-message">Impossibile caricare il menu: ${error.message}</p>`;
        } finally {
             if (menuLoadingMessage) menuLoadingMessage.style.display = 'none';
        }
    }
    loadMenuData(); // Esegui al caricamento
});