import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Room {
  _id?: string;
  no: number | string;
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance';
  note: string;
  remark: string;
  sqft: number;
  mergedFrom?: Room[];
  partitionGroup?: string;
  partitionOf?: Room;
}

export interface Building {
  _id?: string;
  name: string;
  rooms: Room[];
}

@Injectable({ providedIn: 'root' })
export class TeePeeServices {
  private apiUrl = `${environment.apiUrl}/teePee`;


  constructor(private http: HttpClient) { }

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
    data: Partial<Pick<Room, 'status' | 'note' | 'remark' | 'sqft'>>
  ): Observable<Room> {
    return this.http.patch<Room>(`${this.apiUrl}/${buildingId}/rooms/${roomId}`, data);
  }
  mergeRooms(buildingId: string, roomIds: string[]): Observable<Building> {
    return this.http.post<Building>(`${this.apiUrl}/${buildingId}/rooms/merge`, { roomIds });
  }

  separateRoom(buildingId: string, roomId: string): Observable<Building> {
    return this.http.post<Building>(`${this.apiUrl}/${buildingId}/rooms/${roomId}/separate`, {});
  }
  splitRoom(buildingId: string, roomId: string, parts: { no: string; sqft: number }[]): Observable<Building> {
    return this.http.post<Building>(`${this.apiUrl}/${buildingId}/rooms/${roomId}/split`, { parts });
  }
  rejoinRoom(buildingId: string, roomId: string): Observable<Building> {
    return this.http.post<Building>(`${this.apiUrl}/${buildingId}/rooms/${roomId}/rejoin`, {});
  }
}
