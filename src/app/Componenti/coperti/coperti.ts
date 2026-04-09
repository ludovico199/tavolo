import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-coperti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coperti.html',
  styleUrls: ['./coperti.css'],
})
export class CopertiComponent {

  @Input() tavoloId: number = 0;
  @Input() isVisible: boolean = false;
  NumeroCoperti: number = 0;

  @Output() closeCoperti = new EventEmitter<void>();

  // ✅ Nuovo evento per aggiornare subito i tavoli
  @Output() copertiSalvati = new EventEmitter<number>();

  constructor(private http: HttpClient) {}

  CloseCoperti() {
    this.closeCoperti.emit();
  }

  SalvaCoperti() {

    if (!this.tavoloId || this.NumeroCoperti <= 0) {
      console.warn("⚠️ Inserisci un numero valido di coperti!");
      return;
    }

    const payload = { coperti: this.NumeroCoperti };

    this.http.put(`http://localhost:8000/api/coperti/${this.tavoloId}`, payload)
      .subscribe({
        next: () => {
          this.copertiSalvati.emit(this.NumeroCoperti);
          this.CloseCoperti();
        },

        error: () => {
          console.warn("⚠️ API non disponibile, uso JSON locale");

          this.http.get<any[]>('tavoli.json').subscribe({
            next: (tavoli) => {

              const tavolo = tavoli.find(t => t.id === this.tavoloId);
              if (tavolo) {
                tavolo.numero_coperti = this.NumeroCoperti;
              }

              localStorage.setItem('tavoli_local', JSON.stringify(tavoli));

              this.copertiSalvati.emit(this.NumeroCoperti);

              this.CloseCoperti();
            },

            error: (err) => {
              console.error("❌ Errore nel caricamento JSON locale:", err);
            }
          });
        }
      });
  }
}
