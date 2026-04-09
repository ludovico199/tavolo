import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, formatDate, registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { MenuDashboardService, Ordine } from '../../servizi/menu-dashboard.service';

registerLocaleData(localeIt, 'it-IT');

@Component({
  selector: 'app-ordini-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ordini.html',
  styleUrls: ['./ordini.css']
})
export class OrdiniDashboardComponent implements OnInit {
  ordini: Ordine[] = [];
  expandedOrderId: number | null = null;
  parsedItems: Array<{ nome: string; quantita: number; prezzo: string }> = [];
  sortKey: 'data' | 'totale' | '' = '';
  sortDir: 1 | -1 = 1;

  constructor(private svc: MenuDashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadOrdini();
  }

  loadOrdini(): void {
    this.svc.getCronologiaOrdini().subscribe({
      next: data => {
        this.ordini = data;
        this.applySort();
        this.cdr.detectChanges();
      },
      error: err => console.error('Errore caricamento cronologia ordini:', err)
    });
  }

  toggleDetails(o: Ordine): void {
    if (this.expandedOrderId === o.id) {
      this.expandedOrderId = null;
      this.parsedItems = [];
    } else {
      this.expandedOrderId = o.id;
      try { this.parsedItems = JSON.parse(o.totale_items); }
      catch { this.parsedItems = []; }
    }
  }

  rimuoviOrdine(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.svc.chiudiOrdine(id).subscribe({
      next: () => this.loadOrdini(),
      error: err => console.error('Errore chiusura ordine:', err)
    });
  }

  formatDateTime(iso: string): string {
    return formatDate(iso, 'dd/MM/yyyy, HH:mm', 'it-IT');
  }

  onSort(key: 'data' | 'totale'): void {
    if (this.sortKey === key) { this.sortDir *= -1; }
    else { this.sortKey = key; this.sortDir = -1; }
    this.applySort();
  }

  applySort(): void {
    this.ordini.sort((a, b) => {
      let aVal: any, bVal: any;
      if (this.sortKey === 'data') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (this.sortKey === 'totale') {
        aVal = a.totale_prezzo;
        bVal = b.totale_prezzo;
      } else return 0;
      return (aVal - bVal) * this.sortDir;
    });
  }
}
