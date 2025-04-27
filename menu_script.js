    // --- Funzione Principale di Caricamento Menu ---
    async function loadMenuData() {
        // ... (ID Configurazione, console.log verifica nomi campo) ...
        const configRecordId = 'recowUo9ecB5zLSSm';
        const catAttivoField = fieldMap.menuCategorie.attivo; // ... ecc ...
        console.log(`VERIFICA NOMI CAMPO FILTRO: ...`);


        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };
            let menuCategoriesData = []; let menuItemsData = [];

            // 1. Recupera TUTTE le Categorie Menu (SENZA NESSUN FILTRO!!!)
            const categoriesUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_CATEGORIE_TABLE_NAME)}`; // URL base senza filtri
            console.log("Fetch ALL Categories (menu.html - NO FILTER AT ALL):", categoriesUrl); // Log modificato
            const categoriesResponse = await fetch(categoriesUrl, { headers });
            if (categoriesResponse.ok) {
                const categoriesResult = await categoriesResponse.json();
                menuCategoriesData = categoriesResult.records || [];
                console.log("Categories Data Raw (menu.html - NO FILTER AT ALL):", menuCategoriesData); // Log modificato
            } else { throw new Error(`Errore API Categorie (NO FILTER AT ALL): ${categoriesResponse.status}`); } // Log modificato

            // 2. Recupera Articoli Menu (MANTENIAMO IL FILTRO PER ORA, o togli anche questo?)
            // Per ora lasciamo il filtro sugli articoli per vedere se almeno le categorie arrivano
            const itemAttivoField = fieldMap.menuArticoli.attivo;
            const itemConfigField = fieldMap.menuArticoli.configurazione;
            const filterFormulaItems = `AND({${itemAttivoField}}=1, {${itemConfigField}}='${configRecordId}')`;
            console.log("Filtro Articoli INVIATO:", filterFormulaItems);
            const itemsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(MENU_ARTICOLI_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaItems)}`;
            console.log("Fetch Items (menu.html):", itemsUrl);
            const itemsResponse = await fetch(itemsUrl, { headers });
             if (itemsResponse.ok) {
                 const itemsResult = await itemsResponse.json(); menuItemsData = itemsResult.records || []; console.log("Items Data Raw (menu.html):", menuItemsData);
             } else { throw new Error(`Errore API Articoli: ${itemsResponse.status} ${await itemsResponse.text()}`); }

            // ... (resto del codice invariato) ...
            // 3. Elabora Dati Menu
            // 4. Renderizza il Menu

        } catch (error) { /* ... */ }
        finally { /* ... */ }
    }
    loadMenuData();
    // ... (funzioni helper e menu in fondo) ...
});
