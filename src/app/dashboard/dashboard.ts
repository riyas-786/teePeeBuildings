import { Component, computed, signal, viewChild, HostBinding } from '@angular/core';
import { TeePeeServices } from '../services/tee-pee-services';
import { NewProperty, Popup } from '../popup/popup';
import { AuthService, CurrentUser } from '../services/auth-service';
import { Router, RouterLink } from '@angular/router';

type Status = 'vacant' | 'occupied' | 'reserved' | 'maintenance';
interface Room {
  _id?: string; no: number | string; status: Status;
  note: string; remark: string; sqft: number; mergedFrom?: Room[]
  partitionGroup?: string; partitionOf?: Room;rentPaidMonths?: string[];
}
interface Building { _id?: string; name: string; rooms: Room[]; }
type Counts = Record<Status, number>;

const STATUSES: { key: Status; label: string }[] = [
  { key: 'vacant', label: 'Vacant' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'maintenance', label: 'Maintenance' },
];

@Component({
  selector: 'app-dashboard',
  imports: [Popup, RouterLink],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  isAdmin = false;
  currentUser: CurrentUser | null = null;
  constructor(
    private router: Router,
    private propertyService: TeePeeServices,
    private authService: AuthService,
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.currentUser = this.authService.getUser();
  }

  // Reference to the <app-popup> in the template, so we can call its methods directly.
  popupRef = viewChild(Popup);

  ngOnInit() {
    this.propertyService.getBuildings().subscribe({
      next: (data) => this.buildings.set(data),
      error: () => this.showMessage('Failed to load buildings', 'error'),
    });
  }

  readonly statuses = STATUSES;
  btn = signal('btn btn-secondary');
  btnEdit = signal('btn btn-primary');
  saveMessage = signal('');
  saveStatus = signal<'success' | 'error' | ''>('');
  buildings = signal<Building[]>([]);
  selected = signal(-1); // -1 = all buildings
  darkMode = signal(false);

  mergeMode = signal(false);
  selectedRoomIds = signal<string[]>([]);

  splitTarget = signal<{ bi: number; room: Room } | null>(null);
  splitParts = signal<{ no: string; sqft: string }[]>([]);
  splitTotal = computed(() => this.splitParts().reduce((s, p) => s + (Number(p.sqft) || 0), 0));

  private mergeBuildingIndex = -1;


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

  visibleBuildings = computed(() => {
    const assigned = this.currentUser?.assignedBuildings ?? [];
    return this.buildings()
      .map((building, index) => ({ building, index, counts: this.countOf(building.rooms) }))
      .filter(({ building, index }) => {
        const inScope = this.isAdmin || assigned.includes(building.name);
        const matchesSelection = this.selected() < 0 || index === this.selected();
        return inScope && matchesSelection;
      });
  });
  visibleBuildingButtons = computed(() => {
    const assigned = this.currentUser?.assignedBuildings ?? [];
    return this.buildings()
      .map((b, i) => ({ building: b, index: i }))
      .filter(({ building }) => this.isAdmin || assigned.includes(building.name));
  });

  pct(count: number, total: number): number {
    return total ? (count / total) * 100 : 0;
  }

  label(s: Status): string {
    return STATUSES.find(x => x.key === s)!.label;
  }

  // Click a room to cycle its status. Updates the UI immediately, then
  // persists just that one room via its own small endpoint — if the save
  // fails, the change is rolled back and an error toast is shown.
  cycle(buildingIndex: number, room: Room) {
    const keys = STATUSES.map(s => s.key);
    const previous = room.status;
    const next = keys[(keys.indexOf(room.status) + 1) % keys.length];
    const building = this.buildings()[buildingIndex];

    this.buildings.update(list =>
      list.map((b, i) =>
        i !== buildingIndex ? b : {
          ...b,
          rooms: b.rooms.map(r => (r === room ? { ...r, status: next } : r)),
        }
      )
    );

    if (!building._id || !room._id) return; // nothing to persist yet

    this.propertyService.updateRoom(building._id, room._id, { status: next }).subscribe({
      error: () => {
        this.buildings.update(list =>
          list.map((b, i) =>
            i !== buildingIndex ? b : {
              ...b,
              rooms: b.rooms.map(r => (r === room ? { ...r, status: previous } : r)),
            }
          )
        );
        this.showMessage('Failed to update room. Try again.', 'error');
      },
    });
  }

  onPopupSave(newProperty: NewProperty) {
    const rooms: Room[] = newProperty.rooms.map(r => ({
      no: r.room, note: r.note, remark: r.remark, status: r.status as Status,
      sqft: r.sqft, mergedFrom: r.mergedFrom, partitionGroup: r.partitionGroup,
       partitionOf: r.partitionOf,rentPaidMonths: r.rentPaidMonths,
    }));
    if (newProperty.editIndex !== undefined) {
      // Editing an existing building.
      const building = this.buildings()[newProperty.editIndex];
      if (!building._id) {
        this.showMessage('Cannot edit: building has no id yet', 'error');
        return;
      }
      this.propertyService.updateBuilding(building._id, { name: newProperty.name, rooms }).subscribe({
        next: (updated) => {
          this.buildings.update(current =>
            current.map((b, idx) => (idx !== newProperty.editIndex ? b : updated))
          );
          this.showMessage('Building updated', 'success');
        },
        error: () => this.showMessage('Failed to update building', 'error'),
      });
    } else {
      // Adding a brand new building.
      this.propertyService.createBuilding({ name: newProperty.name, rooms }).subscribe({
        next: (created) => {
          this.buildings.update(current => [...current, created]);
          this.showMessage('Building added', 'success');
        },
        error: () => this.showMessage('Failed to add building', 'error'),
      });
    }
  }

  // The "Save" button no longer posts the whole array — every room/building
  // change already persisted itself the moment it happened. This just exits
  // edit mode.
  sendData() {
    this.btn.set('btn btn-secondary');
    this.btnEdit.set('btn btn-primary');
    // this.showMessage('All changes are saved automatically', 'success');
    this.mergeMode.set(false)
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
    if (i < 0) {
      this.showMessage('Select a building first', 'error');
      return;
    }
    const building = this.buildings()[i];
    this.popupRef()?.openForEdit(i, building);
  }

  // Deletes the currently selected building.
  deleteBuilding() {
    const i = this.selected();
    if (i < 0) {
      this.showMessage('Select a building first', 'error');
      return;
    }

    const building = this.buildings()[i];
    const confirmed = confirm(`Delete "${building.name}"? This can't be undone.`);
    if (!confirmed) return;

    if (!building._id) {
      this.showMessage('Cannot delete: building has no id yet', 'error');
      return;
    }

    this.propertyService.deleteBuilding(building._id).subscribe({
      next: () => {
        this.buildings.update(current => current.filter((_, idx) => idx !== i));
        this.selected.set(-1);
        this.showMessage('Deleted', 'success');
      },
      error: () => this.showMessage('Failed to delete building', 'error'),
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
    if (this.longPressFired) { this.longPressFired = false; return; }
    if (this.btn() !== 'btn btn-primary') return;
    if (this.mergeMode()) { this.toggleSelect(buildingIndex, room); return; }
    this.cycle(buildingIndex, room);
  }

  openNote(buildingIndex: number, roomIndex: number, room: Room) {
    this.editingNoteKey.set(this.noteKey(buildingIndex, roomIndex));
    this.noteDraft.set(room.note ?? '');
  }

  // Saves just this room's note via its own small endpoint.
  saveNote(buildingIndex: number, roomIndex: number) {
    if (this.btn() !== 'btn btn-primary') return;

    const value = this.noteDraft();
    const building = this.buildings()[buildingIndex];
    const room = building.rooms[roomIndex];

    this.buildings.update(list =>
      list.map((b, bi) =>
        bi !== buildingIndex ? b : {
          ...b,
          rooms: b.rooms.map((r, ri) => (ri !== roomIndex ? r : { ...r, note: value })),
        }
      )
    );
    this.editingNoteKey.set(null);

    if (building._id && room._id) {
      this.propertyService.updateRoom(building._id, room._id, { note: value }).subscribe({
        error: () => this.showMessage('Failed to save note', 'error'),
      });
    }
  }

  cancelNote(event: Event) {
    event.stopPropagation();
    this.editingNoteKey.set(null);
  }

  // Enters edit mode. Re-fetches from the server first so any unsaved local
  // state is discarded and you start editing from the real current data.
  editbuttonToggle() {
    this.propertyService.getBuildings().subscribe({
      next: (data) => {
        this.buildings.set(data);
        this.btn.set('btn btn-primary');
        this.btnEdit.set('btn btn-secondary');
      },
      error: () => this.showMessage('Failed to refresh buildings', 'error'),
    });
  }




  isSelected(room: Room) { return !!room._id && this.selectedRoomIds().includes(room._id); }

  toggleMerge() {
    this.mergeMode.update(v => !v);
    this.clearSelection();
  }
  private clearSelection() { this.selectedRoomIds.set([]); this.mergeBuildingIndex = -1; }

  private toggleSelect(bi: number, room: Room) {
    if (!room._id) return;
    if (this.selectedRoomIds().length && this.mergeBuildingIndex !== bi) {
      this.showMessage('Pick rooms from one building', 'error');
      return;
    }
    this.mergeBuildingIndex = bi;
    this.selectedRoomIds.update(ids =>
      ids.includes(room._id!) ? ids.filter(x => x !== room._id) : [...ids, room._id!]);
    if (!this.selectedRoomIds().length) this.mergeBuildingIndex = -1;
  }

  mergeSelected() {
    const bi = this.mergeBuildingIndex;
    const building = this.buildings()[bi];
    if (!building?._id || this.selectedRoomIds().length < 2) return;
    this.propertyService.mergeRooms(building._id, this.selectedRoomIds()).subscribe({
      next: (updated) => {
        this.buildings.update(list => list.map((b, i) => (i === bi ? updated : b)));
        this.mergeMode.set(false);
        this.clearSelection();
        this.showMessage('Rooms merged', 'success');
      },
      error: (err) => this.showMessage(err.error || 'Failed to merge rooms', 'error'),
    });
  }

  separate(bi: number, room: Room) {
    const building = this.buildings()[bi];
    if (!building._id || !room._id) return;
    this.propertyService.separateRoom(building._id, room._id).subscribe({
      next: (updated) => {
        this.buildings.update(list => list.map((b, i) => (i === bi ? updated : b)));
        this.editingNoteKey.set(null);
        this.showMessage('Room separated', 'success');
      },
      error: (err) => this.showMessage(err.error || 'Failed to separate room', 'error'),
    });
  }


  // ************partitions**************


  openSplit(bi: number, room: Room) {
    this.editingNoteKey.set(null);
    this.splitTarget.set({ bi, room });
    this.splitParts.set([{ no: `${room.no}A`, sqft: '' }, { no: `${room.no}B`, sqft: '' }]);
  }
  closeSplit() { this.splitTarget.set(null); }

  addPart() {
    const base = this.splitTarget()?.room.no ?? '';
    const letter = String.fromCharCode(65 + this.splitParts().length);   // A, B, C...
    this.splitParts.update(l => [...l, { no: `${base}${letter}`, sqft: '' }]);
  }
  removePart(i: number) {
    if (this.splitParts().length <= 2) return;
    this.splitParts.update(l => l.filter((_, idx) => idx !== i));
  }
  updatePart(i: number, field: 'no' | 'sqft', value: string) {
    this.splitParts.update(l => l.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }

  confirmSplit() {
    const t = this.splitTarget();
    if (!t) return;
    const building = this.buildings()[t.bi];
    if (!building._id || !t.room._id) return;
    const parts = this.splitParts().map(p => ({ no: p.no.trim(), sqft: Number(p.sqft) || 0 }));
    this.propertyService.splitRoom(building._id, t.room._id, parts).subscribe({
      next: (updated) => {
        this.buildings.update(list => list.map((b, i) => (i === t.bi ? updated : b)));
        this.closeSplit();
        this.showMessage('Room split', 'success');
      },
      error: (err) => this.showMessage(err.error || 'Failed to split room', 'error'),
    });
  }

  rejoin(bi: number, room: Room) {
    const building = this.buildings()[bi];
    if (!building._id || !room._id) return;
    this.propertyService.rejoinRoom(building._id, room._id).subscribe({
      next: (updated) => {
        this.buildings.update(list => list.map((b, i) => (i === bi ? updated : b)));
        this.editingNoteKey.set(null);
        this.showMessage('Partitions rejoined', 'success');
      },
      error: (err) => this.showMessage(err.error || 'Failed to rejoin', 'error'),
    });
  }


}
