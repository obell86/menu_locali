document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A';
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278';
    const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie';
    const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';

    // Mappatura campi Menu
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
    function renderMenu(menuData) { /* ... (identica all'ultima versione) ... */ }
    function addAccordionListeners() { /* ... (identica all'ultima versione) ... */ }
    function toggleCategory(titleElement) { /* ... (identica all'ultima versione) ... */ }

    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

        const configRecordId = 'recK0pTqrdvJWLi9d'; // ID Config Principale
        if (!configRecordId) { /* Errore ID Mancante */ return; }

        const catAttivoField = fieldMap.menuCategorie.attivo; const catConfigField = fieldMap.menuCategorie.configurazione;
        const itemAttivoField = fieldMap.menuArticoli.attivo; const itemConfigField = fieldMap.menuArticoli.configurazione;
        const catCategoriaField = fieldMap.menuArticoli.categoria;
        console.log(`NOMI CAMPO USATI: Categoria[Attivo='${catAttivoField}', Config='${catConfigField}'], Articolo[Attivo='${itemAttivoField}', Config='${itemConfigField}', CategoriaLink='${catCategoriaField}']`);

        if (!catAttivoField || !catConfigField || !itemAttivoField || !itemConfigField || !catCategoriaField) { /* Errore fieldMap */ return; }

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let allActiveCategories = []; // Tutte le categorie attive (qualsiasi config)
            let allActiveItems = [];    // Tutti gli articoli attivi (qualsiasi config)

            // 1. Recupera TUTTE le Categorie ATTIVE (SENZA filtro Configurazione via API)
            const filterFormulaCategoriesSimple = `{${catAttivoField}}=1`;
            console.log("Filtro Categorie API (SOLO ATTIVE):", filterFormulaCategoriesSimple);
            const sortOrder = `sort[0][field]=${encodeURIComponent(fieldMap.menuCategorie.ordine)}&sort[0][direction]=asc`;
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaCategoriesSimple)}&${sortOrder}`;
            console.log("Fetch Categories (Solo Attive):", categoriesUrl);
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) { const res = await categoriesResponse.json(); allActiveCategories = res.records || []; console.log("Categories Data Raw (Solo Attive):", allActiveCategories); }
            else { throw new Error(`API Categorie (Solo Attive): ${categoriesResponse.status} ${await categoriesResponse.text()}`); }

            // 2. Recupera TUTTI gli Articoli ATTIVI (SENZA filtro Configurazione via API)
            const filterFormulaItemsSimple = `{${itemAttivoField}}=1`;
            console.log("Filtro Articoli API (SOLO ATTIVI):", filterFormulaItemsSimple);
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItemsSimple)}`;
            console.log("Fetch Items (Solo Attivi):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) { const res = await itemsResponse.json(); allActiveItems = res.records || []; console.log("Items Data Raw (Solo Attivi):", allActiveItems); }
             else { throw new Error(`API Articoli (Solo Attivi): ${itemsResponse.status} ${await itemsResponse.text()}`); }

            // 3. Elabora Dati Menu - **FILTRA PER CONFIGURAZIONE QUI IN JAVASCRIPT**
            let processedMenuData = [];
            if (allActiveCategories.length > 0 && allActiveItems.length > 0) {
                 // Filtra le categorie per l'ID configurazione corretto
                 const filteredCategories = allActiveCategories.filter(catRec => {
                     const linkedConfigIds = getField(catRec.fields, catConfigField, []);
                     return Array.isArray(linkedConfigIds) && linkedConfigIds.includes(configRecordId);
                 });
                 console.log("Categorie filtrate per Config ID in JS:", filteredCategories);

                 // Filtra gli articoli per l'ID configurazione corretto
                 const filteredItems = allActiveItems.filter(itemRec => {
                    const linkedConfigIds = getField(itemRec.fields, itemConfigField, []);
                    return Array.isArray(linkedConfigIds) && linkedConfigIds.includes(configRecordId);
                 });
                 console.log("Articoli filtrati per Config ID in JS:", filteredItems);

                 // Ora costruisci il menu usando i dati GIA' FILTRATI per Configurazione
                 if (filteredCategories.length > 0 && filteredItems.length > 0) {
                     processedMenuData = filteredCategories.map(catRec => { /* ... (logica map/filter/map come prima, usando filteredItems) ... */ }).filter(category => category.items.length > 0);
                     console.log("Menu Data Processed (Filtro JS):", processedMenuData);
                     if (processedMenuData.length === 0) { console.warn("ATTENZIONE: Link Articolo->Categoria errato."); }
                 } else { /* Log nessun dato trovato DOPO filtro JS */ }
            } else { /* Log nessun dato ATTIVO trovato in totale */ }

            // 4. Renderizza il Menu
            renderMenu(processedMenuData);

        } catch (error) { /* ... gestione errori ... */ }
        finally { /* ... nascondi caricamento ... */ }
    }
    loadMenuData();

    // --- Funzioni copiate per completezza ---
    function renderMenu(menuData){const menuContent=document.getElementById('menu-content');if(!menuContent){console.error("Errore: Elemento #menu-content non trovato.");return;}if(!menuData||menuData.length===0){menuContent.innerHTML='<p>Il menu non è disponibile al momento.</p>';console.log("renderMenu: Nessun dato valido ricevuto.");return;}let menuHTML='';menuData.forEach(category=>{if(!category.items||category.items.length===0)return;menuHTML+=`<div class="menu-category"><h3 class="category-title" tabindex="0">${category.name||'?'}</h3><ul class="item-list" style="max-height: 0; overflow: hidden;">`;category.items.forEach(item=>{let formattedPrice='';const priceValue=item.price;if(typeof priceValue==='number'){formattedPrice=`€${priceValue.toFixed(2)}`;}else if(typeof priceValue==='string'){formattedPrice=priceValue;}menuHTML+=`<li class="menu-item"><div class="item-details"><span class="item-name">${item.name||'?'}</span>`;if(item.description){menuHTML+=`<p class="item-description">${item.description}</p>`;}menuHTML+=`</div>`;if(formattedPrice){menuHTML+=`<span class="item-price">${formattedPrice}</span>`;}menuHTML+=`</li>`;});menuHTML+=`</ul></div>`;});menuContent.innerHTML=menuHTML;addAccordionListeners();console.log("Menu renderizzato (menu.html).");}
    function addAccordionListeners(){const menuContent=document.getElementById('menu-content');if(!menuContent)return;const categoryTitles=menuContent.querySelectorAll('.category-title');categoryTitles.forEach(title=>{title.addEventListener('click',()=>toggleCategory(title));title.addEventListener('keydown',(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleCategory(title);}});});}
    function toggleCategory(titleElement){const categoryDiv=titleElement.parentElement;const itemList=titleElement.nextElementSibling;if(!itemList||itemList.tagName!=='UL'){console.error("Struttura HTML errata: UL non trovato dopo H3.");return;}const isOpen=categoryDiv.classList.contains('category-open');if(isOpen){categoryDiv.classList.remove('category-open');itemList.style.maxHeight='0';}else{categoryDiv.classList.add('category-open');itemList.style.maxHeight=itemList.scrollHeight+'px';}}
    // Funzione getField (già definita sopra)

}); // Fine DOMContentLoaded

// Blocco map/filter/map completo per punto 3 (per riferimento, se necessario)
/*
processedMenuData = filteredCategories.map(catRec => {
    const catId = catRec.id;
    const categoryName = getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante');
    const items = filteredItems.filter(itemRec => { // Usa filteredItems qui!
            const linkedCategoryIds = getField(itemRec.fields, catCategoriaField, []);
            return Array.isArray(linkedCategoryIds) && linkedCategoryIds.includes(catId);
        })
        .map(itemRec => ({ // Crea l'oggetto pulito per l'item
            id: itemRec.id,
            name: getField(itemRec.fields, fieldMap.menuArticoli.nome, 'Nome Mancante'),
            price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo),
            description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '')
        }));
    return { id: catId, name: categoryName, items: items }; // Ritorna l'oggetto categoria pulito
}).filter(category => category.items.length > 0); // Filtra via le categorie senza articoli abbinati
*/
