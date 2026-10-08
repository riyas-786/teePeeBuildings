import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
export interface Room {
  id: number;
  room: number;
  remark: string;
}

export interface Property {
  id: number;
  name: string;
  rooms: Room[];
}
@Injectable({
  providedIn: 'root' // Makes service available everywhere
})

export class TeePeeServices {

  apiUrl = "https://teepee-back.vercel.app/api/teepee"
  apiUrlPost = "https://teepee-back.vercel.app/api/teepee/6ac215c6114fcefb434208fa"
  // apiUrl = "http://localhost:3000/api/teePee"
  // apiUrlPost = "http://localhost:3000/api/teePee/6ac215c6114fcefb434208fa"
  


  constructor(private http: HttpClient) { }

  getProduct() {
    return this.http.get<any[]>(this.apiUrl)
  }
    postProduct(data: any): Observable<any> {
    return this.http.put(this.apiUrlPost, data);
  }
}
