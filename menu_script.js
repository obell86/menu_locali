document.addEventListener('DOMContentLoaded', () => {
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

    // ... (Elementi DOM, Funzioni Helper, Funzioni Menu - INVARIATE) ...
    const menuContent = document.getElementById('menu-content'); const menuLoadingMessage = document.getElementById('menu-loading-message'); const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; }; function renderMenu(menuData) { /*...*/ } function addAccordionListeners() { /*...*/ } function toggleCategory(titleElement) { /*...*/ }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        // ID Configurazione Principale (serve dopo per filtrare in JS)
        const configRecordId = 'recowUo9ecB5zLSSm'; // VERIFICA SIA GIUSTO!
        if (!configRecordId) { /*...*/ return; }

        // Nomi campo per filtri/elaborazione
        const catAttivoField = fieldMap.menuCategorie.attivo;
        const catConfigField = fieldMap.menuCategorie.configurazione; // Nome campo Config in Categorie
        const itemAttivoField = fieldMap.menuArticoli.attivo;
        const itemConfigField = fieldMap.menuArticoli.configurazione; // Nome campo Config in Articoli
        const catCategoriaField = fieldMap.menuArticoli.categoria;

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let allCategories = []; let allItems = [];

            // 1. Recupera TUTTE le Categorie Menu **ATTIVE** (SENZA filtro Configurazione)
            const filterFormulaCategoriesSimple = `{${catAttivoField}}=1`; // Solo per Stato Attivo
            console.log("Filtro Categorie SEMPLIFICATO INVIATO:", filterFormulaCategoriesSimple);
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategoriesSimple)}&${sortOrder}`;
            console.log("Fetch Categories (menu.html - SOLO ATTIVE):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) {
                 const categoriesResult = await categoriesResponse.json(); allCategories = categoriesResult.records || []; console.log("Categories Data Raw (menu.html - SOLO ATTIVE):", allCategories);
            } else { throw new Error(`API Categorie (Solo Attive): ${categoriesResponse.status} ${await categoriesResponse.text()}`); }

            // 2. Recupera TUTTI gli Articoli Menu **ATTIVI** (SENZA filtro Configurazione)
            const filterFormulaItemsSimple = `{${itemAttivoField}}=1`; // Solo per Stato Attivo
            console.log("Filtro Articoli SEMPLIFICATO INVIATO:", filterFormulaItemsSimple);
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItemsSimple)}`;
            console.log("Fetch Items (menu.html - SOLO ATTIVI):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) {
                 const itemsResult = await itemsResponse.json(); allItems = itemsResult.records || []; console.log("Items Data Raw (menu.html - SOLO ATTIVI):", allItems);
             } else { throw new Error(`API Articoli (Solo Attivi): ${itemsResponse.status} ${await itemsResponse.text()}`); }

            // 3. Elabora Dati Menu - **FILTRA PER CONFIGURAZIONE QUI IN JAVASCRIPT**
            let processedMenuData = [];
            if (allCategories.length > 0 && allItems.length > 0) {
                 // Filtra prima le categorie per la configurazione corretta
                 const filteredCategories = allCategories.filter(catRec => {
                     const linkedConfigIds = getField(catRec.fields, catConfigField, []);
                     return Array.isArray(linkedConfigIds) && linkedConfigIds.includes(configRecordId);
                 });
                 console.log("Categorie filtrate per Config ID in JS:", filteredCategories);

                 // Filtra prima gli articoli per la configurazione corretta
                 const filteredItems = allItems.filter(itemRec => {
                    const linkedConfigIds = getField(itemRec.fields, itemConfigField, []);
                    return Array.isArray(linkedConfigIds) && linkedConfigIds.includes(configRecordId);
                 });
                 console.log("Articoli filtrati per Config ID in JS:", filteredItems);


                 // Ora procedi con l'elaborazione usando i dati GIA' FILTRATI per Configurazione
                 if (filteredCategories.length > 0 && filteredItems.length > 0) {
                     processedMenuData = filteredCategories.map(catRec => {
                         const catId = catRec.id;
                         const categoryName = getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante');
                         const items = filteredItems.filter(itemRec => { // Usa filteredItems
                                 const linkedCategoryIds = getField(itemRec.fields, catCategoriaField, []);
                                 return Array.isArray(linkedCategoryIds) && linkedCategoryIds.includes(catId);
                             })
                             .map(itemRec => ({ /* ... crea oggetto item ... */ }));
                         return { id: catId, name: categoryName, items: items };
                     }).filter(category => category.items.length > 0);
                     console.log("Menu Data Processed (menu.html - Filtro JS):", processedMenuData);
                      if (processedMenuData.length === 0) { console.warn("ATTENZIONE: Trovate cat/articoli attivi per questa config, ma il link Articolo->Categoria è errato."); }
                 } else {
                      if (filteredCategories.length === 0) console.log("Nessuna CATEGORIA attiva trovata per Config ID:", configRecordId);
                      if (filteredItems.length === 0) console.log("Nessun ARTICOLO attivo trovato per Config ID:", configRecordId);
                 }

            } else {
                 if (allCategories.length === 0) console.log("Nessuna categoria ATTIVA trovata in totale.");
                 if (allItems.length === 0) console.log("Nessun articolo ATTIVO trovato in totale.");
            }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) { /* ... gestione errori ... */ }
        finally { /* ... nascondi messaggio caricamento ... */ }
    }
    loadMenuData();

    // --- Funzioni copiate per completezza ---
    function renderMenu(menuData) { /* ... */ }
    function addAccordionListeners() { /* ... */ }
    function toggleCategory(titleElement) { /* ... */ }
    // (Codice completo funzioni in fondo omesso per brevità)
});
