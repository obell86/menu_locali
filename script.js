document.addEventListener('DOMContentLoaded', () => {
    // --- Configurazione Airtable (NUOVI DATI) ---
    const AIRTABLE_BASE_ID = 'apppoL3fKAYnY0K1A'; // NUOVO ID BASE!
    const AIRTABLE_PAT = 'patJFPTb4KfYLzoRm.7e0b70399100110760879f5ee61be0740c647966f671cd58ab966fa3455d9278'; // NUOVO TOKEN!
    const CONFIG_TABLE_NAME = 'Configurazione'; // Assumiamo questo nome, lo creeremo
    const LINKS_TABLE_NAME = 'Links';           // Assumiamo questo nome, lo creeremo

    // Mappatura campi Airtable -> nomi chiave script (Useremo questi nomi quando creiamo le tabelle)
    const fieldMap = {
        config: {
            title: 'Titolo Pagina', titleSize: 'Dimensione Titolo', logoUrl: 'Logo',
            footerImageAlt: 'Alt Img Footer', footerImageUrl: 'Immagine Footer', backgroundUrl: 'Sfondo',
            showLoader: 'Mostra Loader', loaderText: 'Testo Loader', loaderBarColor: 'Colore Barra Loader',
            loaderTextSize: 'Dimensione Testo Loader', loaderWidth: 'Larghezza Loader', loaderBarSpeed: 'Velocità Barra Loader',
            buttonFontSize: 'Dimensione Font Pulsanti', buttonPadding: 'Padding Pulsanti',
            showCountdown: 'Mostra Countdown', countdownTarget: 'Data Target Countdown', countdownLabel: 'Etichetta Countdown',
            linkedLinks: 'Link Attivi', // Link ai record in tabella 'Links'
            configurazione: 'Configurazione' // Nome campo di collegamento (non serve in questa tabella)
        },
        links: {
            label: 'Etichetta', url: 'Scrivi URL', color: 'Scrivi Colore Pulsante'
            // Aggiungeremo 'Configurazione' (Link) e 'Stato Attivo' (Checkbox) in Airtable
        }
    };

    const defaultButtonColor = 'linear-gradient(45deg, #ccc, #eee)';

    // --- Elementi DOM ---
    const titleElement = document.getElementById('page-title');
    const logoContainer = document.getElementById('logo-container');
    const linkContainer = document.getElementById('link-container');
    const loadingMessage = document.getElementById('loading-message');
    const loader = document.getElementById('loader');
    const footerImageContainer = document.getElementById('footer-image-container');
    const countdownContainer = document.getElementById('countdown-container');
    // ... (altri elementi DOM countdown) ...
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
            if (!configResponse.ok) throw new Error(`API Config Error: ${configResponse.status} ${await configResponse.text()}`);
            const configResult = await configResponse.json();
            if (!configResult.records || configResult.records.length === 0) throw new Error("Nessun record trovato nella tabella 'Configurazione'. Creane uno!");
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
                    const linksResult = await linksResponse.json(); console.log("Links Data Raw:", linksResult.records);
                    if (linksResult.records) { linksResult.records.forEach(rec => { linksFieldsById[rec.id] = { id: rec.id, label: getField(rec.fields, fieldMap.links.label, '?'), url: getField(rec.fields, fieldMap.links.url), color: getField(rec.fields, fieldMap.links.color, defaultButtonColor) }; }); }
                } else { console.warn(`API Links Warning: ${linksResponse.status} ${await linksResponse.text()}`); }
                linksData = linkedLinkIds.map(id => linksFieldsById[id]).filter(link => link !== undefined);
            }
            console.log("Links Data Processed:", linksData);

            // --- Applica Configurazione Visiva ---
            // (Sfondo, Titolo, Countdown, Loader, Logo - codice omesso per brevità)
            const bgUrl=getAttachmentUrl(configFields,fieldMap.config.backgroundUrl);if(bgUrl){document.body.style.backgroundImage=`url('${bgUrl}')`;document.body.style.backgroundSize='cover';document.body.style.backgroundPosition='center center';document.body.style.backgroundRepeat='no-repeat';document.body.style.backgroundAttachment='fixed';}else{document.body.style.backgroundImage='none';}
            const pageTitle=getField(configFields,fieldMap.config.title,'Menu');document.title=pageTitle;if(titleElement){titleElement.textContent=pageTitle;const ts=getField(configFields,fieldMap.config.titleSize);if(ts)titleElement.style.fontSize=ts;else titleElement.style.fontSize='';}
            if(countdownIntervalId)clearInterval(countdownIntervalId);const showCD=getField(configFields,fieldMap.config.showCountdown,false);const cdTarget=getField(configFields,fieldMap.config.countdownTarget);const cdLabel=getField(configFields,fieldMap.config.countdownLabel,'');if(countdownContainer&&showCD===true&&cdTarget){const td=new Date(cdTarget);if(!isNaN(td)){const cel=document.getElementById('countdown-label');if(cel)cel.textContent=cdLabel;const upd=()=>{const n=new Date().getTime(),d=td.getTime()-n;if(d<0){clearInterval(countdownIntervalId);return;}const da=Math.floor(d/(1e3*60*60*24)),h=Math.floor((d%(1e3*60*60*24))/(1e3*60*60)),m=Math.floor((d%(1e3*60*60))/(1e3*60)),s=Math.floor((d%(1e3*60))/1e3);const de=document.getElementById('days'),he=document.getElementById('hours'),me=document.getElementById('minutes'),se=document.getElementById('seconds');if(de)de.textContent=String(da).padStart(2,'0');if(he)he.textContent=String(h).padStart(2,'0');if(me)me.textContent=String(m).padStart(2,'0');if(se)se.textContent=String(s).padStart(2,'0');};upd();countdownIntervalId=setInterval(upd,1e3);countdownContainer.style.display='block';}else{if(countdownContainer)countdownContainer.style.display='none';}}else{if(countdownContainer)countdownContainer.style.display='none';}
            const showL=getField(configFields,fieldMap.config.showLoader,false);if(loader){if(showL){loader.style.display='flex';const lt=document.getElementById('loading-text-container');if(lt)lt.textContent=getField(configFields,fieldMap.config.loaderText,'');}else{loader.style.display='none';}}
            const logoUrl=getAttachmentUrl(configFields,fieldMap.config.logoUrl);logoContainer.innerHTML='';if(logoUrl){const li=document.createElement('img');li.src=logoUrl;li.alt='Logo';logoContainer.appendChild(li);}


            // Pulsanti Link
            linkContainer.innerHTML = '';
            if (linksData && linksData.length > 0) {
                const btnFs = getField(configFields, fieldMap.config.buttonFontSize); const btnPad = getField(configFields, fieldMap.config.buttonPadding);
                linksData.forEach(link => {
                    if (link.url) {
                        const btn = document.createElement('a'); btn.href = link.url; btn.textContent = link.label; btn.className = 'link-button';
                        if (link.url.toLowerCase() === 'menu.html') { btn.target = '_top'; }
                        else { btn.target = '_blank'; btn.rel = 'noopener noreferrer'; }
                        btn.style.background = link.color || defaultButtonColor; if(btnFs) btn.style.fontSize = btnFs; if(btnPad) btn.style.padding = btnPad; linkContainer.appendChild(btn);
                    } else { console.warn(`Link '${link.label}' skipped (no URL).`); }
                });
            } else { linkContainer.innerHTML = '<p>Nessun link attivo collegato alla configurazione.</p>'; }

            // Immagine Footer
            const footerImageUrl=getAttachmentUrl(configFields,fieldMap.config.footerImageUrl);if(footerImageContainer){footerImageContainer.innerHTML='';if(footerImageUrl){const fi=document.createElement('img');fi.src=footerImageUrl;fi.alt=getField(configFields,fieldMap.config.footerImageAlt,'');footerImageContainer.appendChild(fi);}}


            if (loadingMessage) loadingMessage.style.display = 'none';

        } catch (error) {
            console.error('FATAL ERROR loading data:', error);
             if (linkContainer) linkContainer.innerHTML = `<p class="error-message">Impossibile caricare dati: ${error.message}</p>`;
             // ... (altre gestioni errore UI) ...
             if (loadingMessage) loadingMessage.style.display = 'none';
             document.body.classList.add('error-page');
        }
    }
    loadData();
});
