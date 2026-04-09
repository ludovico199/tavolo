import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Input, Output, EventEmitter } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Ordine } from '../../Servizi/ordine';
import { catchError, forkJoin, of } from 'rxjs';
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class MenuComponent {
  @Input() isVisible: boolean = false;
  @Output() closeMenu = new EventEmitter<void>();

  tipologiaSelezionata: string | null = null;
  menu: any[] = [];
  tipologie: any[] = [];
  comandaId = 1;
  itemSelezionato: any | null = null;
  TurnoSelezionato: number | null = null;
  OrdineMenu: any[] = [];

  tavoloId: number | null = null;
  statoOrdine = 'in corso';
  numeroCoperti: number | null = null;
  listaOrdine: any[] = [];
  isCheckMenuVisible: boolean = false;
  ordineConfermato: any[] = [];
  ordiniEsistenti: any[] = [];

  listaOrdineGruppata: { [key: string]: any[] } = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], NO: []
  };

  ordiniCombinati = [...this.ordiniEsistenti, ...this.ordineConfermato];

  // Nuove proprietà per overlay “info ingredienti”
  infoOverlayVisible: boolean = false;
  infoItem: any | null = null;

  constructor(
    private http: HttpClient,
    private ordineService: Ordine,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.caricaMenu();
    this.ordineService.tavoloId$.subscribe(id => {
      this.tavoloId = id;
      this.recuperaOrdiniEsistenti();
    });

    this.ordineService.numeroCoperti$.subscribe(coperti => {
      this.numeroCoperti = coperti;
    });
  }
private caricaMenu(): void {

  const tipologie$ = this.http.get<any[]>('http://localhost:8000/api/tipologie')
    .pipe(
      catchError(() => {
        console.warn('⚠️ API tipologie non disponibile → uso tipologie.json');
        return this.http.get<any[]>('tipologie.json');
      })
    );

  const menu$ = this.http.get<any[]>('http://localhost:8000/api/menu')
    .pipe(
      catchError(() => {
        console.warn('⚠️ API menu non disponibile → uso menu.json');
        return this.http.get<any[]>('menu.json');
      })
    );

  forkJoin([tipologie$, menu$]).subscribe({
    next: ([tipologie, menu]) => {
      this.tipologie = tipologie;

      this.menu = menu.map(item => {
        const tipologia = this.tipologie.find(
          t => t.id === item.tipologia_id
        );

        return {
          ...item,
          quantita: 0,
          tipologia: tipologia?.descrittivo ?? 'Sconosciuto',
          colore: tipologia?.colore ?? '#ccc'
        };
      });

      this.cdr.detectChanges();
    },
    error: err => {
      console.error('❌ Errore nel caricamento di menu o tipologie', err);
    }
  });
}

  chiudiMenu() {
    this.closeMenu.emit();
    this.tipologie.forEach(t => t.attiva = false);
    this.tipologiaSelezionata = null;
    this.isCheckMenuVisible = false;
  }

  selezionaCategoria(tipologia: any) {
    if (this.tipologiaSelezionata === tipologia.descrittivo) {
      this.tipologiaSelezionata = null;
      tipologia.attiva = false;
    } else {
      this.tipologie.forEach(c => c.attiva = false);
      tipologia.attiva = true;
      this.tipologiaSelezionata = tipologia.descrittivo;
    }
  }

  apriGestioneQuantita(item: any) {
    this.itemSelezionato = item;
  }

  GestioneTurni(turno: number | string) {
    this.TurnoSelezionato = (this.TurnoSelezionato === turno || (this.TurnoSelezionato === 6 && turno === 'NO'))
      ? null
      : (turno === 'NO' ? 6 : turno as number);
  }

  chiudiGestioneQuantita(event: Event) {
    this.itemSelezionato = null;
    event.stopPropagation();
  }

  incrementa(item: any) {
    item.quantita++;
  }

  decrementa(item: any) {
    if (item.quantita > 0) {
      item.quantita--;

      if (item.quantita === 0) {
        if (!item.isServerData) {
          this.OrdineMenu = this.OrdineMenu.filter(i => !(i.menu_id === item.menu_id && i.comanda_id === item.comanda_id));
        }

        this.listaOrdine = this.listaOrdine.filter(i => !(i.menu_id === item.menu_id && i.comanda_id === item.comanda_id));

        this.listaOrdineGruppata = this.listaOrdine.reduce((acc, it) => {
          const turno = it.turno?.toString();
          if (!acc[turno]) acc[turno] = [];
          acc[turno].push(it);
          return acc;
        }, {});
      }
    }
  }

  CreaListaOrdine(item: any) {
    if (item.quantita > 0) {
      const turnoFinale = this.TurnoSelezionato ?? 6;
      const esistente = this.OrdineMenu.some(existingItem =>
        existingItem.menu_id === item.id && existingItem.comanda_id === turnoFinale
      );

      if (!esistente) {
        this.OrdineMenu.push({
          menu_id: item.id,
          nome: item.nome,
          prezzo: item.prezzo,
          quantita: item.quantita,
          note: item.note || '',
          comanda_id: turnoFinale,
        });
        item.quantita = 0;
        item.note = '';
        this.TurnoSelezionato = null;
        this.itemSelezionato = null;
      }
    }
  }

  inviaOrdine() {
    if (this.OrdineMenu.length > 0 && this.tavoloId && this.numeroCoperti !== null) {
      const turnoFinale = this.TurnoSelezionato ?? 6;

      const datiOrdine = {
        numero_coperti: this.numeroCoperti,
        stato_ordine: 1,
        tavolo_id: this.tavoloId,
        comanda_id: turnoFinale,
        menu_items: this.OrdineMenu.map(item => ({
          menu_id: item.menu_id,
          quantita: item.quantita,
          note: item.note || null,
          comanda_id: item.comanda_id ?? 6,
        })),
      };

      this.http.post('http://localhost:8000/api/crea-ordine', datiOrdine).pipe(
        catchError(() => {
          console.warn('⚠️ API non disponibile → salvo ordine in localStorage');
          this.salvaOrdineLocale(datiOrdine.tavolo_id, this.OrdineMenu);
          return of(null);
        })
      ).subscribe({
        next: (res) => {
          if (res !== null) {
            // API andata a buon fine: pulisco anche eventuali ordini locali
            localStorage.removeItem(`ordini_local_tavolo_${datiOrdine.tavolo_id}`);
          }
          this.OrdineMenu = [];
          this.aggiornaListaOrdine();
          this.isCheckMenuVisible = false;
          this.chiudiMenu();
        }
      });
    }
  }

  private salvaOrdineLocale(tavoloId: number, items: any[]) {
const chiave = `ordini_local_tavolo_${tavoloId}`;
    const esistenti = JSON.parse(localStorage.getItem(chiave) || '[]');

    items.forEach((item: any) => {
      const idx = esistenti.findIndex(
        (e: any) => e.menu_id === item.menu_id && e.comanda_id === item.comanda_id
      );
      if (idx >= 0) {
        esistenti[idx].quantita += item.quantita;
      } else {
        esistenti.push({ ...item });
      }
    });

    localStorage.setItem(chiave, JSON.stringify(esistenti));
  }

  CheckMenu() {
    this.recuperaOrdiniEsistenti();
    if (this.isCheckMenuVisible) {
      this.isCheckMenuVisible = false;
    } else {
      this.listaOrdine = [
        ...this.OrdineMenu.map(item => {
          const menuItem = this.menu.find(m => m.id === item.menu_id);
          return {
            ...item,
            nome: item.nome || menuItem?.nome || 'Voce sconosciuta',
            prezzo: item.prezzo || menuItem?.prezzo || 0,
            turno: item.comanda_id === 6 ? '6' : item.comanda_id,
            isServerData: false
          };
        }),
        ...this.ordiniEsistenti.map(item => {
          const menuItem = this.menu.find(m => m.id === item.menu_id);
          return {
            ...item,
            nome: item.nome || menuItem?.nome || 'Voce sconosciuta',
            prezzo: item.prezzo || menuItem?.prezzo || 0,
            turno: item.comanda_id ?? 'NO',
            isServerData: true
          };
        })
      ];

      this.listaOrdineGruppata = this.listaOrdine.reduce((acc, it) => {
        const turno = it.turno?.toString();
        if (!acc[turno]) acc[turno] = [];
        acc[turno].push(it);
        return acc;
      }, {
        '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], 'NO': []
      });

      this.isCheckMenuVisible = true;
    }
  }

  aggiornaListaOrdine() {
    this.recuperaOrdiniEsistenti();
    this.listaOrdine = [
      ...this.OrdineMenu.map(item => {
        const menuItem = this.menu.find(m => m.id === item.menu_id);
        return {
          ...item,
          nome: item.nome || menuItem?.nome || 'Voce sconosciuta',
          prezzo: item.prezzo || menuItem?.prezzo || 0,
          turno: item.comanda_id === 6 ? '6' : item.comanda_id,
          isServerData: false
        };
      }),
      ...this.ordiniEsistenti.map(item => {
        const menuItem = this.menu.find(m => m.id === item.menu_id);
        return {
          ...item,
          nome: item.nome || menuItem?.nome || 'Voce sconosciuta',
          prezzo: item.prezzo || menuItem?.prezzo || 0,
          turno: item.comanda_id ?? 'NO',
          isServerData: true
        };
      })
    ];

    this.listaOrdineGruppata = this.listaOrdine.reduce((acc, it) => {
      const turno = it.turno?.toString();
      if (!acc[turno]) acc[turno] = [];
      acc[turno].push(it);
      return acc;
    }, {});
  }

  rimuoviItem(item: any) {
    this.OrdineMenu = this.OrdineMenu.filter(i => i.menu_id !== item.menu_id || i.comanda_id !== item.comanda_id);
    this.listaOrdine = this.listaOrdine.filter(i => i.menu_id !== item.menu_id || i.comanda_id !== item.comanda_id);

    this.listaOrdineGruppata = this.listaOrdine.reduce((acc, it) => {
      const turno = it.turno?.toString();
      if (!acc[turno]) acc[turno] = [];
      acc[turno].push(it);
      return acc;
    }, {});
  }

  recuperaOrdiniEsistenti() {
    if (this.tavoloId) {
      this.http.get<any[]>(`http://localhost:8000/api/ordini?tavolo_id=${this.tavoloId}`).pipe(
        catchError(() => {
          console.warn('⚠️ API ordini non disponibile → uso localStorage');
          const chiave = `ordini_local_tavolo_${this.tavoloId}`;
          const locali = JSON.parse(localStorage.getItem(chiave) || '[]');
          return of(locali);
        })
      ).subscribe({
        next: (response) => {
          this.ordiniEsistenti = response;
          this.ordiniCombinati = [...this.ordiniEsistenti, ...this.ordineConfermato];
        }
      });
    }
  }
  mostraInfo(item: any) {
    this.infoItem = item;
    this.infoOverlayVisible = true;
  }
  chiudiInfo() {
    this.infoOverlayVisible = false;
    this.infoItem = null;
  }
}
