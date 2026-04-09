import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

interface Piatto {
  nome: string;
  pivot: {
    quantita: number;
    note?: string;
    comanda_id?: number;
  };
}

interface Ordine {
  id: number;
  tavolo_id: number;
  stato_ordine_id: number;
  menu: Piatto[];
  groupedMenu?: { [turno: string]: Piatto[] };
  isLocal?: boolean;
}

@Component({
  selector: 'app-cucina',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cucina.html',
  styleUrls: ['./cucina.css']
})
export class CucinaComponent implements OnInit, OnDestroy {
  ordini: Ordine[] = [];
  private intervallo: any;
  private menuLocale: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:8000/api/menu').pipe(
      catchError(() => this.http.get<any[]>('menu.json'))
    ).subscribe(menu => {
      this.menuLocale = menu;
      this.caricaOrdini();
    });
    this.intervallo = setInterval(() => this.caricaOrdini(), 5000);
  }

  ngOnDestroy(): void {
    if (this.intervallo) clearInterval(this.intervallo);
  }

  private caricaOrdini(): void {
    this.http.get<Ordine[]>('http://localhost:8000/api/tutti-gli-ordini').pipe(
      catchError(() => {
        console.warn('⚠️ API cucina non disponibile → uso localStorage');
        return of(this.leggiOrdiniLocali());
      })
    ).subscribe({
      next: (response) => {
        this.ordini = response
          .filter(o => o.stato_ordine_id !== 2)
          .map(o => ({
            ...o,
            groupedMenu: this.groupByTurno(o.menu)
          }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Errore nel caricamento degli ordini:', err)
    });
  }

  private leggiOrdiniLocali(): Ordine[] {
    const ordini: Ordine[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const chiave = localStorage.key(i);
      if (!chiave?.startsWith('ordini_local_tavolo_')) continue;

      const tavoloId = parseInt(chiave.replace('ordini_local_tavolo_', ''), 10);
      const items = JSON.parse(localStorage.getItem(chiave) || '[]');

      if (items.length === 0) continue;

      const menu: Piatto[] = items.map((item: any) => {
        const menuItem = this.menuLocale.find((m: any) => m.id === item.menu_id);
        return {
          nome: item.nome || menuItem?.nome || 'Voce sconosciuta',
          pivot: {
            quantita: item.quantita,
            note: item.note || '',
            comanda_id: item.comanda_id
          }
        };
      });

      ordini.push({
        id: tavoloId,
        tavolo_id: tavoloId,
        stato_ordine_id: 1,
        menu,
        isLocal: true
      });
    }

    return ordini;
  }

  private groupByTurno(menu: Piatto[]): { [turno: string]: Piatto[] } {
    return menu.reduce((acc, piatto) => {
      const turno = piatto.pivot.comanda_id != null
        ? piatto.pivot.comanda_id.toString()
        : 'NO';
      (acc[turno] = acc[turno] || []).push(piatto);
      return acc;
    }, {} as { [turno: string]: Piatto[] });
  }

  getTurni(o: Ordine): string[] {
    return Object.keys(o.groupedMenu || {});
  }

  chiudiOrdine(ordine: Ordine): void {
    if (ordine.isLocal) {
      localStorage.removeItem(`ordini_local_tavolo_${ordine.tavolo_id}`);
      this.caricaOrdini();
      return;
    }

    this.http.put(`http://localhost:8000/api/ordini/${ordine.id}/chiudi`, {}).pipe(
      catchError(() => {
        console.warn('⚠️ API chiusura non disponibile → rimuovo da localStorage');
        localStorage.removeItem(`ordini_local_tavolo_${ordine.tavolo_id}`);
        return of(null);
      })
    ).subscribe({
      next: () => this.caricaOrdini()
    });
  }
}
