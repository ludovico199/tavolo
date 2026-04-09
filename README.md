# App Ordini

> Applicazione web per la gestione di un ristorante — ordini al tavolo, gestione del menu e pannello cucina, sviluppata con Angular.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/stato-in%20sviluppo-orange?style=flat-square)

---

## Panoramica

**App Ordini** è il frontend di un sistema gestionale per ristoranti, pensato per semplificare le operazioni quotidiane di sala e cucina. Il personale può aprire tavoli, impostare i coperti, prendere ordini dal menu e inviarli direttamente alla cucina — tutto da un'interfaccia semplice e veloce.

> Questo repository contiene **solo il frontend**. In assenza del backend, l'app funziona in modalità offline utilizzando **file JSON locali** e **LocalStorage**.

---

## Funzionalità

- **Gestione tavoli** — visualizza lo stato dei tavoli (libero/occupato), imposta i coperti e apri gli ordini
- **Menu per categorie** — ordina per tipologia, seleziona quantità, aggiungi note e assegna il turno di servizio
- **Invio ordini** — invia gli ordini al backend o salvali in locale se non disponibile
- **Pannello cucina** — visualizza in tempo reale gli ordini aperti e chiudili a completamento
- **Dashboard amministrativa** *(con backend)*— gestisci menu, categorie e tavoli tramite un pannello dedicato
- **Modalità offline** — tutti i dati vengono salvati in LocalStorage se il backend non è raggiungibile
- **Sincronizzazione automatica** — i tavoli si aggiornano ogni 5 secondi
- **Gestione magazzino** *(con backend)* — monitoraggio dell'inventario e disponibilità degli ingredienti

---

## Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Framework | Angular 21 (standalone components) |
| Linguaggio | TypeScript 5 |
| Stile | CSS personalizzato |
| Stato | RxJS + Services |
| Dati (offline) | File JSON + LocalStorage |
| Backend (produzione) | REST API su `localhost:8000` |

---

## Avvio rapido

### Requisiti

- Node.js ≥ 18
- Angular CLI ≥ 18

```bash
npm install -g @angular/cli
```

### Installazione

```bash
# Clona il repository
git clone https://github.com/ludovico199/tavolo.git
cd tavolo/AppOrdini

# Installa le dipendenze
npm install

# Avvia il server di sviluppo
ng serve
```

Apri [http://localhost:4200](http://localhost:4200) nel browser.

---

## Struttura del progetto

```
AppOrdini/src/app/
├── Componenti/
│   ├── tavoli/          # Vista principale — lista e gestione tavoli
│   ├── menu/            # Selezione piatti e invio ordini
│   ├── coperti/         # Impostazione numero coperti
│   ├── cucina/          # Pannello cucina con ordini attivi
│   └── dashboard/       # Pannello amministrativo
│       ├── menu/        # Gestione voci di menu
│       ├── categorie/   # Gestione tipologie
│       ├── tavoli/      # Gestione tavoli
│       └── ordini/      # Cronologia ordini
├── Servizi/
│   └── ordine.ts        # Stato condiviso (tavoloId, coperti)
└── app.routes.ts        # Routing principale
```

### Route disponibili

| Percorso | Descrizione |
|---|---|
| `/tavoli` | Vista principale (default) |
| `/cucina` | Pannello cucina |
| `/dashboard` | Pannello amministrativo |
| `/dashboard/menu` | Gestione menu |
| `/dashboard/categorie` | Gestione categorie |
| `/dashboard/tavoli` | Gestione tavoli |
| `/dashboard/ordini` | Cronologia ordini |

---

## Modalità offline

L'app è progettata per funzionare anche senza backend:

- **Menu e tipologie** — letti da `public/menu.json` e `public/tipologie.json`
- **Tavoli** — letti da `public/tavoli.json` e aggiornati in `localStorage`
- **Ordini** — salvati in `localStorage` con chiave `ordini_local_tavolo_{id}`
- **Cucina** — legge gli ordini locali se l'API non risponde

---

## Licenza

Questo progetto è distribuito sotto licenza MIT.
