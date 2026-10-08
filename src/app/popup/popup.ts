import { Component, ElementRef, EventEmitter, Output, signal, viewChild } from '@angular/core';

interface RoomDraft { room: string; remark: string; note:string, status: string; }

export interface NewProperty {
  name: string;
  rooms: { id: number; room: number; remark: string; note:string, status: string }[];
  editIndex?: number; // set only when this save is editing an existing building
}

const STATUS_OPTIONS = ['vacant', 'occupied', 'reserved', 'maintenance'];

@Component({
  imports: [],
  selector: 'app-popup',
  styleUrl: './popup.css',
  templateUrl: './popup.html',
})
export class Popup {
  dialogRef = viewChild<ElementRef<HTMLDialogElement>>('modalDialog');

  @Output() save = new EventEmitter<NewProperty>();

  readonly statusOptions = STATUS_OPTIONS;

  propertyName = signal('');
  rooms = signal<RoomDraft[]>([]);
  errorMessage = signal('');
  private editIndex: number | null = null;

  // Opens the popup empty, for adding a brand new building.
  openPopup() {
    this.editIndex = null;
    this.reset();
    this.dialogRef()?.nativeElement.showModal();
  }

  // Opens the popup pre-filled with an existing building's data, for editing.
  // Call from Dashboard as: this.popupRef()?.openForEdit(index, building)
  openForEdit(index: number, building: { name: string;  rooms: { no: number; remark:string ; note:string, status: string }[] }) {
    this.editIndex = index;
    this.propertyName.set(building.name);
    this.rooms.set(
      building.rooms.map(r => ({ room: String(r.no), remark: r.remark, note:r.note, status: r.status || 'vacant' }))
    );
    this.errorMessage.set('');
    this.dialogRef()?.nativeElement.showModal();
  }

  closePopup() {
    this.dialogRef()?.nativeElement.close();
    this.reset();
  }

  setName(value: string) {
    this.propertyName.set(value);
  }

  makeRooms(value: string) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) {
      this.rooms.set([]);
      return;
    }
    this.rooms.set(Array.from({ length: n }, () => ({ room: '', remark: '', note:'', status: 'vacant' })));
    this.errorMessage.set('');
  }

  updateRoomNo(index: number, value: string) {
    this.rooms.update(list => list.map((r, i) => (i === index ? { ...r, room: value } : r)));
  }

  updateRoomRemark(index: number, value: string) {
    this.rooms.update(list => list.map((r, i) => (i === index ? { ...r, remark: value } : r)));
  }

  updateRoomStatus(index: number, value: string) {
    this.rooms.update(list => list.map((r, i) => (i === index ? { ...r, status: value } : r)));
  }

  savePopup() {
    if (!this.propertyName().trim()) {
      this.errorMessage.set('Type a property name');
      return;
    }
    if (!this.rooms().length) {
      this.errorMessage.set('Type a number and press Enter');
      return;
    }

    const newProperty: NewProperty = {
      name: this.propertyName().trim(),
      rooms: this.rooms().map((r, i) => ({
        id: i + 1,
        room: Number(r.room) || 0,
        remark: r.remark,
        note:r.note,
        status: r.status || 'vacant',
      })),
      editIndex: this.editIndex ?? undefined,
    };

    this.save.emit(newProperty);
    this.closePopup();
  }

  private reset() {
    this.propertyName.set('');
    this.rooms.set([]);
    this.errorMessage.set('');
    this.editIndex = null;
  }
}
