import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectedMaterialService {
  private selectedMaterialsSubject = new BehaviorSubject<string[]>([]);
  selectedMaterials$: Observable<string[]> = this.selectedMaterialsSubject.asObservable();

  setSelectedMaterials(materials: string[]) {
    this.selectedMaterialsSubject.next(materials);
  }

  addSelectedMaterial(id: string) {
    const currentMaterials = this.selectedMaterialsSubject.value;
    if (!currentMaterials.includes(id)) {
      this.selectedMaterialsSubject.next([...currentMaterials, id]);
    }
  }

  removeSelectedMaterial(id: string) {
    const currentMaterials = this.selectedMaterialsSubject.value;
    this.selectedMaterialsSubject.next(currentMaterials.filter(materialId => materialId !== id));
  }
}
