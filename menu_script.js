document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF';
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie'; // VERIFICA NOME ESATTO
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';   // VERIFICA NOME ESATTO

    // Mappatura campi Menu
    const fieldMap = {
        menuCategorie: { nome: 'Nome Categoria', ordine: 'Ordine Visualizzazione', attivo: 'Stato Attivo', configurazione: 'Configurazione', categoria: 'Categoria' }, // Aggiunto categoria qui per sicurezza map
        menuArticoli: { nome: 'Nome Articolo', prezzo: 'Prezzo', descrizione: 'Descrizione', categoria: 'Categoria', attivo: 'Stato Attivo', configurazione: 'Configurazione' }
    };

    // --- Elementi DOM ---
    const menuContent = document.getElementById('menu-content');
    const menuLoadingMessage = document.getElementById('menu-loading-message');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; return (fields[fieldName] !== undefined && fields[fieldName] !== null && fields[fieldName] !== '') ? fields[fieldName] : defaultValue; };

    // --- Funzioni Menu ---
    function renderMenu(menuData) { /* ... (invariata) ... */ }
    function addAccordionListeners() { /* ... (invariata) ... */ }
    function toggleCategory(titleElement) { /* ... (invariata) ... */ }

     // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let menuCategoriesData = []; let menuItemsData = [];

            // 1. Recupera TUTTE le Categorie Menu (SENZA FILTRI!)
            // Rimosso anche sort per massima semplicità
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}`;
            console.log("Fetch ALL Categories (menu.html - NO FILTER):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) {
                const categoriesResult = await categoriesResponse.json(); menuCategoriesData = categoriesResult.records || []; console.log("Categories Data Raw (menu.html - NO FILTER):", menuCategoriesData);
            } else { throw new Error(`Errore API Categorie (NO FILTER): ${categoriesResponse.status}`); }

            // 2. Recupera TUTTI gli Articoli Menu (SENZA FILTRI!)
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}`;
            console.log("Fetch ALL Items (menu.html - NO FILTER):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) {
                 const itemsResult = await itemsResponse.json(); menuItemsData = itemsResult.records || []; console.log("Items Data Raw (menu.html - NO FILTER):", menuItemsData);
             } else { throw new Error(`Errore API Articoli (NO FILTER): ${itemsResponse.status}`); }

            // 3. Elabora Dati Menu (Ora dovrebbe trovare tutto, ma mostrerà solo cat con articoli collegati)
            let processedMenuData = [];
            if (menuCategoriesData.length > 0 && menuItemsData.length > 0) { // Verifica ci siano dati in entrambi
                 processedMenuData = menuCategoriesData.map(catRec => {
                     const catId = catRec.id;
                     // Filtra gli articoli trovati per abbinare la categoria
                     const items = menuItemsData.filter(itemRec => getField(itemRec.fields, fieldMap.menuArticoli.categoria, [])[0] === catId)
                                             .map(itemRec => ({ id: itemRec.id, name: getField(itemRec.fields, fieldMap.menuArticoli.nome, '?'), price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo), description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '') }));
                     return { id: catId, name: getField(catRec.fields, fieldMap.menuCategorie.nome, '?'), items: items };
                 }).filter(category => category.items.length > 0); // Mostra solo categorie che hanno almeno un articolo collegato
                 console.log("Menu Data Processed (menu.html - NO FILTER):", processedMenuData);
                 if (processedMenuData.length === 0) {
                     console.log("Trovate categorie e articoli, ma NESSUN articolo è collegato correttamente a una categoria trovata!");
                 }
            } else {
                 console.log("Nessuna categoria o nessun articolo trovato (senza filtri). Controlla nomi tabelle/permessi token.");
            }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) {
            console.error('ERRORE caricamento dati menu (NO FILTER):', error);
            if (menuContent) menuContent.innerHTML = `<p class="error-message">Impossibile caricare il menu (test senza filtri): ${error.message}</p>`;
        } finally {
             if (menuLoadingMessage) menuLoadingMessage.style.display = 'none';
        }
    }
    loadMenuData();
});

// --- Funzioni copiate per completezza ---
const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; return (fields[fieldName] !== undefined && fields[fieldName] !== null && fields[fieldName] !== '') ? fields[fieldName] : defaultValue; };
function renderMenu(menuData) { const menuContent = document.getElementById('menu-content'); if (!menuContent) return; if (!menuData || menuData.length === 0) { menuContent.innerHTML = '<p>Il menu non è disponibile al momento.</p>'; return; } let menuHTML = ''; menuData.forEach(category => { if (!category.items || category.items.length === 0) return; menuHTML += `<div class="menu-category"><h3 class="category-title" tabindex="0">${category.name}</h3><ul class="item-list" style="max-height: 0; overflow: hidden;">`; category.items.forEach(item => { let formattedPrice = ''; if (typeof item.price === 'number') { formattedPrice = `€${item.price.toFixed(2)}`; } else if (typeof item.price === 'string') { formattedPrice = item.price; } menuHTML += `<li class="menu-item"><div class="item-details"><span class="item-name">${item.name}</span>${item.description ? `<p class="item-description">${item.description}</p>` : ''}</div>${formattedPrice ? `<span class="item-price">${formattedPrice}</span>` : ''}</li>`; }); menuHTML += `</ul></div>`; }); menuContent.innerHTML = menuHTML; addAccordionListeners(); console.log("Menu renderizzato (menu.html)."); }
function addAccordionListeners() { const menuContent = document.getElementById('menu-content'); const categoryTitles = menuContent.querySelectorAll('.category-title'); categoryTitles.forEach(title => { title.addEventListener('click', () => toggleCategory(title)); title.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleCategory(title); } }); }); }
function toggleCategory(titleElement) { const categoryDiv = titleElement.parentElement; const itemList = titleElement.nextElementSibling; const isOpen = categoryDiv.classList.contains('category-open'); if (isOpen) { categoryDiv.classList.remove('category-open'); itemList.style.maxHeight = '0'; } else { categoryDiv.classList.add('category-open'); itemList.style.maxHeight = itemList.scrollHeight + 'px'; } }
