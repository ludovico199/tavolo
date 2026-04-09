import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Ordine {

  private tavoloIdSubject = new BehaviorSubject<number | null>(null);
  private numeroCopertiSubject = new BehaviorSubject<number | null>(null);
  private tavoloStatusSubject = new BehaviorSubject<string>('IN CORSO');
  tavoloId$ = this.tavoloIdSubject.asObservable();
  numeroCoperti$ = this.numeroCopertiSubject.asObservable();
  tavoloStatus$ = this.tavoloStatusSubject.asObservable();

  setTavoloId(id: number) {
    this.tavoloIdSubject.next(id);
  }

  setTavoloEcoperti(tavoloId: number, numeroCoperti: number) {
    this.tavoloIdSubject.next(tavoloId);
    this.numeroCopertiSubject.next(numeroCoperti);
  }

  aggiornaStatoTavolo(status: string) {
    this.tavoloStatusSubject.next(status);
  }
}
