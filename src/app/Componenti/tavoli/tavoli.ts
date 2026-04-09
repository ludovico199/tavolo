import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApplicationRef, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import { Ordine } from '../../Servizi/ordine';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuComponent } from '../menu/menu';
import { CopertiComponent } from '../coperti/coperti';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-tavoli',
  imports: [CommonModule, FormsModule, MenuComponent, CopertiComponent],
  templateUrl: './tavoli.html',
  styleUrl: './tavoli.css',
})
export class Tavoli {

tavoli: any[] = [];
  tavoloSelezionato: any = null;
  tavoloStatus: string = 'Terminato';
  tavolocosto: number = 0;
  private destroy$ = new Subject<void>();
  private tavoliInterval: any = null;

  isMenuVisible: boolean = false;
  isCopertiVisible: boolean = false;
  TavoloAperto: boolean = false;
  comandaId: number = 1;

  ordineAperto: boolean = false;
  ordineSelezionato: any = null;

  constructor(
    private OrdineService: Ordine,
    private http: HttpClient,
    private applicationRef: ApplicationRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.caricaTavoli();
    this.ascoltaCoperti();
    this.applicationRef.isStable
      .pipe(first(isStable => isStable))
      .subscribe(() => this.iniziaControlloTavoli());

    this.OrdineService.tavoloId$.subscribe();
    this.OrdineService.numeroCoperti$.subscribe();
    this.OrdineService.tavoloStatus$.subscribe(status => {
      this.tavoloStatus = status;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.fermaAggiornamentoTavoli();
  }

  private iniziaControlloTavoli() {
    if (!this.tavoliInterval) {
      this.tavoliInterval = setInterval(() => {
        if (
          !this.isMenuVisible &&
          !this.isCopertiVisible &&
          !this.TavoloAperto &&
          !this.ordineAperto
        ) {
          this.caricaTavoli();
        }
      }, 5000);
    }
  }

  private fermaAggiornamentoTavoli() {
    if (this.tavoliInterval) {
      clearInterval(this.tavoliInterval);
      this.tavoliInterval = null;
    }
  }

caricaTavoli(): void {

  this.http.get<any[]>('http://localhost:8000/api/tavoli')
    .pipe(
      catchError(() => {
        console.warn("⚠️ API non disponibile → uso localStorage");

        const tavoliLocal = localStorage.getItem('tavoli_local');

        if (tavoliLocal) {
          return of(JSON.parse(tavoliLocal));
        } else {
          return of([]);
        }

      })
    )
    .subscribe({
      next: response => {
        this.processaTavoli(response);

        // ✅ salvo sempre l’ultima versione valida
        localStorage.setItem('tavoli_local', JSON.stringify(response));
      },
      error: err => console.error("❌ Nessun dato disponibile:", err)
    });
}
private processaTavoli(response: any[]): void {

  this.tavoli = response.map(tavolo => {

    const righeOrdine = tavolo.righe_ordine ?? [];

    const ordini: any[] = [];

    righeOrdine.forEach((item: any) => {

      const nome = item.menu?.nome || 'Voce sconosciuta';
      const prezzo = item.menu?.prezzo || 0;
      const quantita = item.quantita || 0;
      const note = item.note || '';

      const esistente = ordini.find(o =>
        o.nome === nome &&
        o.prezzo === prezzo &&
        o.note === note
      );

      if (esistente) {

        esistente.quantita += quantita;

      } else {

        ordini.push({
          nome,
          prezzo,
          quantita,
          note
        });

      }

    });

    const ordiniLocali = JSON.parse(
      localStorage.getItem(`ordini_local_tavolo_${tavolo.id}`) || '[]'
    );

    ordiniLocali.forEach((item: any) => {
      const esistente = ordini.find(o =>
        o.nome === item.nome && o.note === (item.note || '')
      );
      if (esistente) {
        esistente.quantita += item.quantita;
      } else {
        ordini.push({
          nome: item.nome || 'Voce sconosciuta',
          prezzo: item.prezzo || 0,
          quantita: item.quantita,
          note: item.note || ''
        });
      }
    });

    const stato =
      ordini.length > 0
        ? 'IN CORSO'
        : 'TERMINATO';

    return {
      ...tavolo,
      ordini,
      stato
    };

  });

  if (this.tavoloSelezionato) {

    this.tavoloSelezionato =
      this.tavoli.find(
        t => t.id === this.tavoloSelezionato.id
      ) || null;

  }

  this.cdr.detectChanges();

}



  toggleMenu(tavolo: any, event: MouseEvent): void {
    event.stopPropagation();
    const isCurrentlyOpen = tavolo.mostraMenu;
    this.tavoli.forEach(t => t.mostraMenu = false);
    tavolo.mostraMenu = !isCurrentlyOpen;
  }

  chiudiTavolo(tavolo: any, event: MouseEvent): void {
    event.stopPropagation();
    tavolo.mostraMenu = false;

    // Pulisce sempre gli ordini locali
    localStorage.removeItem(`ordini_local_tavolo_${tavolo.id}`);

    this.http.put(`http://localhost:8000/api/coperti/${tavolo.id}`, { coperti: 0 }).pipe(
      catchError(() => {
        console.warn('⚠️ API non disponibile → azzero coperti in localStorage');
        const tavoliLocal = JSON.parse(localStorage.getItem('tavoli_local') || '[]');
        const idx = tavoliLocal.findIndex((t: any) => t.id === tavolo.id);
        if (idx >= 0) {
          tavoliLocal[idx].numero_coperti = 0;
          localStorage.setItem('tavoli_local', JSON.stringify(tavoliLocal));
        }
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.chiudiOverlay();
        this.caricaTavoli();
      }
    });
  }

  private ascoltaCoperti() {
    if (this.tavoloSelezionato) {
      const tavoloId = this.tavoloSelezionato.id;
      const coperti = this.tavoloSelezionato.numero_coperti;

      this.http.put(`http://localhost:8000/api/coperti/${tavoloId}`, { coperti }).subscribe({
        next: () => this.caricaTavoli(),
        error: (err) => console.error('Errore nell\'aggiornamento dei coperti:', err)
      });
    }
  }

  selezionaTavolo(id: number) {
    this.OrdineService.setTavoloId(id);
    const tavolo = this.tavoli.find(t => t.id === id);
    if (tavolo) {
      this.OrdineService.setTavoloEcoperti(tavolo.id, tavolo.numero_coperti);
    }
  }

  getClasseTavolo(tavolo: any): string {
    const coperti = Number(tavolo.numero_coperti || 0);
    return coperti > 0 ? 'tavolo_occupato' : 'tavolo_libero';
  }

  toggleVisibility(tavolo: any) {
    tavolo.hideDetails = !tavolo.hideDetails;
    this.cdr.detectChanges();
  }

  chiudiMenu(): void {
    this.TavoloAperto = false;
    this.isMenuVisible = false;
    this.isCopertiVisible = false;
    this.caricaTavoli();
    this.riprendiAggiornamentoTavoli();
  }

  chiudiCoperti(): void {
    this.TavoloAperto = false;
    this.isMenuVisible = false;
    this.isCopertiVisible = false;
    this.caricaTavoli();
    this.riprendiAggiornamentoTavoli();
  }

  gestiscitavolo(tavolo: any) {
    this.selezionaTavolo(tavolo.id);
    this.TavoloAperto = true;

    if (tavolo.numero_coperti === 0) {
      this.apricopoerti(tavolo);
    } else {
      this.aprimenu(tavolo);
    }

    this.cdr.detectChanges();
  }

  dopoSalvaCoperti(numeroCoperti: number): void {
    if (this.tavoloSelezionato) {
      this.OrdineService.setTavoloEcoperti(this.tavoloSelezionato.id, numeroCoperti);
    }
    this.isCopertiVisible = false;
    this.isMenuVisible = true;
    this.caricaTavoli();
  }

  aprimenu(_tavolo: any): void {
    this.TavoloAperto = true;
    this.isMenuVisible = true;
    this.fermaAggiornamentoTavoli();
  }

  apricopoerti(tavolo: any): void {
    this.tavoloSelezionato = tavolo;
    this.isCopertiVisible = true;
    this.fermaAggiornamentoTavoli();
  }

  riprendiAggiornamentoTavoli() {
    if (!this.isMenuVisible && !this.isCopertiVisible && !this.TavoloAperto && !this.ordineAperto) {
      this.iniziaControlloTavoli();
    }
  }

  apriOrdine(tavolo: any, event: MouseEvent): void {
    event.stopPropagation();
    this.ordineSelezionato = tavolo;
    this.ordineAperto = true;
    this.fermaAggiornamentoTavoli();
  }

  chiudiOverlay(): void {
    this.ordineAperto = false;
    this.riprendiAggiornamentoTavoli();
  }

  getTotale(ordini: any[]): number {
    return ordini?.reduce((sum, o) => sum + ((o.prezzo || 0) * (o.quantita || 1)), 0) || 0;
  }
}

