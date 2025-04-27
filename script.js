document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable ---
    const AIRTABLE_BASE_ID = 'appw09DNLfGZ6OONF'; // ID Base Corretto!
    const AIRTABLE_PAT = 'patis2AK0YC19Zq7b.abd2a8095f2d7dc56dda2f2ae255813a6daaf57fab14372bd8b6915e4d10dd0b'; // Token Corretto!
    const CONFIG_TABLE_NAME = 'Configurazione';
    const LINKS_TABLE_NAME = 'Links';
    // Nomi tabelle menu non servono più qui se la logica è separata
    // const MENU_CATEGORIE_TABLE_NAME = 'Menu_Categorie';
    // const MENU_ARTICOLI_TABLE_NAME = 'Menu_Articoli';

    // Mappatura campi Airtable -> nomi chiave script
    const fieldMap = {
        config: {
            title: 'Titolo Pagina',
            titleSize: 'Dimensione Titolo',
            logoUrl: 'Logo',
            footerImageAlt: 'Alt Img Footer',
            footerImageUrl: 'Immagine Footer',
            backgroundUrl: 'Sfondo',
            showLoader: 'Mostra Loader',
            loaderText: 'Testo Loader',
            loaderBarColor: 'Colore Barra Loader',
            loaderTextSize: 'Dimensione Testo Loader',
            loaderWidth: 'Larghezza Loader',
            loaderBarSpeed: 'Velocità Barra Loader',
            buttonFontSize: 'Dimensione Font Pulsanti',
            buttonPadding: 'Padding Pulsanti',
            showCountdown: 'Mostra Countdown',
            countdownTarget: 'Data Target Countdown',
            countdownLabel: 'Etichetta Countdown',
            linkedLinks: 'Link Attivi', // Link ai Links da mostrare
            configurazione: 'Configurazione'
        },
        links: {
            label: 'Etichetta',
            url: 'Scrivi URL', // Qui ci sarà 'menu.html'
            color: 'Scrivi Colore Pulsante'
        }
        // Mappe menu rimosse da qui
    };

    const defaultButtonColor = 'linear-gradient(45deg, #ccc, #eee)';

    // --- Elementi DOM ---
    const titleElement = document.getElementById('page-title');
    const logoContainer = document.getElementById('logo-container');
    const linkContainer = document.getElementById('link-container');
    const loadingMessage = document.getElementById('loading-message');
    const loader = document.getElementById('loader');
    const loaderTextElement = document.getElementById('loading-text-container');
    const loaderBarElement = loader ? loader.querySelector('.loader-bar') : null;
    const footerImageContainer = document.getElementById('footer-image-container');
    const countdownContainer = document.getElementById('countdown-container');
    const countdownLabelElement = document.getElementById('countdown-label');
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    const countdownMessageElement = document.getElementById('countdown-message');
    let countdownIntervalId = null;
    // Sezione Menu non serve più qui
    // const menuSection = document.getElementById('menu-section');
    // const menuContent = document.getElementById('menu-content');

    // --- Funzioni Helper ---
    const getField = (fields, fieldName, defaultValue = null) => {
        if (!fields) return defaultValue;
        return (fields[fieldName] !== undefined && fields[fieldName] !== null && fields[fieldName] !== '') ? fields[fieldName] : defaultValue;
    };
    const getAttachmentUrl = (fields, fieldName) => {
        const attachments = getField(fields, fieldName);
        if (Array.isArray(attachments) && attachments.length > 0) {
            const firstAttachment = attachments[0];
            if (firstAttachment.thumbnails && firstAttachment.thumbnails.large) { return firstAttachment.thumbnails.large.url; }
            return firstAttachment.url;
        }
        return null;
    };

    // Funzioni Menu (toggleMenu, renderMenu, addAccordionListeners) RIMOSSE da qui

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
            if (!configResponse.ok) throw new Error(`API Config Error: ${configResponse.status} ${await configResponse.text()}`);
            const configResult = await configResponse.json();
            if (!configResult.records || configResult.records.length === 0) throw new Error("No config record found.");
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
                if (linksResponse.ok) {
                    const linksResult = await linksResponse.json();
                    console.log("Links Data Raw:", linksResult.records);
                    if (linksResult.records) { linksResult.records.forEach(rec => { linksFieldsById[rec.id] = { id: rec.id, label: getField(rec.fields, fieldMap.links.label, '?'), url: getField(rec.fields, fieldMap.links.url), color: getField(rec.fields, fieldMap.links.color, defaultButtonColor) }; }); }
                } else { console.warn(`API Links Warning: ${linksResponse.status}`); }
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // Chiamate Menu RIMOSSE da qui

            // Elaborazione Menu RIMOSSA da qui

            // --- Applica Configurazione Visiva ---
            // (Sfondo, Titolo, Countdown, Loader, Logo - codice omesso per brevità, è invariato)
             const backgroundUrl = getAttachmentUrl(configFields, fieldMap.config.backgroundUrl); if (backgroundUrl) { document.body.style.backgroundImage = `url('${backgroundUrl}')`; document.body.style.backgroundSize = 'cover'; document.body.style.backgroundPosition = 'center center'; document.body.style.backgroundRepeat = 'no-repeat'; document.body.style.backgroundAttachment = 'fixed';} else { document.body.style.backgroundImage = 'none'; }
             const pageTitle = getField(configFields, fieldMap.config.title, 'Menu'); document.title = pageTitle; if (titleElement) { titleElement.textContent = pageTitle; const ts = getField(configFields, fieldMap.config.titleSize); if(ts) titleElement.style.fontSize = ts; else titleElement.style.fontSize = ''; }
             if (countdownIntervalId) clearInterval(countdownIntervalId); const showCD = getField(configFields, fieldMap.config.showCountdown, false); const cdTarget = getField(configFields, fieldMap.config.countdownTarget); const cdLabel = getField(configFields, fieldMap.config.countdownLabel, ''); if (countdownContainer && showCD === true && cdTarget) { const td = new Date(cdTarget); if(!isNaN(td)){ if(countdownLabelElement) countdownLabelElement.textContent = cdLabel; const updateCD = ()=>{/*logica*/}; updateCD(); countdownIntervalId = setInterval(updateCD, 1000); countdownContainer.style.display = 'block';} else {if(countdownContainer) countdownContainer.style.display = 'none';}} else {if(countdownContainer) countdownContainer.style.display = 'none';}
             const showL = getField(configFields, fieldMap.config.showLoader, false); if (loader) { if(showL){ loader.style.display = 'flex';} else { loader.style.display = 'none';}}
             const logoUrl = getAttachmentUrl(configFields, fieldMap.config.logoUrl); logoContainer.innerHTML = ''; if (logoUrl) { const logoImg = document.createElement('img'); logoImg.src = logoUrl; logoImg.alt = 'Logo'; logoContainer.appendChild(logoImg); }


            // Pulsanti Link (Senza gestione #menu)
            linkContainer.innerHTML = '';
            if (linksData && linksData.length > 0) {
                const buttonFontSize = getField(configFields, fieldMap.config.buttonFontSize);
                const buttonPadding = getField(configFields, fieldMap.config.buttonPadding);

                linksData.forEach(link => {
                    if (link.url) { // Controlla solo se l'URL esiste
                        const button = document.createElement('a'); // Sempre <a> ora
                        button.href = link.url; // Usa l'URL da Airtable (es. 'menu.html')
                        button.textContent = link.label;
                        button.className = 'link-button';

                        // Apri menu.html nella stessa scheda, altri link in nuova scheda
                        if (link.url.toLowerCase() === 'menu.html') {
                            button.target = '_top';
                        } else {
                            button.target = '_blank';
                            button.rel = 'noopener noreferrer';
                        }

                        button.style.background = link.color || defaultButtonColor;
                        if (buttonFontSize) button.style.fontSize = buttonFontSize;
                        if (buttonPadding) button.style.padding = buttonPadding;
                        linkContainer.appendChild(button);
                    } else {
                        console.warn(`Link '${link.label}' skipped (no URL).`);
                    }
                });
            } else {
                linkContainer.innerHTML = '<p>Nessun link attivo.</p>';
            }


            // Immagine Footer
             const footerImageUrl = getAttachmentUrl(configFields, fieldMap.config.footerImageUrl); if (footerImageContainer) { footerImageContainer.innerHTML = ''; if(footerImageUrl){ const fImg=document.createElement('img'); fImg.src=footerImageUrl; fImg.alt=getField(configFields, fieldMap.config.footerImageAlt, ''); footerImageContainer.appendChild(fImg);}}

            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('FATAL ERROR loading data:', error);
             if (linkContainer) linkContainer.innerHTML = `<p class="error-message">Impossibile caricare i dati: ${error.message}</p>`;
             if (titleElement) titleElement.textContent = 'Errore'; document.title = 'Errore';
             if (loadingMessage) loadingMessage.style.display = 'none'; if (loader) loader.style.display = 'none'; /* Rimosso controllo menuSection */ if (countdownIntervalId) clearInterval(countdownIntervalId); if (countdownContainer) countdownContainer.style.display = 'none'; document.body.classList.add('error-page');
        }
    }

    // Carica i dati all'avvio
    loadData();
});
