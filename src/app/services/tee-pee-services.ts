import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Room {
  _id?: string;
  no: number;
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance';
  note: string;
  remark: string;
}

export interface Building {
  _id?: string;
  name: string;
  rooms: Room[];
}

@Injectable({ providedIn: 'root' })
export class TeePeeServices {
  private apiUrl = `${environment.apiUrl}/teePee`;
    // apiUrl = "http://localhost:3000/teePee"
    // apiUrl = "https://teepee-back.vercel.app/teePee"

  constructor(private http: HttpClient) {}

  // GET all buildings (admin: all, staff: only their assigned ones — backend filters this).
  getBuildings(): Observable<Building[]> {
    return this.http.get<Building[]>(this.apiUrl);
  }

  // Create a brand new building. Admin only (backend enforces this too).
  createBuilding(data: { name: string; rooms: Room[] }): Observable<Building> {
    return this.http.post<Building>(this.apiUrl, data);
  }

  // Replace a building's own fields (e.g. rename it, or replace its whole
  // room list when editing via the popup). Admin only.
  updateBuilding(id: string, data: Partial<Building>): Observable<Building> {
    return this.http.patch<Building>(`${this.apiUrl}/${id}`, data);
  }

  // Delete a building entirely. Admin only.
  deleteBuilding(id: string): Observable<Building> {
    return this.http.delete<Building>(`${this.apiUrl}/${id}`);
  }

  // Small endpoint: update just one room's status/note/remark. Any user
  // assigned to that building (or an admin) can call this.
  updateRoom(
    buildingId: string,
    roomId: string,
    data: Partial<Pick<Room, 'status' | 'note' | 'remark'>>
  ): Observable<Room> {
    return this.http.patch<Room>(`${this.apiUrl}/${buildingId}/rooms/${roomId}`, data);
  }
}
