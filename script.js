document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable (NUOVI DATI) ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A'; // NUOVO ID BASE!
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278'; // NUOVO TOKEN!
    const CONFIG_TABLE_NAME = 'Configurazione'; // VERIFICA NOME ESATTO
    const LINKS_TABLE_NAME = 'Links';           // VERIFICA NOME ESATTO

    // Mappatura campi Airtable -> nomi chiave script (VERIFICA NOMI CAMPO vs NUOVA BASE)
    const fieldMap = {
        config: {
            title: 'Titolo Pagina', titleSize: 'Dimensione Titolo', logoUrl: 'Logo',
            footerImageAlt: 'Alt Img Footer', footerImageUrl: 'Immagine Footer', backgroundUrl: 'Sfondo',
            showLoader: 'Mostra Loader', loaderText: 'Testo Loader', loaderBarColor: 'Colore Barra Loader',
            loaderTextSize: 'Dimensione Testo Loader', loaderWidth: 'Larghezza Loader', loaderBarSpeed: 'Velocità Barra Loader',
            buttonFontSize: 'Dimensione Font Pulsanti', buttonPadding: 'Padding Pulsanti',
            showCountdown: 'Mostra Countdown', countdownTarget: 'Data Target Countdown', countdownLabel: 'Etichetta Countdown',
            linkedLinks: 'Link Attivi'
        },
        links: { label: 'Etichetta', url: 'Scrivi URL', color: 'Scrivi Colore Pulsante' }
    };

    const defaultButtonColor = 'linear-gradient(180deg, #8a6d3b 0%, #6a512f 100%)';

    // --- Elementi DOM ---
    const titleElement = document.getElementById('page-title');
    const logoContainer = document.getElementById('logo-container');
    const linkContainer = document.getElementById('link-container');
    const loadingMessage = document.getElementById('loading-message');
    const loader = document.getElementById('loader'); // Contenitore loader
    const footerImageContainer = document.getElementById('footer-image-container');
    // Countdown Elements
    const countdownContainer = document.getElementById('countdown-container');
    const countdownLabelElement = document.getElementById('countdown-label');
    const countdownTimerDiv = document.getElementById('countdown-timer'); // Div per i numeri
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const countdownMessageElement = document.getElementById('countdown-message');
    let countdownIntervalId = null;

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => { if (!fields) return defaultValue; const value = fields[fieldName]; return (value !== undefined && value !== null && value !== '') ? value : defaultValue; };
    const getAttachmentUrl = (fields, fieldName) => { const attach = getField(fields, fieldName); if (Array.isArray(attach) && attach.length > 0) { const first = attach[0]; if (first.thumbnails && first.thumbnails.large) { return first.thumbnails.large.url; } return first.url; } return null; };

    // --- Funzione Principale di Caricamento ---
    async function loadData() {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (linkContainer) linkContainer.innerHTML = '';

        try {
            const headers = { Authorization: `Bearer ${AIRTABLE_PAT}` };

            // 1. Recupera Configurazione
            const configUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG_TABLE_NAME)}?maxRecords=1`;
            console.log("Fetch Config:", configUrl);
            const configResponse = await fetch(configUrl, { headers });
            if (!configResponse.ok) { const errBody = await configResponse.text(); console.error("API Config Error Body:", errBody); throw new Error(`API Config Error: ${configResponse.status}`); }
            const configResult = await configResponse.json();
            if (!configResult.records || configResult.records.length === 0) { throw new Error("Nessun record Configurazione trovato."); }
            const configRecord = configResult.records[0];
            const configFields = configRecord.fields;
            const configRecordId = configRecord.id;
            console.log("Config Data:", configFields, "ID:", configRecordId);

            // 2. Recupera Links Collegati
            const linkedLinkIds = getField(configFields, fieldMap.config.linkedLinks, []);
            let linksData = []; let linksFieldsById = {};
            if (linkedLinkIds.length > 0) {
                const recordIdFilter = linkedLinkIds.map(id => `RECORD_ID()='${id}'`).join(',');
                const filterFormulaLinks = `OR(${recordIdFilter})`;
                const linksUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(LINKS_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormulaLinks)}`;
                console.log("Fetch Links:", linksUrl);
                const linksResponse = await fetch(linksUrl, { headers });
                if (linksResponse.ok) { const linksResult = await linksResponse.json(); console.log("Links Data Raw:", linksResult.records); if (linksResult.records) { linksResult.records.forEach(rec => { linksFieldsById[rec.id] = { id: rec.id, label: getField(rec.fields, fieldMap.links.label, '?'), url: getField(rec.fields, fieldMap.links.url), color: getField(rec.fields, fieldMap.links.color, defaultButtonColor) }; }); } }
                else { console.warn(`API Links Warning: ${linksResponse.status} ${await linksResponse.text()}`); }
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // --- Applica Configurazione Visiva ---

            // *** Sfondo (MODIFICATO per non sovrascrivere CSS) ***
            const backgroundUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl);
            if (backgroundUrl) {
                console.log("Applicando sfondo da Airtable:", backgroundUrl);
                document.body.style.backgroundImage = `url('${backgroundUrl}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
            } else {
                console.log("Nessuno sfondo in Airtable, mantenendo sfondo CSS.");
                // Non impostiamo nulla per mantenere lo sfondo del CSS
            }

            // Titolo Pagina (Invariato dalla tua versione funzionante)
            const pageTitle = getField(configFields, fieldMap.config.title, 'Menu Pub');
            document.title = pageTitle;
            if (titleElement) {
                titleElement.textContent = pageTitle;
                const titleSize = getField(configFields, fieldMap.config.titleSize);
                if (titleSize) titleElement.style.fontSize = titleSize;
                else titleElement.style.fontSize = '';
            }

            // *** Countdown Timer (Logica Completa INSERITA) ***
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            const showCountdown = getField(configFields, fieldMap.config.showCountdown, false);
            const countdownTargetStr = getField(configFields, fieldMap.config.countdownTarget);
            const countdownLabel = getField(configFields, fieldMap.config.countdownLabel, '');

            if (countdownContainer && countdownLabelElement && countdownTimerDiv && daysElement && hoursElement && minutesElement && secondsElement && countdownMessageElement) {
                if (showCountdown === true && countdownTargetStr) {
                    const targetDate = new Date(countdownTargetStr);
                    // *** CONTROLLO CHIAVE: Data valida E FUTURA ***
                    if (!isNaN(targetDate) && targetDate.getTime() > Date.now()) {
                        console.log("Avvio Countdown verso:", targetDate);
                        countdownLabelElement.textContent = countdownLabel;
                        countdownMessageElement.style.display = 'none';
                        countdownTimerDiv.style.display = 'block';
                        const updateCountdown = () => {
                             const now = new Date().getTime(); const distance = targetDate.getTime() - now;
                             if(distance < 0){ clearInterval(countdownIntervalId); countdownTimerDiv.style.display = 'none'; countdownLabelElement.style.display = 'none'; countdownMessageElement.textContent = "Tempo Scaduto!"; countdownMessageElement.style.display = 'block'; console.log("Countdown terminato."); return; }
                             const days = Math.floor(distance / (1000*60*60*24)); const hours = Math.floor((distance % (1000*60*60*24))/(1000*60*60)); const minutes = Math.floor((distance % (1000*60*60))/(1000*60)); const seconds = Math.floor((distance % (1000*60))/1000);
                             daysElement.textContent = String(days).padStart(2,'0'); hoursElement.textContent = String(hours).padStart(2,'0'); minutesElement.textContent = String(minutes).padStart(2,'0'); secondsElement.textContent = String(seconds).padStart(2,'0');
                        };
                        updateCountdown();
                        countdownIntervalId = setInterval(updateCountdown, 1000);
                        countdownContainer.style.display = 'block';
                    } else { console.log("Countdown non avviato: data non valida o passata.", countdownTargetStr); if (countdownContainer) countdownContainer.style.display = 'none'; }
                } else { console.log("Countdown disattivato nelle impostazioni."); if (countdownContainer) countdownContainer.style.display = 'none'; }
            } else { console.warn("Elementi HTML del Countdown mancanti."); if (countdownContainer) countdownContainer.style.display = 'none'; }

            // *** Loader (Logica Completa INSERITA per stili dinamici) ***
            const showLoader = getField(configFields, fieldMap.config.showLoader, false);
            if (loader) {
                 if (showLoader) {
                     loader.style.display = 'flex';
                     const loaderTextElement = document.getElementById('loading-text-container');
                     const loaderBarElement = loader.querySelector('.loader-bar'); // Cerca DENTRO il loader

                     if (loaderTextElement) { loaderTextElement.textContent = getField(configFields, fieldMap.config.loaderText, 'Caricamento...'); }
                     if (loaderBarElement) { // Applica stili solo se la barra esiste
                         const barColor = getField(configFields, fieldMap.config.loaderBarColor);
                         const barSpeed = getField(configFields, fieldMap.config.loaderBarSpeed);
                         if (barColor) { loaderBarElement.style.backgroundColor = barColor; console.log("Colore barra:", barColor); }
                         if (typeof barSpeed === 'number' && barSpeed > 0) { loaderBarElement.style.animationDuration = barSpeed + 's'; console.log("Velocità barra:", barSpeed); }
                         else { loaderBarElement.style.animationDuration = ''; } // Reset se non valido
                     } else { console.warn("Elemento .loader-bar non trovato."); }
                     if (loaderTextElement) {
                          const textSize = getField(configFields, fieldMap.config.loaderTextSize);
                          if (textSize) { loaderTextElement.style.fontSize = textSize; console.log("Dim txt loader:", textSize); }
                          else { loaderTextElement.style.fontSize = ''; } // Reset
                     }
                     const loaderWidth = getField(configFields, fieldMap.config.loaderWidth);
                     if (loaderWidth) { loader.style.width = loaderWidth; loader.style.maxWidth = 'none'; console.log("Width loader:", loaderWidth); }
                     else { loader.style.width = ''; loader.style.maxWidth = ''; } // Reset

                 } else {
                     loader.style.display = 'none';
                 }
            } else { console.warn("Elemento #loader non trovato."); }

            // Logo (Invariato dalla tua versione funzionante)
            const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl); logoContainer.innerHTML = ''; if (logoUrl) { const li = document.createElement('img'); li.src = logoUrl; li.alt = 'Logo'; logoContainer.appendChild(li); }

            // Pulsanti Link (Invariato dalla tua versione funzionante - crea solo <a>)
            linkContainer.innerHTML = ''; if (linksData && linksData.length > 0) { const btnFs = getField(configFields, fieldMap.config.buttonFontSize); const btnPad = getField(configFields, fieldMap.config.buttonPadding); linksData.forEach(link => { if (link.url) { const btn = document.createElement('a'); btn.href = link.url; btn.textContent = link.label; btn.className = 'link-button'; if (link.url.toLowerCase() === 'menu.html') { btn.target = '_top'; } else { btn.target = '_blank'; btn.rel = 'noopener noreferrer'; } btn.style.background = link.color || defaultButtonColor; if(btnFs) btn.style.fontSize = btnFs; if(btnPad) btn.style.padding = btnPad; linkContainer.appendChild(btn); } else { console.warn(`Link '${link.label}' skipped (no URL).`); } }); } else { linkContainer.innerHTML = '<p>Nessun link attivo collegato.</p>'; }

            // Immagine Footer (Invariato dalla tua versione funzionante)
            const footerImageUrl=getAttachmentUrl(configFields,fieldMap.config.footerImageUrl);if(footerImageContainer){footerImageContainer.innerHTML='';if(footerImageUrl){const fi=document.createElement('img');fi.src=footerImageUrl;fi.alt=getField(configFields,fieldMap.config.footerImageAlt,'');footerImageContainer.appendChild(fi);}}

            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) { /* ... (Gestione Errore Invariata) ... */ }
    }
    loadData();
});
