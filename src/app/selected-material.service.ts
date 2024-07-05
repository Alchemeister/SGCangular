import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' 
})
export class SelectedMaterialService {
  private selectedMaterialsSubject = new BehaviorSubject<string[]>([]);
  selectedMaterials$ = this.selectedMaterialsSubject.asObservable();

  setSelectedMaterials(materialIds: string[]) {
    this.selectedMaterialsSubject.next(materialIds);
  }
}