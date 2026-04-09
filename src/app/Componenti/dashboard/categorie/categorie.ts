import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuDashboardService } from '../../servizi/menu-dashboard.service';

@Component({
  selector: 'app-categorie-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorie.html',
  styleUrls: ['./categorie.css']
})
export class CategorieDashboardComponent implements OnInit {
  tipologie: any[] = [];
  mostraFormAggiunta = false;
  selectedItem: any = null;
  nuovaTipologia = { descrittivo: '', colore: '#000000', cucina: false };

  constructor(private menuDashboardService: MenuDashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.getTipologie(); }

  getTipologie(): void {
    this.menuDashboardService.getTipologie().subscribe({
      next: data => { this.tipologie = data; this.cdr.detectChanges(); },
      error: err => console.error('Errore nel recupero delle categorie:', err)
    });
  }

  aggiungiTipologia(): void {
    this.menuDashboardService.addTipologia(this.nuovaTipologia).subscribe({
      next: () => {
        this.mostraFormAggiunta = false;
        this.nuovaTipologia = { descrittivo: '', colore: '#000000', cucina: false };
        this.getTipologie();
      },
      error: err => console.error('Errore durante l\'aggiunta:', err)
    });
  }

  Rimuovi(id: number): void { this.menuDashboardService.deleteTipologia(id).subscribe(() => this.getTipologie()); }
  Modifica(item: any): void { this.selectedItem = { ...item }; }

  salvaModifiche(): void {
    this.menuDashboardService.updateTipologia(this.selectedItem.id, this.selectedItem).subscribe(() => {
      this.selectedItem = null; this.getTipologie();
    });
  }

  annullaModifica(): void { this.selectedItem = null; }
}
