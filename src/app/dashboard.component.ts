import { Component, OnInit, Renderer2, Inject, ViewChild, ElementRef, ChangeDetectorRef, SecurityContext } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTreeModule, MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, IFlatNode } from './file-node.model';
import { FileService } from './file.service';
import { Modal } from 'bootstrap';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
      parentFolder: node.parentFolder ?? null
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
  selectedNodeIds: string[] = []; // To store the IDs of selected nodes

  constructor(
    private fileService: FileService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private sanitizer: DomSanitizer,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchTreeData();
  }

  public triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  public onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadFile(file);
      event.target.value = '';
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

      this.fileService.uploadFile(formData).subscribe({
        next: (response: any) => {
          console.log('File uploaded:', response);
          this.fetchTreeData();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error uploading file:', error);
          alert('Error uploading file. Please try again.');
          this.fetchTreeData();
        }
      });
    }
  }

  public hasChild = (_: number, node: IFlatNode) => node.expandable;

  public onNodeSelected(node: IFlatNode) {
    this.toggleNodeSelection(node);
  }

  toggleNodeSelection(node: IFlatNode): void {
    node.isSelected = !node.isSelected;

    // Update the selectedNodeIds array
    if (node.isSelected) {
      this.selectedNodeIds.push(node._id); 
    } else {
      const index = this.selectedNodeIds.indexOf(node._id);
      if (index > -1) {
        this.selectedNodeIds.splice(index, 1);
      }
    }

    this.updateParentSelection(node);
    this.updateChildSelection(node);
    this.changeDetectorRef.detectChanges();
  }

  fetchTreeData() {
    this.fileService.getTreeData().subscribe({
      next: (data: FileNode[]) => {
        this.dataSource.data = this.preserveSelection(data); // Preserve selections
        this.treeControl.dataNodes = this.treeFlattener.flattenNodes(this.dataSource.data);
        this.treeControl.expandAll();
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching tree data:', error);
      }
    });
  }

  private preserveSelection(newNodes: FileNode[]): FileNode[] {
    return newNodes.map(newNode => ({
      ...newNode,
      isSelected: this.selectedNodeIds.includes(newNode._id), // Maintain selection
      children: newNode.children ? this.preserveSelection(newNode.children) : []
    }));
  }

  getSelectedMaterialIds(): string[] {
    return this.selectedNodeIds; 
  }

  createFolder(parentFolderId?: string) {
    const folderName = prompt('Enter new folder name:');
    if (!folderName) return;

    this.fileService.createFolder(folderName, parentFolderId).subscribe({
      next: (response: any) => {
        console.log('Folder created:', response);
        this.fetchTreeData();
      },
      error: (error) => {
        console.error('Error creating folder:', error);
        alert('Error creating folder. Please try again.');
      }
    });
  }

  private updateParentSelection(node: IFlatNode) {
    const parent = this.getParentNode(node);
    if (parent) {
      parent.isSelected = this.descendantsAllSelected(parent);
      this.updateParentSelection(parent);
    }
  }

  private updateChildSelection(node: IFlatNode) {
    if (node.expandable) {
      this.treeControl.getDescendants(node).forEach(child => {
        child.isSelected = node.isSelected;
      });
    }
  }

  private getParentNode(node: IFlatNode): IFlatNode | null {
    const currentLevel = node.level;
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (currentNode.level < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  private descendantsAllSelected(node: IFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    return descendants.every(child => child.isSelected);
  }

  deleteSelectedMaterials() {
    console.log('Starting delete operation');
    const materialIdsToDelete = this.getSelectedMaterialIds();
    console.log('Materials to delete:', materialIdsToDelete);

    if (materialIdsToDelete.length === 0) {
      console.log('No materials selected for deletion');
      alert('Please select materials to delete.');
      return;
    }

    if (confirm('Are you sure you want to delete the selected materials?')) {
      this.fileService.deleteSelectedMaterials(materialIdsToDelete)
        .subscribe({
          next: (response) => {
            console.log('Materials deleted successfully', response);
            alert('Selected materials have been deleted.');
            this.fetchTreeData();
          },
          error: (error) => {
            console.error('Error deleting materials:', error);
            if (error.error && error.error.message) {
              alert(`Error: ${error.error.message}`);
            } else {
              alert('Error deleting materials. Please try again.');
            }
            this.fetchTreeData();
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
  
    const body = { materialIDs: selectedMaterials, materialType: this.materialType };
  
    this.fileService.requestMaterial(selectedMaterials, this.materialType).subscribe({
      next: (response: any) => {
        console.log('Study material response:', response);
        if (response) {
          this.createAndShowModal(response); // Pass response directly
        } else {
          console.error('Invalid response:', response);
          alert('Error: No study material generated. Please try again.');
        }
        this.materialType = '';
        this.fetchTreeData();
      },
      error: (error) => {
        console.error('Error requesting study material:', error);
        let errorMessage = 'Error requesting study material. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        alert(errorMessage);
        this.fetchTreeData();
      }
    });
  }

  public createAndShowModal(content: string) {
    const existingModal = this.document.getElementById('quizModal');
    if (existingModal) {
      existingModal.remove();
    }

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
    this.renderer.setProperty(modalBody, 'innerHTML', this.sanitizer.sanitize(SecurityContext.HTML, content));

    const submitButton = this.renderer.createElement('button');
    this.renderer.addClass(submitButton, 'btn');
    this.renderer.addClass(submitButton, 'btn-primary');
    this.renderer.appendChild(submitButton, this.renderer.createText('Submit Quiz'));
    this.renderer.listen(submitButton, 'click', () => this.submitQuiz(modalBody));

    const scoreDisplay = this.renderer.createElement('div');
    this.renderer.setAttribute(scoreDisplay, 'id', 'quiz-score');
    this.renderer.setStyle(scoreDisplay, 'display', 'none');

    const modalFooter = this.renderer.createElement('div');
    this.renderer.addClass(modalFooter, 'modal-footer');

    const footerCloseButton = this.renderer.createElement('button');
    this.renderer.setAttribute(footerCloseButton, 'type', 'button');
    this.renderer.addClass(footerCloseButton, 'btn');
    this.renderer.addClass(footerCloseButton, 'btn-secondary');
    this.renderer.setAttribute(footerCloseButton, 'data-bs-dismiss', 'modal');
    this.renderer.appendChild(footerCloseButton, this.renderer.createText('Close'));

    this.renderer.appendChild(modalHeader, modalTitle);
    this.renderer.appendChild(modalHeader, closeButton);
    this.renderer.appendChild(modalContent, modalHeader);
    this.renderer.appendChild(modalContent, modalBody);
    this.renderer.appendChild(modalFooter, submitButton);
    this.renderer.appendChild(modalFooter, scoreDisplay);
    this.renderer.appendChild(modalFooter, footerCloseButton);
    this.renderer.appendChild(modalContent, modalFooter);
    this.renderer.appendChild(modalDialog, modalContent);
    this.renderer.appendChild(modalDiv, modalDialog);

    this.renderer.appendChild(this.document.body, modalDiv);

    const modal = new Modal(modalDiv);
    modal.show();

    modalDiv.addEventListener('hidden.bs.modal', () => {
      this.renderer.removeChild(this.document.body, modalDiv);
    });
  }

  private submitQuiz(quizElement: HTMLElement) {
    const questions = quizElement.querySelectorAll('ol > li');
    const answerKey = quizElement.querySelector('#answer-key');

    if (!answerKey) {
      console.error('Answer key not found in the quiz');
      return;
    }

    let totalQuestions = questions.length;
    let score = 0;

    questions.forEach((question, index) => {
      const selectedAnswer = question.querySelector('input[type="radio"]:checked');
      if (selectedAnswer) {
        const questionNumber = index + 1;
        const userAnswer = (selectedAnswer as HTMLInputElement).value;
        const match = answerKey.textContent?.match(new RegExp(`${questionNumber}\\. (\\w)`));
        const correctAnswer = match ? match[1] : null;

        if (userAnswer === correctAnswer) {
          score++;
        }
      }
    });

    const scoreDisplay = quizElement.querySelector('#quiz-score') as HTMLElement;
    if (scoreDisplay) {
      scoreDisplay.textContent = `Your score: ${score} out of ${totalQuestions}`;
      scoreDisplay.style.display = 'block';
    } else {
      console.error('Score display element not found');
      const newScoreDisplay = this.renderer.createElement('div');
      this.renderer.setAttribute(newScoreDisplay, 'id', 'quiz-score');
      this.renderer.setProperty(newScoreDisplay, 'textContent', `Your score: ${score} out of ${totalQuestions}`);
      this.renderer.setStyle(newScoreDisplay, 'display', 'block');
      this.renderer.appendChild(quizElement, newScoreDisplay);
    }
  }

  private resetForm() {
    this.selectedFile = null;
    this.selectedParentFolderId = '';
    this.subjectTag = '';
  }
}