import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuDashboardService } from '../../servizi/menu-dashboard.service';

type SortKey = 'nome' | 'tipologia' | 'prezzo' | 'quantita' | '';
type SortDirection = 1 | -1;

@Component({
  selector: 'app-menu-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css']
})
export class MenuDashboardComponent implements OnInit {
  menuItems: any[] = [];
  tipologie: any[] = [];
  mostraFormAggiunta = false;
  selectedItem: any = null;
  searchTerm = '';
  filteredItems: any[] = [];
  ricercaAttiva = false;
  sortKey: SortKey = '';
  sortDir: SortDirection = 1;
  expandedItemId: number | null = null;
  nuovoIngrediente = '';
  nuovaVoce = { nome: '', prezzo: 0, quantita: 0, tipologia_id: null, ingredienti: [] as string[] };

  constructor(private menuDashboardService: MenuDashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.menuDashboardService.getTipologie().subscribe({
      next: data => { this.tipologie = data; this.loadMenu(); }
    });
  }

  loadMenu(): void {
    this.menuDashboardService.getMenu().subscribe({
      next: data => {
        this.menuItems = data.map(item => {
          const tipo = this.tipologie.find(t => t.id === item.tipologia_id);
          return { ...item, tipologia: tipo?.descrittivo || '', ingredienti: item.ingredienti ?? [] };
        });
        if (this.ricercaAttiva) this.onSearch();
        this.applySort();
        this.cdr.detectChanges();
      }
    });
  }

  onSort(key: SortKey): void {
    if (this.sortKey === key) { this.sortDir = this.sortDir === 1 ? -1 : 1; }
    else { this.sortKey = key; this.sortDir = (key === 'quantita' || key === 'prezzo') ? -1 : 1; }
    this.applySort();
  }

  private applySort(): void {
    const list = this.ricercaAttiva ? this.filteredItems : this.menuItems;
    list.sort((a, b) => {
      const av = a[this.sortKey], bv = b[this.sortKey];
      if (this.sortKey === 'quantita' || this.sortKey === 'prezzo') return (bv - av) * this.sortDir;
      const sa = ('' + av).toLowerCase(), sb = ('' + bv).toLowerCase();
      return sa < sb ? -1 * this.sortDir : sa > sb ? 1 * this.sortDir : 0;
    });
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) { this.resetSearch(); return; }
    this.filteredItems = this.menuItems.filter(item => item.nome.toLowerCase().includes(term));
    this.ricercaAttiva = true;
    this.applySort();
  }

  resetSearch(): void {
    this.searchTerm = ''; this.filteredItems = []; this.ricercaAttiva = false; this.applySort();
  }

  toggleDetails(item: any): void {
    this.expandedItemId = this.expandedItemId === item.id ? null : item.id;
  }

  aggiungiMenu(): void {
    this.menuDashboardService.addMenuItem(this.nuovaVoce).subscribe(() => {
      this.mostraFormAggiunta = false;
      this.nuovaVoce = { nome: '', prezzo: 0, quantita: 0, tipologia_id: null, ingredienti: [] };
      this.loadMenu();
    });
  }

  Rimuovi(id: number): void {
    this.menuDashboardService.deleteMenuItem(id).subscribe(() => this.loadMenu());
  }

  Modifica(item: any): void { this.selectedItem = { ...item }; }

  salvaModifiche(): void {
    const updated = { nome: this.selectedItem.nome, prezzo: this.selectedItem.prezzo, quantita: this.selectedItem.quantita, tipologia_id: this.selectedItem.tipologia_id, ingredienti: this.selectedItem.ingredienti || [] };
    this.menuDashboardService.updateMenuItem(this.selectedItem.id, updated).subscribe(() => {
      this.selectedItem = null; this.loadMenu();
    });
  }

  annullaModifica(): void { this.selectedItem = null; }

  aggiungiIngrediente(): void {
    const trimmed = this.nuovoIngrediente.trim();
    if (trimmed) { this.nuovaVoce.ingredienti.push(trimmed); this.nuovoIngrediente = ''; }
  }

  rimuoviIngrediente(index: number): void { this.nuovaVoce.ingredienti.splice(index, 1); }
}
