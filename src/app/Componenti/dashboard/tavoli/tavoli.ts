import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuDashboardService } from '../../servizi/menu-dashboard.service';

@Component({
  selector: 'app-tavoli-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tavoli.html',
  styleUrls: ['./tavoli.css']
})
export class TavoliDashboardComponent implements OnInit {
  tavoli: any[] = [];
  mostraFormAggiunta = false;
  selectedItem: any = null;
  nuovoTavolo = { numero_tavolo: 1, numero_coperti: 2 };

  constructor(private menuDashboardService: MenuDashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.getTavoli(); }

  getTavoli(): void {
    this.menuDashboardService.getTavoli().subscribe({
      next: data => { this.tavoli = data; this.cdr.detectChanges(); },
      error: err => console.error('Errore nel caricamento tavoli:', err)
    });
  }

  aggiungiTavolo(): void {
    this.menuDashboardService.addTavolo(this.nuovoTavolo).subscribe({
      next: () => {
        this.mostraFormAggiunta = false;
        this.nuovoTavolo = { numero_tavolo: 1, numero_coperti: 2 };
        this.getTavoli();
      },
      error: err => console.error('Errore durante aggiunta tavolo:', err)
    });
  }

  Modifica(tavolo: any): void { this.selectedItem = { ...tavolo }; }

  salvaModifiche(): void {
    this.menuDashboardService.updateTavolo(this.selectedItem.id, { numero_tavolo: this.selectedItem.numero_tavolo }).subscribe(() => {
      this.selectedItem = null; this.getTavoli();
    });
  }

  Rimuovi(id: number): void { this.menuDashboardService.deleteTavolo(id).subscribe(() => this.getTavoli()); }
  annullaModifica(): void { this.selectedItem = null; }
}
