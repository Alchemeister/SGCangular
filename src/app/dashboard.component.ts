import { Component, OnInit, Renderer2, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTreeModule, MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, IFlatNode } from './file-node.model';

import { Modal } from 'bootstrap';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  private _transformer = (node: FileNode, level: number): IFlatNode => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      type: node.type,
      level: level,
      isSelected: node.isSelected ?? false,
      _id: node._id,
      path: node.path,
      subjectTag: node.subjectTag,
      parentFolder: node.parentFolder || null
    };
  }
  
  

  treeControl = new FlatTreeControl<IFlatNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  selectedFile: File | null = null;
  selectedParentFolderId: string = '';
  subjectTag: string = '';
  materialType: string = '';

  constructor(
    private http: HttpClient,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.fetchTreeData();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    const subjectTag = prompt('Enter subject tag:');
    if (subjectTag) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectTag', subjectTag);

      if (this.selectedParentFolderId && this.selectedParentFolderId.trim() !== '') {
        formData.append('parentFolder', this.selectedParentFolderId);
      }

      this.http.post('/api/files/upload', formData).subscribe({
        next: (response: any) => {
          console.log('File uploaded:', response);
          if (response.fileNode) {
            this.addFileNodeToTree(response.fileNode);
          } else {
            this.fetchTreeData();
          }
          this.resetForm();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error uploading file:', error);
          // TODO: Add user-friendly error handling
        }
      });
    }
  }

  addFileNodeToTree(fileNode: any) {
    const newData = [...this.dataSource.data];
    newData.push(fileNode);
    this.dataSource.data = newData;
  }

  hasChild = (_: number, node: IFlatNode) => node.expandable;

  toggleNodeSelection(node: IFlatNode): void {
    node.isSelected = !node.isSelected;
  }

  fetchTreeData() {
    this.http.get<FileNode[]>('/api/files/tree').subscribe({
      next: (data) => {
        console.log('Fetched tree data:', data);
        this.dataSource.data = data;
        // Refresh the tree
        this.treeControl.dataNodes = this.treeFlattener.flattenNodes(data);
        this.treeControl.expandAll();
      },
      error: (error) => {
        console.error('Error fetching tree data:', error);
      }
    });
  }
  
  
  private transformFileNodesToFlatNodes(nodes: FileNode[], level: number = 0): IFlatNode[] {
    return nodes.reduce<IFlatNode[]>((accumulator, node) => {
      const flatNode: IFlatNode = {
        expandable: !!node.children && node.children.length > 0,
        name: node.name,
        type: node.type,
        level: level,
        isSelected: false,
        _id: node._id,
        path: node.path,
        subjectTag: node.subjectTag,
        parentFolder: node.parentFolder
      };
      accumulator.push(flatNode);
  
      if (node.children && node.children.length > 0) {
        accumulator.push(...this.transformFileNodesToFlatNodes(node.children, level + 1));
      }
  
      return accumulator;
    }, []);
  }
  
  

  getSelectedMaterialIds(): string[] {
    return this.treeControl.dataNodes
      .filter(node => node.isSelected && node._id)
      .map(node => node._id as string);
  }

  createFolder(parentFolderId?: string) {
    const folderName = prompt('Enter new folder name:');
    if (!folderName) return;

    this.http.post('/api/files/folders', { name: folderName, parentFolder: parentFolderId }).subscribe({
      next: (response: any) => {
        console.log('Folder created:', response);
        this.fetchTreeData();
      },
      error: (error) => {
        console.error('Error creating folder:', error);
        // TODO: Add user-friendly error handling
      }
    });
  }

  onNodeSelected(node: IFlatNode) {
    console.log("Node selected:", node.name, node.isSelected);
    node.isSelected = !node.isSelected;
  }

  deleteSelectedMaterials() {
    const materialIdsToDelete = this.getSelectedMaterialIds();
  
    if (materialIdsToDelete.length === 0) {
      alert('Please select materials to delete.');
      return;
    }
  
    if (confirm('Are you sure you want to delete the selected materials?')) {
      this.http.post<{message: string, deletedIDs: string[]}>('/api/files/delete-materials', { materialIDs: materialIdsToDelete }).subscribe({
        next: (response) => {
          console.log('Materials deleted successfully', response);
          // Remove deleted items from the data source
          this.dataSource.data = this.dataSource.data.filter(node => !response.deletedIDs.includes(node._id));
          // The dataSource will automatically update the flat node data
          this.treeControl.expandAll();
        },
        error: (error) => {
          console.error('Error deleting materials:', error);
          alert('Error deleting materials. Please try again.');
        }
      });
    }
  }
  
  
  

  refreshTreeData() {
    this.fetchTreeData();
  }

  
  requestMaterial() {
    console.log('Requesting material of type:', this.materialType);
    const selectedMaterials = this.getSelectedMaterialIds();
     
    if (selectedMaterials.length === 0) {
      alert('Please select at least one material.');
      return;
    }
  
    if (!this.materialType) {
      alert('Please select a material type.');
      return;
    }
  
    const requestData = {
      materialIDs: selectedMaterials,
      materialType: this.materialType
    };
  
    console.log('Sending request with data:', requestData); 
    
    this.http.post('/api/request-material', requestData).subscribe({
      next: (response: any) => {
        console.log('Study material response:', response);
        if (response && response.studyMaterials && response.studyMaterials.trim() !== '') {
          this.createAndShowModal(response.studyMaterials);
        } else {
          console.error('Invalid or empty response:', response);
          alert('Error: No study material generated. Please try again.');
        }
        this.materialType = ''; // Reset material type
      },
      error: (error) => {
        console.error('Error requesting study material:', error);
        let errorMessage = 'Error requesting study material. Please try again.';
        if (error.status === 400 && error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        alert(errorMessage);
      }
    });
  }

  
  public createAndShowModal(content: string) {
    // Remove any existing modal with the same ID
    const existingModal = this.document.getElementById('quizModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal elements
    const modalDiv = this.renderer.createElement('div');
    this.renderer.addClass(modalDiv, 'modal');
    this.renderer.addClass(modalDiv, 'fade');
    this.renderer.setAttribute(modalDiv, 'id', 'quizModal');
    this.renderer.setAttribute(modalDiv, 'tabindex', '-1');
  
    const modalDialog = this.renderer.createElement('div');
    this.renderer.addClass(modalDialog, 'modal-dialog');
    this.renderer.addClass(modalDialog, 'modal-lg');
  
    const modalContent = this.renderer.createElement('div');
    this.renderer.addClass(modalContent, 'modal-content');
  
    const modalHeader = this.renderer.createElement('div');
    this.renderer.addClass(modalHeader, 'modal-header');
  
    const modalTitle = this.renderer.createElement('h5');
    this.renderer.addClass(modalTitle, 'modal-title');
    this.renderer.appendChild(modalTitle, this.renderer.createText('Generated Quiz'));
  
    const closeButton = this.renderer.createElement('button');
    this.renderer.setAttribute(closeButton, 'type', 'button');
    this.renderer.addClass(closeButton, 'btn-close');
    this.renderer.setAttribute(closeButton, 'data-bs-dismiss', 'modal');
  
    const modalBody = this.renderer.createElement('div');
    this.renderer.addClass(modalBody, 'modal-body');
    this.renderer.setProperty(modalBody, 'innerHTML', content);
  
    const modalFooter = this.renderer.createElement('div');
    this.renderer.addClass(modalFooter, 'modal-footer');
  
    const footerCloseButton = this.renderer.createElement('button');
    this.renderer.setAttribute(footerCloseButton, 'type', 'button');
    this.renderer.addClass(footerCloseButton, 'btn');
    this.renderer.addClass(footerCloseButton, 'btn-secondary');
    this.renderer.setAttribute(footerCloseButton, 'data-bs-dismiss', 'modal');
    this.renderer.appendChild(footerCloseButton, this.renderer.createText('Close'));
  
    // Assemble modal
    this.renderer.appendChild(modalHeader, modalTitle);
    this.renderer.appendChild(modalHeader, closeButton);
    this.renderer.appendChild(modalContent, modalHeader);
    this.renderer.appendChild(modalContent, modalBody);
    this.renderer.appendChild(modalFooter, footerCloseButton);
    this.renderer.appendChild(modalContent, modalFooter);
    this.renderer.appendChild(modalDialog, modalContent);
    this.renderer.appendChild(modalDiv, modalDialog);
  
     // Add modal to body
    this.renderer.appendChild(this.document.body, modalDiv);

    // Show modal
    const modal = new Modal(modalDiv);
    modal.show();

    // Set up event listener to remove modal from DOM when it's closed
    modalDiv.addEventListener('hidden.bs.modal', () => {
      this.renderer.removeChild(this.document.body, modalDiv);
    });
}

private resetForm() {
  this.selectedFile = null;
  this.selectedParentFolderId = '';
  this.subjectTag = '';
}
}