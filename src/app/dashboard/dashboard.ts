import { Component, computed, signal, viewChild, HostBinding } from '@angular/core';
import { TeePeeServices } from '../services/tee-pee-services';
import { NewProperty, Popup } from '../popup/popup';

type Status = 'vacant' | 'occupied' | 'reserved' | 'maintenance';
interface Room { no: number; status: Status; note: string, remark: string }
interface Building { name: string; rooms: Room[]; }
type Counts = Record<Status, number>;

const STATUSES: { key: Status; label: string }[] = [
  { key: 'vacant', label: 'Vacant' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'maintenance', label: 'Maintenance' },
];

// Fallback data shown before the API responds.
const apiResponse = [
  {
    name: [
      {
        id: 1,
        name: '',
        rooms: [
          { id: 1, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 2, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 3, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 4, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 5, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 6, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 7, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 8, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 9, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 10, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 11, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
          { id: 12, no: 0, remark: 'remark', note: 'note...', status: 'vacant' },
        ],
      },
    ],
  },
];

function sampleData(): Building[] {
  return apiResponse[0].name.map(place => ({
    name: place.name,
    rooms: place.rooms.map(r => ({ no: r.no, remark: r.remark, note: r.note, status: r.status as Status })),
  }));
}

@Component({
  selector: 'app-dashboard',
  imports: [Popup],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  constructor(private propertyService: TeePeeServices) { }

  // Reference to the <app-popup> in the template, so we can call its methods directly.
  popupRef = viewChild(Popup);

  ngOnInit() {
    this.propertyService.getProduct().subscribe((data) => {
      this.buildings.set(data[0].name);
    });
  }

  readonly statuses = STATUSES;
  btn = signal('btn btn-secondary');
  btnEdit = signal('btn btn-primary');
  saveMessage = signal('');
  saveStatus = signal<'success' | 'error' | ''>('');
  buildings = signal<Building[]>(sampleData());
  selected = signal(-1); // -1 = all buildings
  darkMode = signal(false);

  @HostBinding('class.dark')
  get isDark() {
    return this.darkMode();
  }

  toggleDark() {
    this.darkMode.update(v => !v);
  }
  private countOf(rooms: Room[]): Counts {
    const c: Counts = { vacant: 0, occupied: 0, reserved: 0, maintenance: 0 };
    rooms.forEach(r => c[r.status]++);
    return c;
  }

  visibleBuildings = computed(() =>
    this.buildings()
      .map((building, index) => ({ building, index, counts: this.countOf(building.rooms) }))
      .filter(({ index }) => this.selected() < 0 || index === this.selected()));

  pct(count: number, total: number): number {
    return total ? (count / total) * 100 : 0;
  }

  label(s: Status): string {
    return STATUSES.find(x => x.key === s)!.label;
  }


  // Click a room to cycle its status.
  cycle(buildingIndex: number, room: Room) {
    this.btn.set('btn btn-primary');
    this.btnEdit.set('btn btn-secondary');
    const keys = STATUSES.map(s => s.key);
    const next = keys[(keys.indexOf(room.status) + 1) % keys.length];
    this.buildings.update(list =>
      list.map((b, i) =>
        i !== buildingIndex ? b : {
          ...b,
          rooms: b.rooms.map(r => (r === room ? { ...r, status: next } : r)),
        }
      )
    );
  }

  onPopupSave(newProperty: NewProperty) {
    console.log(newProperty);

    if (newProperty.editIndex !== undefined) {
      // Editing an existing building: replace it in place.
      this.buildings.update(current =>
        current.map((b, idx) =>
          idx !== newProperty.editIndex ? b : {
            name: newProperty.name,
            rooms: newProperty.rooms.map(r => ({
              no: r.room,
              note: r.note,
              remark: r.remark,
              status: r.status as Status,
            })),
          }
        )
      );
    } else {
      // Adding a brand new building.
      this.buildings.update(current => [
        ...current,
        {
          name: newProperty.name,
          rooms: newProperty.rooms.map(r => ({ no: r.room, remark: r.remark, note: r.note, status: r.status as Status })),
        },
      ]);
    }
    this.btn.set('btn btn-primary');
    this.btnEdit.set('btn btn-secondary');
  }

  sendData() {
    console.log(this.buildings());

    const data = { name: this.buildings() };
    this.propertyService.postProduct(data).subscribe({
      next: () => {
        this.showMessage('Saved!', 'success');
        this.btn.set('btn btn-secondary');
        this.btnEdit.set('btn btn-primary');
        this.toggleDark()
      },
      error: () => this.showMessage('Failed to save. Try again.', 'error'),
    });
  }

  private showMessage(msg: string, status: 'success' | 'error') {
    this.saveMessage.set(msg);
    this.saveStatus.set(status);
    setTimeout(() => {
      this.saveMessage.set('');
      this.saveStatus.set('');
    }, 2500);
  }

  // Opens the popup pre-filled with the currently selected building, for editing.
  sendDataToPopup(i: number) {

    // const i = this.selected();
    if (i < 0) {
      this.showMessage('Select a building first', 'error');
      return;
    }
    const building = this.buildings()[i];
    this.popupRef()?.openForEdit(i, building);
  }
  // Deletes the currently selected building.
  deleteBuilding() {
    this.propertyService.getProduct().subscribe((data) => {
      this.buildings.set(data[0].name);
      const i = this.selected();
      if (i < 0) {
        this.showMessage('Select a building first', 'error');
        return;
      }

      const name = this.buildings()[i].name;
      const confirmed = confirm(`Delete "${name}"? This can't be undone.`);
      if (!confirmed) return;

      this.buildings.update(current => current.filter((_, idx) => idx !== i));
      this.selected.set(-1); // reset selection since that index no longer exists
      this.showMessage('Deleted', 'success');
      this.btn.set('btn btn-primary');
      this.btnEdit.set('btn btn-secondary');
      this.toggleDark();

    });

  }
  // Tracks which room's note popover is open, e.g. "0-2" = building 0, room 2.
  editingNoteKey = signal<string | null>(null);
  noteDraft = signal('');

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressFired = false;
  private readonly LONG_PRESS_MS = 500;

  noteKey(buildingIndex: number, roomIndex: number): string {
    return `${buildingIndex}-${roomIndex}`;
  }

  // Start the long-press timer on mousedown/touchstart.
  startPress(buildingIndex: number, roomIndex: number, room: Room) {
    this.longPressFired = false;
    this.longPressTimer = setTimeout(() => {
      this.longPressFired = true;
      this.openNote(buildingIndex, roomIndex, room);
    }, this.LONG_PRESS_MS);
  }

  // Cancel the timer if released early (mouseup/touchend/leave).
  cancelPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // A short tap should cycle the status, but only if a long-press didn't already fire.
  handleRoomClick(buildingIndex: number, room: Room) {
    if (this.longPressFired) {
      this.longPressFired = false; // swallow the click that follows a long-press release
      return;
    } else if (this.btn() == 'btn btn-primary') {
      this.cycle(buildingIndex, room);
    }
  }

  openNote(buildingIndex: number, roomIndex: number, room: Room) {
    this.editingNoteKey.set(this.noteKey(buildingIndex, roomIndex));
    this.noteDraft.set(room.note ?? '');
  }

  saveNote(buildingIndex: number, roomIndex: number) {
    if (this.btn() == "btn btn-primary") {
      const value = this.noteDraft();
      this.buildings.update(list =>
        list.map((b, bi) =>
          bi !== buildingIndex ? b : {
            ...b,
            rooms: b.rooms.map((r, ri) => (ri !== roomIndex ? r : { ...r, note: value })),
          }
        )
      );
      this.btn.set('btn btn-primary');
      this.btnEdit.set('btn btn-secondary');
      this.editingNoteKey.set(null);
    }
  }

  cancelNote(event: Event) {
    event.stopPropagation();
    this.editingNoteKey.set(null);
  }
  editbuttonToggle() {
    this.propertyService.getProduct().subscribe((data) => {
      this.buildings.set(data[0].name);
      this.btn.set('btn btn-primary');
      this.btnEdit.set('btn btn-secondary');
      this.toggleDark()
      console.log(data[0].name);
    });

  }
}
