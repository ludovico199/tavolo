import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

export interface Ordine {
  id: number;
  created_at: string;
  totale_prezzo: number;
  totale_items: string;
}

const BASE = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class MenuDashboardService {
  constructor(private http: HttpClient) {}

  getMenu() {
    return this.http.get<any[]>(`${BASE}/menu`).pipe(
      catchError(() => this.http.get<any[]>('menu.json'))
    );
  }

  getTipologie() {
    return this.http.get<any[]>(`${BASE}/tipologie`).pipe(
      catchError(() => this.http.get<any[]>('tipologie.json'))
    );
  }

  getCronologiaOrdini() {
    return this.http.get<Ordine[]>(`${BASE}/cronologia-ordini`);
  }

  chiudiOrdine(id: number) {
    return this.http.put(`${BASE}/ordini/${id}/chiudi`, {});
  }

  addMenuItem(voce: any) {
    return this.http.post(`${BASE}/menu`, voce);
  }

  updateMenuItem(id: number, data: any) {
    return this.http.put(`${BASE}/menu/${id}`, data);
  }

  deleteMenuItem(id: number) {
    return this.http.delete(`${BASE}/menu/${id}`);
  }

  addTipologia(data: any) {
    return this.http.post(`${BASE}/tipologie`, data);
  }

  updateTipologia(id: number, data: any) {
    return this.http.put(`${BASE}/tipologie/${id}`, data);
  }

  deleteTipologia(id: number) {
    return this.http.delete(`${BASE}/tipologie/${id}`);
  }

  getTavoli() {
    return this.http.get<any[]>(`${BASE}/tavoli`).pipe(
      catchError(() => {
        const local = localStorage.getItem('tavoli_local');
        return of(local ? JSON.parse(local) : []);
      })
    );
  }

  addTavolo(data: any) {
    return this.http.post(`${BASE}/tavoli`, data);
  }

  updateTavolo(id: number, data: any) {
    return this.http.put(`${BASE}/tavoli/${id}`, data);
  }

  deleteTavolo(id: number) {
    return this.http.delete(`${BASE}/tavoli/${id}`);
  }
}
