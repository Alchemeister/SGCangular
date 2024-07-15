import { Component, ViewChild, ElementRef, Inject, Renderer2, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SemesterComponent } from '../app/semester/semester.component';
import { Chapter } from '../app/models/chapter.model';
import { FileService } from '../app/file.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Modal } from 'bootstrap';
import { SelectedMaterialService } from './selected-material.service';
import { EMPTY } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserService } from './user.service';

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
    this.selectedMaterialService.selectedMaterials$.subscribe(materialIds => {
      console.log("Selected Materials in DashboardComponent:", materialIds); 
      // You now have the selected file IDs from SemesterComponent
    });
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
  
    this.createAndShowModal(this.createLoadingContent());
  
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
          this.createAndShowModal(response.studyMaterials);
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
  
    // Create a temporary div to parse the HTML content
    const tempDiv = this.renderer.createElement('div');
    tempDiv.innerHTML = content;
  
    // Append each child node from the temporary div to the modal body
    while (tempDiv.firstChild) {
      modalBody.appendChild(tempDiv.firstChild);
    }
  
    // *** Add event listeners to radio buttons after setting innerHTML ***
    const radioButtons = modalBody.querySelectorAll('input[type="radio"]');
    radioButtons.forEach((radioButton: any) => {
      const questionNumber = parseInt(radioButton.name.replace('q', ''), 10);
      this.renderer.listen(radioButton, 'change', () => {
        this.onAnswerSelect(questionNumber, radioButton.value);
      });
    });
  
    // *** Create the modalFooter ***
    const modalFooter = this.renderer.createElement('div');
    this.renderer.addClass(modalFooter, 'modal-footer');
  
    // *** Create the scoreDisplay and append to modalFooter ***
    const scoreDisplay = this.renderer.createElement('div');
    this.renderer.setAttribute(scoreDisplay, 'id', 'quiz-score');
    this.renderer.setStyle(scoreDisplay, 'display', 'none');
    this.renderer.appendChild(modalFooter, scoreDisplay);
  
    // *** Create the submitButton and append to modalFooter ***
    const submitButton = this.renderer.createElement('button');
    this.renderer.addClass(submitButton, 'btn');
    this.renderer.addClass(submitButton, 'btn-primary');
    this.renderer.appendChild(submitButton, this.renderer.createText('Submit Quiz'));
    this.renderer.listen(submitButton, 'click', () => this.submitQuiz(modalBody));
    this.renderer.appendChild(modalFooter, submitButton);
  
    // *** Append elements to the modal structure ***
    this.renderer.appendChild(modalHeader, modalTitle);
    this.renderer.appendChild(modalHeader, closeButton);
    this.renderer.appendChild(modalContent, modalHeader);
    this.renderer.appendChild(modalContent, modalBody);
    this.renderer.appendChild(modalContent, modalFooter); 
    this.renderer.appendChild(modalDialog, modalContent);
    this.renderer.appendChild(modalDiv, modalDialog);
  
    // *** Now append the fully constructed modalDiv to the document.body ***
    this.renderer.appendChild(this.document.body, modalDiv);
  
    const modal = new Modal(modalDiv);
modal.show();

// Add click event listener to the modal
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

  private createLoadingContent(): string {
    return `
      <div class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Generating quiz...</p>
      </div>
    `;
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
        const userAnswer = selectedAnswer.value; // Use .value directly on selectedAnswer
        const match = answerKey.textContent?.match(new RegExp(`${questionNumber}\\. (\\w)`));
        const correctAnswerValue = match ? match[1] : null;
    
        
        const correctAnswerElement = question.querySelector(`input[type="radio"][value="${correctAnswerValue}"]`) as HTMLInputElement;
    
        if (userAnswer === correctAnswerValue) { // Compare userAnswer directly
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