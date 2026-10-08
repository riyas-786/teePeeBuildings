import { Component, signal, inject } from '@angular/core';
import { TeePeeServices } from '../services/tee-pee-services';
import { Popup } from '../popup/popup';
interface Room {
  id: number;
  room: number;
  remark: string;
}

interface Property {
  id: number;
  name: string;
  rooms: Room[];
}
@Component({
  // imports: [Popup],
  selector: 'app-propertes',
  styleUrl: './propertes.css',
  templateUrl: './propertes.html',
})
export class Propertes {
  constructor(private propertyService: TeePeeServices) { }

  ngOnInit() {
    this.propertyService.getProduct().subscribe((data)=>{
      this.property.set(data[0].name)
    })
  }
  property = signal<Property[]>([])
  dislay = signal<Room[]>([]);
  handlebutton(item: { id: number; name: string; rooms: { id: number; room: number; remark: string }[] }) {
    this.dislay.set(item.rooms);
  }
  addNewProperty() {
    const newProperty: Property = {
      id: 3,
      name: "New Property",
      rooms: [
        { id: 1, room: 0, remark: "------" },
        { id: 2, room: 0, remark: "------" }
      ]
    };
    // Use .update() to create a new array with the new object appended
    this.property.update(currentProperty => [...currentProperty, newProperty]);
  }
}
