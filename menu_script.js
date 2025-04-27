document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF';
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie';
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';

    // Mappatura campi Menu (Confermata dagli screenshot)
    const fieldMap = {
        menuCategorie: { nome: 'Nome Categoria', ordine: 'Ordine Visualizzazione', attivo: 'Stato Attivo', configurazione: 'Configurazione' },
        menuArticoli: { nome: 'Nome Articolo', prezzo: 'Prezzo', descrizione: 'Descrizione', categoria: 'Categoria', attivo: 'Stato Attivo', configurazione: 'Configurazione' }
    };

    // --- Elementi DOM ---
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { /* ... (invariata) ... */ };

    // --- Funzioni Menu ---
    function renderMenu(menuData) {
        if (!menuContent) { console.error("Errore: Elemento #menu-content non trovato."); return; }
        if (!menuData || menuData.length === 0) { menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>'; console.log("renderMenu: Nessun dato valido."); return; }
        let menuHTML = '';
        menuData.forEach(category => { // 'category' è l'oggetto processato { id, name, items }
            if (!category.items || category.items.length === 0) return;
            menuHTML += `<div class="menu-category">`;
            // *** CORRETTO: Accedi direttamente a category.name ***
            menuHTML += `<h3 class="category-title" tabindex="0">${category.name || 'Categoria Errata'}</h3>`;
            menuHTML += `<ul class="item-list" style="max-height: 0; overflow: hidden;">`;
            category.items.forEach(item => { // 'item' è l'oggetto processato { id, name, price, description }
                let formattedPrice = '';
                // *** CORRETTO: Accedi direttamente a item.price ***
                const priceValue = item.price;
                if (typeof priceValue === 'number') { formattedPrice = `€${priceValue.toFixed(2)}`; }
                else if (typeof priceValue === 'string') { formattedPrice = priceValue; }

                menuHTML += `<li class="menu-item">`;
                menuHTML += `<div class="item-details">`;
                // *** CORRETTO: Accedi direttamente a item.name e item.description ***
                menuHTML += `<span class="item-name">${item.name || 'Articolo Errato'}</span>`;
                if(item.description) { menuHTML += `<p class="item-description">${item.description}</p>`; }
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

    function addAccordionListeners() { /* ... (invariata) ... */ }
    function toggleCategory(titleElement) { /* ... (invariata) ... */ }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';
        const configRecordId = 'recowUo9ecB5zLSSm'; // ID Config Principale (VERIFICATO)
        if (!configRecordId) { /* ... */ return; }

        // Verifica nomi campo filtro (già fatto)
        const catAttivoField = fieldMap.menuCategorie.attivo; // ... etc ...

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let menuCategoriesData = []; let menuItemsData = [];

            // 1. Recupera Categorie Menu (Filtrate)
            const filterFormulaCategories = `AND({${catAttivoField}}=1, {${fieldMap.menuCategorie.configurazione}}='${configRecordId}')`;
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategories)}&${sortOrder}`;
            console.log("Fetch Categories:", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) { /* ... (assegna a menuCategoriesData) ... */ } else { throw new Error(/* ... */); }

            // 2. Recupera Articoli Menu (Filtrati)
            const filterFormulaItems = `AND({${fieldMap.menuArticoli.attivo}}=1, {${fieldMap.menuArticoli.configurazione}}='${configRecordId}')`;
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items:", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) { /* ... (assegna a menuItemsData) ... */ } else { throw new Error(/* ... */); }

            // 3. Elabora Dati Menu
            let processedMenuData = [];
            if (menuCategoriesData.length > 0 && menuItemsData.length > 0) {
                 processedMenuData = menuCategoriesData.map(catRec => {
                     const catId = catRec.id;
                     // *** CORRETTO: Usa i nomi campo da fieldMap per estrarre i dati PRIMA di mappare ***
                     const categoryName = getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante');

                     const items = menuItemsData.filter(itemRec => {
                             const linkedCategoryIds = getField(itemRec.fields, fieldMap.menuArticoli.categoria, []);
                             return Array.isArray(linkedCategoryIds) && linkedCategoryIds.includes(catId);
                         })
                         .map(itemRec => ({ // Crea l'oggetto pulito per l'item
                             id: itemRec.id,
                             name: getField(itemRec.fields, fieldMap.menuArticoli.nome, 'Nome Mancante'),
                             price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo),
                             description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '')
                         }));

                     // Ritorna l'oggetto categoria pulito
                     return {
                         id: catId,
                         name: categoryName, // Usa la variabile estratta prima
                         items: items
                     };
                 }).filter(category => category.items.length > 0);

                 console.log("Menu Data Processed (menu.html):", processedMenuData);
                 // ... (log warning se processedMenuData è vuoto) ...
            } else {
                 // ... (log se categorie o articoli sono vuoti) ...
            }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) { /* ... */ }
        finally { /* ... */ }
    }
    loadMenuData();

    // --- Funzioni copiate per completezza (INVARIATE MA SERVONO) ---
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };
    function addAccordionListeners() { const menuContent = document.getElementById('menu-content'); if(!menuContent) return; const categoryTitles = menuContent.querySelectorAll('.category-title'); categoryTitles.forEach(title => { title.addEventListener('click', () => toggleCategory(title)); title.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCategory(title); } }); }); }
    function toggleCategory(titleElement) { const categoryDiv = titleElement.parentElement; const itemList = titleElement.nextElementSibling; if (!itemList || itemList.tagName !== 'UL') { console.error("Struttura HTML errata: UL non trovato dopo H3."); return; } const isOpen = categoryDiv.classList.contains('category-open'); if (isOpen) { categoryDiv.classList.remove('category-open'); itemList.style.maxHeight = '0'; } else { categoryDiv.classList.add('category-open'); itemList.style.maxHeight = itemList.scrollHeight + 'px'; } }


}); // Fine DOMContentLoaded
