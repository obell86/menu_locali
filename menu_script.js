async function loadMenuData() {
    if (menuLoadingMessage) menuLoadingMessage.style.display = 'block';

    const configRecordId = 'recK0pTqrdvJWLi9d'; // ID Config Principale
    if (!configRecordId) {
        console.error("ID Configurazione mancante");
        return;
    }

    const catAttivoField = fieldMap.menuCategorie.attivo;
    const catConfigField = fieldMap.menuCategorie.configurazione;
    const itemAttivoField = fieldMap.menuArticoli.attivo;
    const itemConfigField = fieldMap.menuArticoli.configurazione;
    const catCategoriaField = fieldMap.menuArticoli.categoria;
    
    console.log(`NOMI CAMPO USATI: Categoria[Attivo='${catAttivoField}', Config='${catConfigField}'], Articolo[Attivo='${itemAttivoField}', Config='${itemConfigField}', CategoriaLink='${catCategoriaField}']`);

    if (!catAttivoField || !catConfigField || !itemAttivoField || !itemConfigField || !catCategoriaField) {
        console.error("Errore mappatura campi");
        return;
    }

    // Funzione migliorata per gestire i link
    const getLinkIds = (fields, fieldName) => {
        if (!fields || !fields[fieldName]) return [];
        const value = fields[fieldName];
        
        // Se è già un array di stringhe (ID)
        if (Array.isArray(value) && typeof value[0] === 'string') return value;
        
        // Se è una stringa singola (ID)
        if (typeof value === 'string') return [value];
        
        // Se è un array di oggetti con ID
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0].id) {
            return value.map(v => v.id);
        }
        
        console.warn(`FORMATO LINK NON RICONOSCIUTO per ${fieldName}:`, value);
        return [];
    };

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
        
        if (categoriesResponse.ok) {
            const res = await categoriesResponse.json();
            allActiveCategories = res.records || [];
            console.log("Categories Data Raw (Solo Attive):", allActiveCategories);
            
            // Log dettagliato di una categoria di esempio
            if (allActiveCategories.length > 0) {
                const cat = allActiveCategories[0];
                console.log("ESEMPIO CATEGORIA (raw):", JSON.stringify(cat, null, 2));
                console.log("ESEMPIO CATEGORIA (fields):", cat.fields);
                console.log("ESEMPIO ID CONFIG IN CATEGORIA:", cat.fields[catConfigField]);
            }
        } else {
            throw new Error(`API Categorie (Solo Attive): ${categoriesResponse.status} ${await categoriesResponse.text()}`);
        }

        // 2. Recupera TUTTI gli Articoli ATTIVI (SENZA filtro Configurazione via API)
        const filterFormulaItemsSimple = `{${itemAttivoField}}=1`;
        console.log("Filtro Articoli API (SOLO ATTIVI):", filterFormulaItemsSimple);
        const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItemsSimple)}`;
        
        console.log("Fetch Items (Solo Attivi):", itemsUrl);
        const itemsResponse = await fetch(itemsUrl, { headers });
        
        if (itemsResponse.ok) {
            const res = await itemsResponse.json();
            allActiveItems = res.records || [];
            console.log("Items Data Raw (Solo Attivi):", allActiveItems);
            
            // Log dettagliato di un articolo di esempio
            if (allActiveItems.length > 0) {
                const item = allActiveItems[0];
                console.log("ESEMPIO ARTICOLO (raw):", JSON.stringify(item, null, 2));
                console.log("ESEMPIO ARTICOLO (fields):", item.fields);
                console.log("ESEMPIO ID CONFIG IN ARTICOLO:", item.fields[itemConfigField]);
                console.log("STRUTTURA ESEMPIO LINK CATEGORIA:", JSON.stringify(item.fields[catCategoriaField]));
            }
        } else {
            throw new Error(`API Articoli (Solo Attivi): ${itemsResponse.status} ${await itemsResponse.text()}`);
        }

        // 3. Elabora Dati Menu - **FILTRA PER CONFIGURAZIONE QUI IN JAVASCRIPT**
        let processedMenuData = [];
        if (allActiveCategories.length > 0 && allActiveItems.length > 0) {
            // Filtra le categorie per l'ID configurazione corretto
            const filteredCategories = allActiveCategories.filter(catRec => {
                const linkedConfigIds = getLinkIds(catRec.fields, catConfigField);
                const matches = linkedConfigIds.includes(configRecordId);
                console.log(`Categoria '${getField(catRec.fields, fieldMap.menuCategorie.nome)}' ha config IDs: [${linkedConfigIds}], match con ${configRecordId}: ${matches}`);
                return matches;
            });
            console.log("Categorie filtrate per Config ID in JS:", filteredCategories);

            // Filtra gli articoli per l'ID configurazione corretto
            const filteredItems = allActiveItems.filter(itemRec => {
                const linkedConfigIds = getLinkIds(itemRec.fields, itemConfigField);
                const matches = linkedConfigIds.includes(configRecordId);
                console.log(`Articolo '${getField(itemRec.fields, fieldMap.menuArticoli.nome)}' ha config IDs: [${linkedConfigIds}], match con ${configRecordId}: ${matches}`);
                return matches;
            });
            console.log("Articoli filtrati per Config ID in JS:", filteredItems);

            // Ora costruisci il menu usando i dati GIA' FILTRATI per Configurazione
            if (filteredCategories.length > 0 && filteredItems.length > 0) {
                // Log per ogni categoria
                filteredCategories.forEach(catRec => {
                    const catId = catRec.id;
                    const categoryName = getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante');
                    console.log(`DEBUG: Categoria '${categoryName}' (ID: ${catId})`);
                    
                    // Per questa categoria, quanti articoli sono associati?
                    const matchingItems = filteredItems.filter(itemRec => {
                        const linkedCategoryIds = getLinkIds(itemRec.fields, catCategoriaField);
                        console.log(`DEBUG: Articolo '${getField(itemRec.fields, fieldMap.menuArticoli.nome)}' ha categoria IDs:`, linkedCategoryIds);
                        const matches = linkedCategoryIds.includes(catId);
                        console.log(`DEBUG: Match con categoria '${categoryName}' (${catId}): ${matches}`);
                        return matches;
                    });
                    
                    console.log(`DEBUG: Trovati ${matchingItems.length} articoli per categoria '${categoryName}'`);
                });
                
                // Qui il mapping vero e proprio
                processedMenuData = filteredCategories.map(catRec => {
                    const catId = catRec.id;
                    const categoryName = getField(catRec.fields, fieldMap.menuCategorie.nome, 'Categoria Mancante');
                    const items = filteredItems.filter(itemRec => {
                        const linkedCategoryIds = getLinkIds(itemRec.fields, catCategoriaField);
                        return linkedCategoryIds.includes(catId);
                    }).map(itemRec => ({
                        id: itemRec.id,
                        name: getField(itemRec.fields, fieldMap.menuArticoli.nome, 'Nome Mancante'),
                        price: getField(itemRec.fields, fieldMap.menuArticoli.prezzo),
                        description: getField(itemRec.fields, fieldMap.menuArticoli.descrizione, '')
                    }));
                    return { id: catId, name: categoryName, items: items };
                }).filter(category => category.items.length > 0);
                
                console.log("Menu Data Processed (Filtro JS):", processedMenuData);
                if (processedMenuData.length === 0) {
                    console.warn("ATTENZIONE: Link Articolo->Categoria errato o nessuna corrispondenza trovata.");
                }
            } else {
                console.log("Nessuna categoria o articolo trovato dopo il filtro per configurazione");
            }
        } else {
            console.log("Nessuna categoria o articolo ATTIVO trovato");
        }

        // 4. Renderizza il Menu
        renderMenu(processedMenuData);

    } catch (error) {
        console.error("Errore durante il caricamento del menu:", error);
        menuContent.innerHTML = '<p>Si è verificato un errore durante il caricamento del menu. Riprova più tardi.</p>';
    } finally {
        if (menuLoadingMessage) menuLoadingMessage.style.display = 'none';
    }
}
