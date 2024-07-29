import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';
import { DashboardComponent } from '../dashboard.component';

@Component({
  selector: 'app-materials',
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css']
})
export class MaterialsComponent implements OnInit {
  savedMaterials: any[] = [];

  constructor(
    private fileService: FileService,
    private dashboardComponent: DashboardComponent
  ) {}

  ngOnInit() {
    this.loadSavedMaterials();
  }

  loadSavedMaterials() {
    this.fileService.getSavedMaterials().subscribe(
      materials => {
        this.savedMaterials = materials;
        // Update the view to display the saved materials
      },
      error => console.error('Error loading saved materials:', error)
    );
  }
  

  showMaterial(material: any) {
    this.dashboardComponent.createAndShowModal(material.content, material.title);
  }
}
