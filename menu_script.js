document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable (NUOVI DATI) ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A'; // NUOVO ID BASE!
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278'; // NUOVO TOKEN!
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie'; // VERIFICA NOME ESATTO IN NUOVA BASE
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';   // VERIFICA NOME ESATTO IN NUOVA BASE

    // Mappatura campi Menu (Verifica esattezza nomi vs Airtable)
    const fieldMap = {
        menuCategorie: { nome: 'Nome Categoria', ordine: 'Ordine Visualizzazione', attivo: 'Stato Attivo', configurazione: 'Configurazione' },
        menuArticoli: { nome: 'Nome Articolo', prezzo: 'Prezzo', descrizione: 'Descrizione', categoria: 'Categoria', attivo: 'Stato Attivo', configurazione: 'Configurazione' }
    };

    // --- Elementi DOM ---
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };

    // --- Funzioni Menu ---
    function renderMenu(menuData) {
        if (!menuContent) { console.error("Errore: Elemento #menu-content non trovato."); return; }
        if (!menuData || menuData.length === 0) { menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>'; console.log("renderMenu: Nessun dato valido ricevuto."); return; }
        let menuHTML = '';
        menuData.forEach(category => {
            if (!category.items || category.items.length === 0) return;
            menuHTML += `<div class="menu-category"><h3 class="category-title" tabindex="0">${category.name || '?'}</h3><ul class="item-list" style="max-height: 0; overflow: hidden;">`;
            category.items.forEach(item => {
                let formattedPrice = ''; const priceValue = item.price; if (typeof priceValue === 'number') { formattedPrice = `€${priceValue.toFixed(2)}`; } else if (typeof priceValue === 'string') { formattedPrice = priceValue; }
                menuHTML += `<li class="menu-item"><div class="item-details"><span class="item-name">${item.name || '?'}</span>`;
                if(item.description) { menuHTML += `<p class="item-description">${item.description}</p>`; }
                menuHTML += `</div>`; if(formattedPrice) { menuHTML += `<span class="item-price">${formattedPrice}</span>`; } menuHTML += `</li>`;
            });
            menuHTML += `</ul></div>`;
        });
        menuContent.innerHTML = menuHTML; addAccordionListeners(); console.log("Menu renderizzato (menu.html).");
    }
    function addAccordionListeners() { const titles = menuContent.querySelectorAll('.category-title'); titles.forEach(t => { t.addEventListener('click', () => toggleCategory(t)); t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategory(t); } }); }); }
    function toggleCategory(titleElement) { const div = titleElement.parentElement; const ul = titleElement.nextElementSibling; if (!ul || ul.tagName !== 'UL') return; const isOpen = div.classList.contains('category-open'); if (isOpen) { div.classList.remove('category-open'); ul.style.maxHeight = '0'; } else { div.classList.add('category-open'); ul.style.maxHeight = ul.scrollHeight + 'px'; } }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        // ====> ID DEL RECORD CONFIGURAZIONE CORRETTO INSERITO <====
        const configRecordId = 'recK0pTqrdvJWLi9d'; // ID Confermato!
        // ==========================================================

        // Verifica nomi campo filtro
        const catAttivoField = fieldMap.menuCategorie.attivo; const catConfigField = fieldMap.menuCategorie.configurazione;
        const itemAttivoField = fieldMap.menuArticoli.attivo; const itemConfigField = fieldMap.menuArticoli.configurazione;
        const catCategoriaField = fieldMap.menuArticoli.categoria;
        console.log(`NOMI CAMPO USATI: Categoria[Attivo='${catAttivoField}', Config='${catConfigField}'], Articolo[Attivo='${itemAttivoField}', Config='${itemConfigField}', CategoriaLink='${catCategoriaField}']`);

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
            console.log("Fetch Categories:", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) { const res = await categoriesResponse.json(); menuCategoriesData = res.records || []; console.log("Categories Data Raw:", menuCategoriesData); }
            else { throw new Error(`API Categorie: ${categoriesResponse.status} ${await categoriesResponse.text()}`); }

            // 2. Recupera Articoli Menu (Filtrate)
            const filterFormulaItems = `AND({${itemAttivoField}}=1, {${itemConfigField}}='${configRecordId}')`;
            console.log("Filtro Articoli INVIATO:", filterFormulaItems);
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items:", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) { const res = await itemsResponse.json(); menuItemsData = res.records || []; console.log("Items Data Raw:", menuItemsData); }
             else { throw new Error(`API Articoli: ${itemsResponse.status} ${await itemsResponse.text()}`); }

            // 3. Elabora Dati Menu
            let processedMenuData = []; if (menuCategoriesData.length > 0 && menuItemsData.length > 0) { processedMenuData = menuCategoriesData.map(catRec => { const catId = catRec.id; const catName = getField(catRec.fields, fieldMap.menuCategorie.nome, '?'); const items = menuItemsData.filter(itemRec => { const linkedCatIds = getField(itemRec.fields, catCategoriaField, []); return Array.isArray(linkedCatIds) && linkedCatIds.includes(catId); }).map(itemRec => ({ id: itemRec.id, name: getField(itemRec.fields, fieldMap.menuArticoli.nome, '?'), price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo), description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '') })); return { id: catId, name: catName, items: items }; }).filter(category => category.items.length > 0); console.log("Menu Data Processed:", processedMenuData); if (processedMenuData.length === 0) { console.warn("ATTENZIONE: Dati ricevuti, ma collegamento Articolo->Categoria errato."); } } else { if(menuCategoriesData.length===0) console.log("Nessuna categoria attiva trovata per questa config."); if(menuItemsData.length===0) console.log("Nessun articolo attivo trovato per questa config."); }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) { console.error('ERRORE:', error); if (menuContent) menuContent.innerHTML = `<p class="error-message">Errore: ${error.message}</p>`; }
        finally { if (menuLoadingMessage) menuLoadingMessage.style.display = 'none'; }
    }
    loadMenuData();
});
