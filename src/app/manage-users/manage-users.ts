import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

interface ManagedUser {
  _id: string;
  email: string;
  role: 'admin' | 'staff';
  assignedBuildings: string[];
}

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers {
  constructor(private http: HttpClient) { }

  private apiUrl = `${environment.apiUrl}/users`;
  private propertyUrl = `${environment.apiUrl}/teePee`;

  users = signal<ManagedUser[]>([]);
  allBuildingNames = signal<string[]>([]);
  message = signal('');
  messageIsError = signal(false);

  ngOnInit() {
    this.http.get<ManagedUser[]>(this.apiUrl).subscribe({
      next: (users) => this.users.set(users),
      error: (err) => {
        console.error('Failed to load users', err);
        this.messageIsError.set(true);
        this.message.set(
          err.status === 403
            ? 'Admin access required — log in with an admin account'
            : err.status === 401
              ? 'Not logged in'
              : 'Could not load users'
        );
      },
    });

    // Pull building names from your existing buildings endpoint so the
    // checkboxes always match whatever buildings actually exist.
    // Each building is now its own document: { _id, name, rooms }.
    this.http.get<any[]>(this.propertyUrl).subscribe({
      next: (docs) => {
        const names = docs.map((d) => d.name);
        this.allBuildingNames.set([...new Set(names)]);
      },
      error: (err) => console.error('Failed to load buildings', err),
    });
  }

  setRole(user: ManagedUser, role: 'admin' | 'staff') {
    this.users.update((list) =>
      list.map((u) => (u._id === user._id ? { ...u, role } : u))
    );
  }

  toggleBuilding(user: ManagedUser, buildingName: string, checked: boolean) {
    this.users.update((list) =>
      list.map((u) => {
        if (u._id !== user._id) return u;
        const assignedBuildings = checked
          ? [...u.assignedBuildings, buildingName]
          : u.assignedBuildings.filter((b) => b !== buildingName);
        return { ...u, assignedBuildings };
      })
    );
  }

  save(user: ManagedUser) {
    this.http
      .patch(`${this.apiUrl}/${user._id}`, {
        role: user.role,
        assignedBuildings: user.assignedBuildings,
      })
      .subscribe({
        next: () => {
          this.messageIsError.set(false);
          this.message.set(`Saved ${user.email}`);
          setTimeout(() => this.message.set(''), 2000);
        },
        error: () => {
          this.messageIsError.set(true);
          this.message.set('Failed to save');
        },
      });
  }
}
