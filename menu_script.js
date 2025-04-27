document.addEventListener('DOMContentLoaded', () => {
    // ... (Configurazione Airtable, fieldMap, Elementi DOM, Funzioni Helper - INVARIATE) ...
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF';
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie';
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';

    // Mappatura campi Menu
    const fieldMap = {
        menuCategorie: { nome: 'Nome Categoria', ordine: 'Ordine Visualizzazione', attivo: 'Stato Attivo', configurazione: 'Configurazione' },
        menuArticoli: { nome: 'Nome Articolo', prezzo: 'Prezzo', descrizione: 'Descrizione', categoria: 'Categoria', attivo: 'Stato Attivo', configurazione: 'Configurazione' }
    };
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; return (fields[fieldName] !== undefined && fields[fieldName] !== null && fields[fieldName] !== '') ? fields[fieldName] : defaultValue; };
    function renderMenu(menuData) { /* ... (invariata) ... */ }
    function addAccordionListeners() { /* ... (invariata) ... */ }
    function toggleCategory(titleElement) { /* ... (invariata) ... */ }


    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        const configRecordId = 'recowUo9ecB5zLSSm'; // ID Config Principale (VERIFICATO)
        if (!configRecordId) { /* ... (errore ID mancante) ... */ return; }

        // *** VERIFICA NOMI CAMPO PRIMA DI USARLI NEL FILTRO ***
        const catAttivoField = fieldMap.menuCategorie.attivo;
        const catConfigField = fieldMap.menuCategorie.configurazione;
        const itemAttivoField = fieldMap.menuArticoli.attivo;
        const itemConfigField = fieldMap.menuArticoli.configurazione;
        console.log(`VERIFICA NOMI CAMPO FILTRO: Categoria[Attivo='${catAttivoField}', Config='${catConfigField}'], Articolo[Attivo='${itemAttivoField}', Config='${itemConfigField}']`);
        // *** Controlla se questi nomi corrispondono ESATTAMENTE a quelli in Airtable ***

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let menuCategoriesData = []; let menuItemsData = [];

            // 1. Recupera Categorie Menu
            // *** COSTRUISCI E LOGGA LA FORMULA ESATTA ***
            const filterFormulaCategories = `AND({${catAttivoField}}=1, {${catConfigField}}='${configRecordId}')`;
            console.log("Filtro Categorie INVIATO:", filterFormulaCategories); // <-- NUOVO LOG
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategories)}&${sortOrder}`;
            console.log("Fetch Categories (menu.html):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) { /* ... */ } else { throw new Error(/* ... */); }

            // 2. Recupera Articoli Menu
            // *** COSTRUISCI E LOGGA LA FORMULA ESATTA ***
            const filterFormulaItems = `AND({${itemAttivoField}}=1, {${itemConfigField}}='${configRecordId}')`;
            console.log("Filtro Articoli INVIATO:", filterFormulaItems); // <-- NUOVO LOG
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items (menu.html):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) { /* ... */ } else { throw new Error(/* ... */); }

            // ... (resto del codice per processare e renderizzare - INVARIATO) ...
            // 3. Elabora Dati Menu (COLLEGAMENTO ARTICOLI-CATEGORIE)
             let processedMenuData = []; if (menuCategoriesData.length > 0 && menuItemsData.length > 0) { processedMenuData = menuCategoriesData.map(catRec => { const catId = catRec.id; const items = menuItemsData.filter(itemRec => getField(itemRec.fields, fieldMap.menuArticoli.categoria, [])[0] === catId).map(itemRec => ({ id: itemRec.id, name: getField(itemRec.fields, fieldMap.menuArticoli.nome, '?'), price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo), description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '') })); return { id: catId, name: getField(catRec.fields, fieldMap.menuCategorie.nome, '?'), items: items }; }).filter(category => category.items.length > 0); console.log("Menu Data Processed (menu.html):", processedMenuData); if (processedMenuData.length === 0 && menuCategoriesData.length > 0 && menuItemsData.length > 0) { console.warn("ATTENZIONE: Trovate categorie e articoli, ma il collegamento Articoli -> Categoria sembra errato nei dati Airtable o nel mapping!"); } } else { console.log("Nessuna categoria attiva o nessun articolo attivo trovato per questa configurazione."); }
             // 4. Renderizza il Menu
             renderMenu(processedMenuData);

        } catch (error) { /* ... (gestione errori) ... */ }
        finally { /* ... (nascondi messaggio caricamento) ... */ }
    }
    loadMenuData();

    // --- Funzioni copiate per completezza (INVARIATE) ---
    function renderMenu(menuData) { const menuContent = document.getElementById('menu-content'); if (!menuContent) return; if (!menuData || menuData.length === 0) { menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>'; console.log("renderMenu: Nessun dato valido da visualizzare."); return; } let menuHTML = ''; menuData.forEach(category => { if (!category.items || category.items.length === 0) return; menuHTML += `<div class="menu-category"><h3 class="category-title" tabindex="0">${category.name}</h3><ul class="item-list" style="max-height: 0; overflow: hidden;">`; category.items.forEach(item => { let formattedPrice = ''; if (typeof item.price === 'number') { formattedPrice = `€${item.price.toFixed(2)}`; } else if (typeof item.price === 'string') { formattedPrice = item.price; } menuHTML += `<li class="menu-item"><div class="item-details"><span class="item-name">${item.name}</span>${item.description ? `<p class="item-description">${item.description}</p>` : ''}</div>${formattedPrice ? `<span class="item-price">${formattedPrice}</span>` : ''}</li>`; }); menuHTML += `</ul></div>`; }); menuContent.innerHTML = menuHTML; addAccordionListeners(); console.log("Menu renderizzato (menu.html)."); }
    function addAccordionListeners() { const menuContent = document.getElementById('menu-content'); const categoryTitles = menuContent.querySelectorAll('.category-title'); categoryTitles.forEach(title => { title.addEventListener('click', () => toggleCategory(title)); title.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCategory(title); } }); }); }
    function toggleCategory(titleElement) { const categoryDiv = titleElement.parentElement; const itemList = titleElement.nextElementSibling; const isOpen = categoryDiv.classList.contains('category-open'); if (isOpen) { categoryDiv.classList.remove('category-open'); itemList.style.maxHeight = '0'; } else { categoryDiv.classList.add('category-open'); itemList.style.maxHeight = itemList.scrollHeight + 'px'; } }


}); // Fine DOMContentLoaded
