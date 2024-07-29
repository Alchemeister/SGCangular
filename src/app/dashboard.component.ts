import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SemesterComponent } from '../app/semester/semester.component';
import { Component, ViewChild, ElementRef, Inject, Renderer2, OnInit } from '@angular/core';
import { Chapter } from '../app/models/chapter.model';
import { FileService } from '../app/file.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Modal } from 'bootstrap';
import { SelectedMaterialService } from './selected-material.service';
import { EMPTY } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { SavedMaterial } from '../app/models/savedMaterials.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SemesterComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userAnswers: Record<number, string> = {};
  chapters: Chapter[] = [];
  materialType = '';
  classListId = '';
  isModalCreating = false;
  savedMaterials: SavedMaterial[] = [];
  public modalRef: any;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private fileService: FileService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private sanitizer: DomSanitizer,
    private selectedMaterialService: SelectedMaterialService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadSavedMaterials();
    this.selectedMaterialService.selectedMaterials$.subscribe(materialIds => {
      console.log("Selected Materials in DashboardComponent:", materialIds);
    });
  }

  private loadSavedMaterials() {
    this.fileService.getSavedMaterials().subscribe(
      materials => this.savedMaterials = materials,
      error => console.error('Error loading saved materials:', error)
    );
  }

  public triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  logout() {
    this.userService.clearToken();
    this.router.navigate(['/login']);
  }

  requestMaterial() {
    console.log('Requesting material of type:', this.materialType);

    const title = `Generating ${this.materialType}`;
    this.createAndShowModal('', title);

    this.selectedMaterialService.selectedMaterials$.pipe(
      take(1),
      switchMap(selectedMaterials => {
        console.log('Selected materials before request:', selectedMaterials);
        if (selectedMaterials.length === 0) {
          alert('Please select at least one material.');
          return EMPTY;
        }

        if (!this.materialType) {
          alert('Please select a material type.');
          return EMPTY;
        }

        return this.fileService.requestMaterial(selectedMaterials, this.materialType);
      })
    ).subscribe({
      next: (response: any) => {
        console.log('Study material response:', response);
        if (response && response.studyMaterials) {
          console.log('Raw AI output:', response.studyMaterials);
          const updatedTitle = `Generated ${this.materialType}`;
          this.updateModalContent(response.studyMaterials, updatedTitle);
        } else {
          console.error('Invalid response:', response);
          alert('Error: No study material generated. Please try again.');
        }
        this.materialType = '';
      },
      error: (error) => {
        console.error('Error requesting study material:', error);
        let errorMessage = 'Error requesting study material. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        alert(errorMessage);
      }
    });
  }

  private updateModalContent(content: string, title: string) {
    const modalBody = this.document.querySelector('#studyMaterialModal .modal-body') as HTMLElement;
    const modalTitle = this.document.querySelector('#studyMaterialModal .modal-title') as HTMLElement;
  
    if (modalBody && modalTitle) {
      modalTitle.textContent = title;
      modalBody.innerHTML = content;
  
      if (this.materialType === 'quiz') {
        this.setupQuiz(modalBody);
      } else if (this.materialType === 'flashcards') {
        this.setupFlashcards(modalBody);
      }
    }
  }
  
  private setupFlashcards(modalBody: HTMLElement) {
    const content = modalBody.innerHTML;
    const flashcardsContainer = this.createFlashcardContainer(content);
    modalBody.innerHTML = '';
    modalBody.appendChild(flashcardsContainer);
  
    const style = this.renderer.createElement('style');
    this.renderer.setAttribute(style, 'type', 'text/css');
    const css = `
      .flashcards-container { display: flex; flex-direction: column; align-items: center; }
      .flashcard { width: 350px; height: 250px; margin: 15px 0; perspective: 1000px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; }
      .flashcard-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s; transform-style: preserve-3d; border-radius: 8px; }
      .flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; padding: 15px; overflow-y: auto; border-radius: 8px; font-family: Arial, sans-serif; font-size: 14px; }
      .flashcard-front { background-color: #f0f8ff; color: #333; box-shadow: inset 0 0 8px rgba(0,0,0,0.1); }
      .flashcard-back { background-color: #e6f3ff; color: #333; transform: rotateY(180deg); box-shadow: inset 0 0 8px rgba(0,0,0,0.1); }
      .flashcard-inner.flipped { transform: rotateY(180deg); }
    `;
    this.renderer.appendChild(style, this.renderer.createText(css));
    this.renderer.appendChild(modalBody, style);
  }

  

  public createAndShowModal(content: string, title: string) {
    if (this.isModalCreating) {
      console.log('Modal creation already in progress');
      return;
    }
    this.isModalCreating = true;
  
    const existingModal = this.document.getElementById('studyMaterialModal');
    if (existingModal) {
      existingModal.remove();
    }
  
    const modalDiv = this.renderer.createElement('div');
    this.renderer.addClass(modalDiv, 'modal');
    this.renderer.addClass(modalDiv, 'fade');
    this.renderer.setAttribute(modalDiv, 'id', 'studyMaterialModal');
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
    this.renderer.setAttribute(modalTitle, 'id', 'studyMaterialModalTitle');
    this.renderer.appendChild(modalTitle, this.renderer.createText(title));
  
    const closeButton = this.renderer.createElement('button');
    this.renderer.setAttribute(closeButton, 'type', 'button');
    this.renderer.addClass(closeButton, 'btn-close');
    this.renderer.setAttribute(closeButton, 'data-bs-dismiss', 'modal');
  
    const modalBody = this.renderer.createElement('div');
    this.renderer.addClass(modalBody, 'modal-body');
    this.renderer.setAttribute(modalBody, 'id', 'studyMaterialModalBody');
    modalBody.innerHTML = content;
  
    const modalFooter = this.renderer.createElement('div');
    this.renderer.addClass(modalFooter, 'modal-footer');
    this.renderer.setAttribute(modalFooter, 'id', 'studyMaterialModalFooter');
  
    const saveButton = this.renderer.createElement('button');
    this.renderer.addClass(saveButton, 'btn');
    this.renderer.addClass(saveButton, 'btn-primary');
    this.renderer.appendChild(saveButton, this.renderer.createText('Save Material'));
    this.renderer.listen(saveButton, 'click', () => this.saveMaterial(content, title));
  
    this.renderer.appendChild(modalHeader, modalTitle);
    this.renderer.appendChild(modalHeader, closeButton);
    this.renderer.appendChild(modalContent, modalHeader);
    this.renderer.appendChild(modalContent, modalBody);
    this.renderer.appendChild(modalFooter, saveButton);
    this.renderer.appendChild(modalContent, modalFooter);
    this.renderer.appendChild(modalDialog, modalContent);
    this.renderer.appendChild(modalDiv, modalDialog);
  
    this.renderer.appendChild(this.document.body, modalDiv);
  
    const modal = new Modal(modalDiv);
    modal.show();
  
    modalDiv.addEventListener('shown.bs.modal', () => {
      this.isModalCreating = false;
    });
  
    modalDiv.addEventListener('click', (event: MouseEvent) => {
      if (event.target === modalDiv) {
        modal.hide();
        this.renderer.removeChild(this.document.body, modalDiv);
      }
    });
  
    modalDiv.addEventListener('hidden.bs.modal', () => {
      if (modalDiv.parentNode === this.document.body) {
        this.renderer.removeChild(this.document.body, modalDiv);
      }
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    });
  }
  
  public saveMaterial(content: string, title: string) {
    const selectedChapters = this.getSelectedChapterNames();
    const chapterInfo = selectedChapters.length > 1 ? 'Multiple Chapters' : selectedChapters[0];
    const materialTitle = `${title} (${this.materialType}) - ${chapterInfo}`;
  
    this.fileService.saveMaterial(content, this.materialType, materialTitle).subscribe(
      response => {
        console.log('Material saved successfully');
        this.updateSavedMaterialsList();
        this.showSaveSuccessMessage();
      },
      error => {
        console.error('Error saving material:', error);
        this.showSaveErrorMessage();
      }
    );
  }

  private updateSavedMaterialsList() {
    this.fileService.getSavedMaterials().subscribe(
      materials => {
        this.savedMaterials = materials;
      },
      error => console.error('Error fetching updated materials list:', error)
    );
  }

  private showSaveErrorMessage() {
    alert('Error saving material. Please try again.');
  }

  private showSaveSuccessMessage() {
    alert('Material saved successfully!');
  }

  private getSelectedChapterNames(): string[] {
    // Implement this method to return an array of selected chapter names
    // You'll need to track selected chapters in your component
    return []; // Placeholder return, replace with actual implementation
  }

  private createFlashcardContainer(content: string): HTMLElement {
    const flashcardsContainer = this.renderer.createElement('div');
    this.renderer.addClass(flashcardsContainer, 'flashcards-container');

    // Split the content into question-answer pairs
    const pairs = content.split('\n\n').filter(pair => pair.trim() !== '');

    pairs.forEach((pair) => {
      const [question, answer] = pair.split('\n');
      const flashcard = this.createFlashcardElement(question, answer);
      flashcardsContainer.appendChild(flashcard);
    });

    return flashcardsContainer;
  }

  private createFlashcardElement(question: string, answer: string): HTMLElement {
    const flashcard = this.renderer.createElement('div');
    this.renderer.addClass(flashcard, 'flashcard');

    const inner = this.renderer.createElement('div');
    this.renderer.addClass(inner, 'flashcard-inner');

    const front = this.renderer.createElement('div');
    this.renderer.addClass(front, 'flashcard-front');
    front.textContent = question;

    const back = this.renderer.createElement('div');
    this.renderer.addClass(back, 'flashcard-back');
    back.textContent = answer;

    this.renderer.appendChild(inner, front);
    this.renderer.appendChild(inner, back);
    this.renderer.appendChild(flashcard, inner);

    this.renderer.listen(flashcard, 'click', () => {
      flashcard.classList.toggle('flipped');
    });

    return flashcard;
  }

  private createLoadingContent(): string {
    return `
      <div class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Generating ${this.materialType}...</p>
      </div>
    `;
  }

  private setupQuiz(quizElement: HTMLElement) {
    const radioButtons = Array.from(quizElement.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
  
    radioButtons.forEach((radioButton) => {
      const questionNumber = parseInt(radioButton.name.replace('q', ''), 10);
      this.renderer.listen(radioButton, 'change', () => {
        this.onAnswerSelect(questionNumber, radioButton.value);
      });
    });
  
    const modalFooter = this.document.getElementById('studyMaterialModalFooter');
    if (modalFooter) {
      const scoreDisplay = this.renderer.createElement('div');
      this.renderer.setAttribute(scoreDisplay, 'id', 'quiz-score');
      this.renderer.setStyle(scoreDisplay, 'display', 'none');
      this.renderer.appendChild(modalFooter, scoreDisplay);
  
      const submitButton = this.renderer.createElement('button');
      this.renderer.addClass(submitButton, 'btn');
      this.renderer.addClass(submitButton, 'btn-primary');
      this.renderer.appendChild(submitButton, this.renderer.createText('Submit Quiz'));
      this.renderer.listen(submitButton, 'click', () => this.submitQuiz(quizElement));
  
      this.renderer.appendChild(modalFooter, submitButton);
    }
  }
  onAnswerSelect(questionNumber: number, selectedAnswer: string): void {
    this.userAnswers[questionNumber] = selectedAnswer;
    console.log('User Answers:', this.userAnswers);
  }

  private highlightAnswer(answerElement: HTMLInputElement, color: string) {
    const answerLabel = answerElement.closest('label');
    if (answerLabel) {
      answerLabel.style.backgroundColor = color;
    } else {
      console.warn('Label not found for answer element:', answerElement);
    }
  }

  private submitQuiz(quizElement: HTMLElement) {
    const questions = quizElement.querySelectorAll('ol > li');
    const answerKey = quizElement.querySelector('#answer-key');

    if (!answerKey) {
      console.error('Answer key not found in the quiz');
      return;
    }

    const totalQuestions = questions.length;
    let score = 0;

    questions.forEach((question, index) => {
      const selectedAnswer = question.querySelector('input[type="radio"]:checked') as HTMLInputElement | null;

      if (selectedAnswer) {
        const questionNumber = index + 1;
        const userAnswer = selectedAnswer.value;
        const match = answerKey.textContent?.match(new RegExp(`${questionNumber}\\. (\\w)`));
        const correctAnswerValue = match ? match[1] : null;

        const correctAnswerElement = question.querySelector(`input[type="radio"][value="${correctAnswerValue}"]`) as HTMLInputElement;

        if (userAnswer === correctAnswerValue) {
          score++;
          this.highlightAnswer(selectedAnswer, 'green');
        } else {
          this.highlightAnswer(selectedAnswer, 'red');
          if (correctAnswerElement) {
            this.highlightAnswer(correctAnswerElement, 'green');
          }
        }
      }
    });

    const scoreDisplay = document.getElementById('quiz-score') as HTMLElement;
    if (scoreDisplay) {
      scoreDisplay.textContent = `Your score: ${score} out of ${totalQuestions}`;
      scoreDisplay.style.display = 'block';
    } else {
      console.error('Score display element not found');
    }
  }
}
