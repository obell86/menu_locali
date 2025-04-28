document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable (NUOVI DATI) ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A'; // NUOVO ID BASE!
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278'; // NUOVO TOKEN!
    // !!! VERIFICA CHE I NOMI DELLE TABELLE SIANO CORRETTI NELLA NUOVA BASE !!!
    const CONFIG_TABLE_NAME = 'Configurazione';
    const LINKS_TABLE_NAME = 'Links';

    // Mappatura campi Airtable -> nomi chiave script (VERIFICA QUESTI NOMI CAMPO vs la TUA NUOVA BASE)
    const fieldMap = {
        config: {
            title: 'Titolo Pagina',           // Tabella Configurazione
            titleSize: 'Dimensione Titolo',     // Tabella Configurazione
            logoUrl: 'Logo',                  // Tabella Configurazione
            footerImageAlt: 'Alt Img Footer',   // Tabella Configurazione
            footerImageUrl: 'Immagine Footer',    // Tabella Configurazione
            backgroundUrl: 'Sfondo',              // Tabella Configurazione
            showLoader: 'Mostra Loader',        // Tabella Configurazione
            loaderText: 'Testo Loader',         // Tabella Configurazione
            loaderBarColor: 'Colore Barra Loader',// Tabella Configurazione
            loaderTextSize: 'Dimensione Testo Loader',// Tabella Configurazione
            loaderWidth: 'Larghezza Loader',     // Tabella Configurazione
            loaderBarSpeed: 'Velocità Barra Loader',// Tabella Configurazione
            buttonFontSize: 'Dimensione Font Pulsanti',// Tabella Configurazione
            buttonPadding: 'Padding Pulsanti',   // Tabella Configurazione
            showCountdown: 'Mostra Countdown',    // Tabella Configurazione
            countdownTarget: 'Data Target Countdown',// Tabella Configurazione
            countdownLabel: 'Etichetta Countdown',// Tabella Configurazione
            linkedLinks: 'Link Attivi'          // Tabella Configurazione (Link alla tabella Links)
            // 'configurazione' non serve qui
        },
        links: {
            label: 'Etichetta',                // Tabella Links
            url: 'Scrivi URL',             // Tabella Links
            color: 'Scrivi Colore Pulsante'  // Tabella Links
            // Aggiungeremo 'Configurazione' (Link) e 'Stato Attivo' (Checkbox) in Airtable quando la creiamo
        }
    };

    // Colore default per pulsanti se non specificato in Airtable
    const defaultButtonColor = 'linear-gradient(180deg, #8a6d3b 0%, #6a512f 100%)'; // Stile Pub

    // --- Elementi DOM ---
    const titleElement = document.getElementById('page-title');
    const logoContainer = document.getElementById('logo-container');
    const linkContainer = document.getElementById('link-container');
    const loadingMessage = document.getElementById('loading-message');
    const loader = document.getElementById('loader');
    const footerImageContainer = document.getElementById('footer-image-container');
    const countdownContainer = document.getElementById('countdown-container');
    let countdownIntervalId = null; // Per gestire il timer

    // --- Funzioni Helper ---
    // Estrae il valore di un campo gestendo casi undefined/null/vuoti
    const getField = (fields, fieldName, defaultValue = null) => {
        if (!fields) return defaultValue;
        const value = fields[fieldName];
        return (value !== undefined && value !== null && value !== '') ? value : defaultValue;
    };
    // Estrae l'URL del primo allegato (preferendo thumbnail grande)
    const getAttachmentUrl = (fields, fieldName) => {
        const attachments = getField(fields, fieldName);
        if (Array.isArray(attachments) && attachments.length > 0) {
            const firstAttachment = attachments[0];
            if (firstAttachment.thumbnails && firstAttachment.thumbnails.large) {
                return firstAttachment.thumbnails.large.url;
            }
            return firstAttachment.url;
        }
        return null;
    };

    // --- Funzione Principale di Caricamento (per index.html) ---
    async function loadData() {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (linkContainer) linkContainer.innerHTML = ''; // Pulisce link precedenti

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };

            // 1. Recupera il record di Configurazione (si assume ce ne sia solo uno)
            const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
            console.log("Fetch Config:", configUrl);
            const configResponse = await fetch(configUrl, { headers });
            if (!configResponse.ok) {
                // Log più dettagliato dell'errore API
                const errorBody = await configResponse.text();
                console.error("API Config Response Error Body:", errorBody);
                throw new Error(`Errore API Configurazione: ${configResponse.status}`);
            }
            const configResult = await configResponse.json();
            if (!configResult.records || configResult.records.length === 0) {
                throw new Error("Nessun record trovato nella tabella 'Configurazione'. Creane uno nella nuova base!");
            }
            const configRecord = configResult.records[0];
            const configFields = configRecord.fields;
            const configRecordId = configRecord.id; // Potrebbe non servire qui, ma utile per debug
            console.log("Config Data:", configFields, "ID:", configRecordId);

            // 2. Recupera i dettagli dei Link collegati tramite il campo 'Link Attivi'
            const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
            let linksData = [];
            let linksFieldsById = {};
            if (linkedLinkIds.length > 0) {
                // Costruisci la formula per recuperare solo i record con gli ID specificati
                const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
                const filterFormulaLinks = `OR(${recordIdFilter})`;
                const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaLinks)}`;
                console.log("Fetch Links:", linksUrl);
                const linksResponse = await fetch(linksUrl, { headers });
                if (linksResponse.ok) {
                    const linksResult = await linksResponse.json();
                    console.log("Links Data Raw:", linksResult.records);
                    if (linksResult.records) {
                        // Mappa i dati per ID per poterli riordinare facilmente
                        linksResult.records.forEach(rec => {
                            linksFieldsById[rec.id] = {
                                id: rec.id,
                                label: getField(rec.fields, fieldMap.links.label, 'Link ?'), // Default etichetta
                                url: getField(rec.fields, fieldMap.links.url),             // URL o 'menu.html'
                                color: getField(rec.fields, fieldMap.links.color, defaultButtonColor) // Colore o default
                            };
                        });
                    }
                } else {
                    // Logga un avviso ma continua se possibile
                    console.warn(`API Links Warning: ${linksResponse.status} ${await linksResponse.text()}`);
                }
                // Riordina i link nell'ordine specificato in 'Link Attivi'
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // --- Applica Configurazione Visiva ---

            // Sfondo
            const backgroundUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl);
            if (backgroundUrl) {
                document.body.style.backgroundImage = `url('${backgroundUrl}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
            } else {
                console.log("Nessuno sfondo in Airtable, mantenendo sfondo CSS.");
            }

            // Titolo Pagina
            const pageTitle = getField(configFields, fieldMap.config.title, 'Menu Pub'); // Titolo di default
            document.title = pageTitle;
            if (titleElement) {
                titleElement.textContent = pageTitle;
                const titleSize = getField(configFields, fieldMap.config.titleSize);
                if (titleSize) titleElement.style.fontSize = titleSize;
                else titleElement.style.fontSize = ''; // Resetta se non specificato
            }

            // Countdown Timer (Logica base)
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            const showCountdown = getField(configFields, fieldMap.config.showCountdown, false);
            const countdownTargetStr = getField(configFields, fieldMap.config.countdownTarget);
            const countdownLabel = getField(configFields, fieldMap.config.countdownLabel, '');
            if (countdownContainer && showCountdown === true && countdownTargetStr) {
                const targetDate = new Date(countdownTargetStr);
                if (!isNaN(targetDate)) {
                    const countdownLabelElement = document.getElementById('countdown-label');
                    if(countdownLabelElement) countdownLabelElement.textContent = countdownLabel;
                    const updateCountdown = () => {
                         const now = new Date().getTime(); const distance = targetDate.getTime() - now;
                         if(distance < 0){ clearInterval(countdownIntervalId); /* Gestisci fine */ return; }
                         const days = Math.floor(distance / (1000*60*60*24)); const hours = Math.floor((distance % (1000*60*60*24))/(1000*60*60)); const minutes = Math.floor((distance % (1000*60*60))/(1000*60)); const seconds = Math.floor((distance % (1000*60))/1000);
                         const de = document.getElementById('days'); const he = document.getElementById('hours'); const me = document.getElementById('minutes'); const se = document.getElementById('seconds');
                         if(de) de.textContent = String(days).padStart(2,'0'); if(he) he.textContent = String(hours).padStart(2,'0'); if(me) me.textContent = String(minutes).padStart(2,'0'); if(se) se.textContent = String(seconds).padStart(2,'0');
                    };
                    updateCountdown(); // Chiamata iniziale
                    countdownIntervalId = setInterval(updateCountdown, 1000);
                    countdownContainer.style.display = 'block'; // Mostra container
                } else { if (countdownContainer) countdownContainer.style.display = 'none'; } // Nascondi se data non valida
            } else { if (countdownContainer) countdownContainer.style.display = 'none'; } // Nascondi se non attivo

            // Loader (Logica base)
            const showLoader = getField(configFields, fieldMap.config.showLoader, false);
            if (loader) {
                 if (showLoader) {
                     loader.style.display = 'flex';
                     const loaderTextElement = document.getElementById('loading-text-container');
                     if (loaderTextElement) loaderTextElement.textContent = getField(configFields, fieldMap.config.loaderText, '');
                     // Applica altri stili loader se necessario (colore, width, speed)
                 } else {
                     loader.style.display = 'none';
                 }
            }

            // Logo
            const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl);
            logoContainer.innerHTML = ''; // Pulisce prima
            if (logoUrl) {
                const logoImg = document.createElement('img');
                logoImg.src = logoUrl;
                logoImg.alt = 'Logo'; // Potresti aggiungere un campo Alt per il logo
                logoContainer.appendChild(logoImg);
            }

            // Pulsanti Link (Ora crea solo <a>)
            linkContainer.innerHTML = ''; // Pulisce messaggio caricamento
            if (linksData && linksData.length > 0) {
                const buttonFontSize = getField(configFields, fieldMap.config.buttonFontSize);
                const buttonPadding = getField(configFields, fieldMap.config.buttonPadding);

                linksData.forEach(link => {
                    if (link.url) { // Crea il link solo se c'è un URL
                        const button = document.createElement('a');
                        button.href = link.url; // URL da Airtable (es. 'http://...', 'menu.html')
                        button.textContent = link.label;
                        button.className = 'link-button'; // Classe per lo stile

                        // Imposta target: _top per menu.html, _blank per altri link esterni
                        if (link.url.toLowerCase() === 'menu.html') {
                            button.target = '_top'; // Apre nella stessa finestra/tab
                        } else {
                            button.target = '_blank'; // Apre link esterni in nuova scheda
                            button.rel = 'noopener noreferrer'; // Sicurezza per target _blank
                        }

                        // Applica stile dal record o il default
                        button.style.background = link.color || defaultButtonColor;
                        if (buttonFontSize) button.style.fontSize = buttonFontSize;
                        if (buttonPadding) button.style.padding = buttonPadding;

                        linkContainer.appendChild(button);
                    } else {
                        // Logga link saltati perché non hanno URL
                        console.warn(`Link '${link.label}' skipped (no URL).`);
                    }
                });
            } else {
                // Messaggio se non ci sono link attivi collegati
                linkContainer.innerHTML = '<p>Nessun link attivo collegato alla configurazione.</p>';
            }

            // Immagine Footer
            const footerImageUrl = getAttachmentUrl(configFields, fieldMap.config.footerImageUrl);
            if (footerImageContainer) {
                 footerImageContainer.innerHTML = ''; // Pulisce prima
                 if (footerImageUrl) {
                    const footerImg = document.createElement('img');
                    footerImg.src = footerImageUrl;
                    footerImg.alt = getField(configFields, fieldMap.config.footerImageAlt, 'Footer Image'); // Usa Alt da Airtable o default
                    footerImageContainer.appendChild(footerImg);
                 }
            }

            // Nascondi messaggio di caricamento iniziale
            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) {
            // Gestione errori robusta
            console.error('FATAL ERROR loading data:', error);
             if (linkContainer) linkContainer.innerHTML = `<p class="error-message">Impossibile caricare i dati principali: ${error.message}</p>`;
             if (titleElement) titleElement.textContent = 'Errore'; document.title = 'Errore';
             if (loadingMessage) loadingMessage.style.display = 'none';
             if (loader) loader.style.display = 'none';
             if (countdownIntervalId) clearInterval(countdownIntervalId);
             if (countdownContainer) countdownContainer.style.display = 'none';
             document.body.classList.add('error-page'); // Applica stile di errore globale
        }
    }

    // Carica i dati all'avvio della pagina index.html
    loadData();
});
