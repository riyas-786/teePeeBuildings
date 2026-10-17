import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Building, Room, TeePeeServices } from '../services/tee-pee-services';

@Component({
  selector: 'app-rent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './rent.html',
  styleUrl: './rent.css',
})
export class Rent implements OnInit {
  constructor(private propertyService: TeePeeServices) { }

  buildings = signal<Building[]>([]);
  message = signal('');
  messageIsError = signal(false);
  selectedMonth = signal(this.currentMonth());
  buildingFilter = signal('all');
  statusFilter = signal('all');
  paidFilter = signal<'all' | 'paid' | 'unpaid'>('all');
  search = signal('');

  readonly statusOptions = ['vacant', 'occupied', 'reserved', 'maintenance'];

  buildingNames = computed(() => this.buildings().map(b => b.name));
  // rows = computed(() =>
  //   this.buildings().flatMap(building => building.rooms.map(room => ({ building, room })))
  // );
  paidCount = computed(() => this.rows().filter(r => this.isPaid(r.room)).length);
  totalSqft = computed(() => this.rows().reduce((s, r) => s + (r.room.sqft || 0), 0));
  private allRows = computed(() =>
  this.buildings().flatMap(building => building.rooms.map(room => ({ building, room })))
);

rows = computed(() => {
  const q = this.search().trim().toLowerCase();
  return this.allRows().filter(({ building, room }) => {
    if (this.buildingFilter() !== 'all' && building.name !== this.buildingFilter()) return false;
    if (this.statusFilter() !== 'all' && room.status !== this.statusFilter()) return false;
    if (this.paidFilter() === 'paid' && !this.isPaid(room)) return false;
    if (this.paidFilter() === 'unpaid' && this.isPaid(room)) return false;
    if (q && !String(room.no).toLowerCase().includes(q)) return false;
    return true;
  });
});

hasFilters = computed(() =>
  this.buildingFilter() !== 'all' || this.statusFilter() !== 'all' ||
  this.paidFilter() !== 'all' || this.search().trim() !== ''
);

clearFilters() {
  this.buildingFilter.set('all');
  this.statusFilter.set('all');
  this.paidFilter.set('all');
  this.search.set('');
}

  private currentMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  isPaid(room: Room): boolean {
    return (room.rentPaidMonths ?? []).includes(this.selectedMonth());
  }

  setMonth(value: string) {
    if (value) this.selectedMonth.set(value);
  }

  ngOnInit() {
    this.propertyService.getBuildings().subscribe({
      next: data => this.buildings.set(data),
      error: () => this.showMessage('Failed to load buildings', true),
    });
  }

  toggleRent(building: Building, room: Room, checked: boolean) {
    if (!building._id || !room._id) return;
    const bid = building._id, rid = room._id, month = this.selectedMonth();

    this.applyPaid(bid, rid, month, checked);   // update the UI immediately
    this.propertyService.setRentPaid(bid, rid, month, checked).subscribe({
      error: () => {
        this.applyPaid(bid, rid, month, !checked);   // roll back if the save fails
        this.showMessage('Failed to update rent status', true);
      },
    });
  }

  private applyPaid(buildingId: string, roomId: string, month: string, paid: boolean) {
    this.buildings.update(list =>
      list.map(b => b._id !== buildingId ? b : {
        ...b,
        rooms: b.rooms.map(r => {
          if (r._id !== roomId) return r;
          const months = (r.rentPaidMonths ?? []).filter(m => m !== month);
          return { ...r, rentPaidMonths: paid ? [...months, month] : months };
        }),
      })
    );
  }

  private showMessage(msg: string, isError: boolean) {
    this.message.set(msg);
    this.messageIsError.set(isError);
    setTimeout(() => this.message.set(''), 2500);
  }
}