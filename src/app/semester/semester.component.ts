import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { FileService } from '../file.service';
import { Semester } from '../models/semester.model';
import { ClassList } from '../models/class-list.model';
import { Chapter } from '../models/chapter.model';
import { SelectedMaterialService } from '../../app/selected-material.service';
import { UserService } from '../user.service';
import { User } from '../models/user';
import { Router } from '@angular/router';


@Component({
  selector: 'app-semester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semester.component.html',
  styleUrls: ['./semester.component.css']
})
export class SemesterComponent implements OnInit {
  semesters$: Observable<Semester[]>;
  selectedSemesterId$ = new BehaviorSubject<string | null>(null);
  selectedClassListId$ = new BehaviorSubject<string | null>(null);
  classLists$: Observable<ClassList[]>;
  selectedFileIds$ = new BehaviorSubject<string[]>([]);
  chapters$: Observable<Chapter[]>;
  selectedChapterIds$ = new BehaviorSubject<string[]>([]);
  selectedSemesterIds$ = new BehaviorSubject<string[]>([]);
  selectedClassListIds$ = new BehaviorSubject<string[]>([]);
  showClassList = false;

  user: User = { // Define the user property with an initial value
    username: '',
    password: '',
    email: ''
  };

  newSemesterName = '';
 

  isExactlyOneSemesterSelected$: Observable<boolean>;
  isExactlyOneClassListSelected$: Observable<boolean>;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private userService: UserService,
    private fileService: FileService,
    private cdRef: ChangeDetectorRef,
    private selectedMaterialService: SelectedMaterialService
  ) {
    this.semesters$ = this.fileService.semesters$;
    this.classLists$ = this.fileService.classLists$;
    this.chapters$ = this.fileService.chapters$;

    this.isExactlyOneSemesterSelected$ = this.selectedSemesterIds$.pipe(
      map(ids => ids.length === 1)
    );
    this.isExactlyOneClassListSelected$ = this.selectedClassListIds$.pipe(
      map(ids => ids.length === 1)
    );
  }

  ngOnInit(): void {
    // 1. Check if the user is already authenticated
    if (this.userService.isAuthenticated()) {
      this.fetchSemesters(); 
    } else {
      // 2. If not authenticated, trigger the login process
      //    (You'll need to implement this part based on your app's flow)
      //    For example, you might redirect to a login page:
      //    this.router.navigate(['/login']); 

      // 3. After successful login, subscribe to the login observable
      this.userService.loginUser(this.user).pipe(
        switchMap(() => this.fileService.getSemesters())
      ).subscribe(semesters => {
        // Handle the fetched semesters
        console.log('Semesters fetched:', semesters);
        // ... any other logic to update your component's state
      });
    }
  }

  fetchSemesters() {
    this.fileService.getSemesters().subscribe(
      semesters => {
        console.log('Semesters fetched:', semesters);
        // ... any other logic to update your component's state
      },
      error => {
        console.error('Error fetching semesters:', error);
      }
    );
  }
  
  

  onItemSelect(event: Event, type: 'semester' | 'classList' | 'chapter' | 'file', id: string | undefined): void {
    if (!id) return;
    const checkbox = event.target as HTMLInputElement;

    switch (type) {
      case 'semester':
        this.updateSelection(this.selectedSemesterIds$, id, checkbox.checked);
        break;
      case 'classList':
        this.updateSelection(this.selectedClassListIds$, id, checkbox.checked);
        break;
      case 'chapter':
        this.updateSelection(this.selectedChapterIds$, id, checkbox.checked);
        break;
      case 'file':
        this.updateSelection(this.selectedFileIds$, id, checkbox.checked);
        if (checkbox.checked) {
          this.selectedMaterialService.addSelectedMaterial(id);
        } else {
          this.selectedMaterialService.removeSelectedMaterial(id);
        }
        break;
    }
  }

  private updateSelection(subject: BehaviorSubject<string[]>, id: string, isChecked: boolean): void {
    const currentSelection = subject.value;
    const newSelection = isChecked
      ? [...currentSelection, id]
      : currentSelection.filter(selectedId => selectedId !== id);
    subject.next(newSelection);
  }

  triggerFileUpload(): void {
    this.isExactlyOneChapterSelected().pipe(take(1)).subscribe(isOneChapterSelected => {
      if (isOneChapterSelected && this.fileInput) {
        this.fileInput.nativeElement.click();
      } else {
        console.error('Please select exactly one chapter for file upload');
      }
    });
  }
  

  
  
  

  /* eslint-disable @typescript-eslint/no-unused-vars */
uploadFiles(formData: FormData, chapterId: string): void {
  this.fileService.uploadFiles(formData).subscribe(
    response => {
      console.log('Files uploaded successfully', response);
      this.selectedClassListId$.pipe(take(1)).subscribe(classListId => {
        if (classListId) {
          this.fileService.getChapters(classListId).subscribe();
        }
      });
    },
    error => {
      console.error('Error uploading files', error);
    }
  );
}
/* eslint-enable @typescript-eslint/no-unused-vars */


  deleteSelectedItems(): void {
    const selectedSemesterIds = this.selectedSemesterIds$.value;
    const selectedClassListIds = this.selectedClassListIds$.value;
    const selectedChapterIds = this.selectedChapterIds$.value;
    const selectedFileIds = this.selectedFileIds$.value;
  
    const totalSelectedItems = selectedSemesterIds.length + selectedClassListIds.length + 
                               selectedChapterIds.length + selectedFileIds.length;
    
    if (totalSelectedItems === 0) return;
  
    const confirmDelete = confirm(`Are you sure you want to delete ${totalSelectedItems} selected item(s)? This action cannot be undone.`);
    if (!confirmDelete) return;
  
    // Delete semesters
    selectedSemesterIds.forEach(id => {
      this.fileService.deleteSemester(id).subscribe(
        () => {
          console.log(`Semester ${id} deleted successfully`);
          this.fileService.getSemesters().subscribe();
        },
        error => console.error(`Error deleting semester ${id}:`, error)
      );
    });
  
    // Delete class lists
    selectedClassListIds.forEach(id => {
      this.fileService.deleteClassList(id).subscribe(
        () => {
          console.log(`Class list ${id} deleted successfully`);
          this.selectedSemesterId$.pipe(take(1)).subscribe(semesterId => {
            if (semesterId) {
              this.fileService.getClassLists(semesterId).subscribe();
            }
          });
        },
        error => console.error(`Error deleting class list ${id}:`, error)
      );
    });
  
    // Delete chapters
    selectedChapterIds.forEach(id => {
      this.fileService.deleteChapter(id).subscribe(
        () => {
          console.log(`Chapter ${id} deleted successfully`);
          this.selectedClassListId$.pipe(take(1)).subscribe(classListId => {
            if (classListId) {
              this.fileService.getChapters(classListId).subscribe();
            }
          });
        },
        error => console.error(`Error deleting chapter ${id}:`, error)
      );
    });
  
    // Delete files
    if (selectedFileIds.length > 0) {
      this.fileService.deleteSelectedMaterials(selectedFileIds).subscribe(
        () => {
          console.log('Selected files deleted successfully');
          this.selectedClassListId$.pipe(take(1)).subscribe(classListId => {
            if (classListId) {
              this.fileService.getChapters(classListId).subscribe();
            }
          });
        },
        error => console.error('Error deleting selected files:', error)
      );
    }
  
    // Clear all selections
    this.selectedSemesterIds$.next([]);
    this.selectedClassListIds$.next([]);
    this.selectedChapterIds$.next([]);
    this.selectedFileIds$.next([]);
  }
  

  createSemester(): void {
    if (this.newSemesterName.trim() !== '') {
      this.fileService.createSemester(this.newSemesterName).subscribe();
      this.newSemesterName = '';
    }
  }

  onSemesterSelect(semesterId: string | undefined, event: Event): void { 
    if (!semesterId) return;
  
    event.preventDefault(); // Prevent the default link navigation 
  
    this.selectedSemesterId$.next(semesterId);
    this.fileService.getClassLists(semesterId).subscribe(
      () => {
        this.showClassList = true;
      },
      error => { 
        console.error('Error fetching class lists:', error); 
      }
    );
  }

  createClassList(): void {
    this.selectedSemesterIds$.pipe(take(1)).subscribe(selectedSemesterIds => {
      if (selectedSemesterIds.length !== 1) return;
      const semesterId = selectedSemesterIds[0];
      const classListName = prompt("Enter the name for the new class list:");
      if (classListName) {
        this.fileService.createClassList(semesterId, classListName).subscribe(
          (createdClassList) => {
            console.log('Created class list:', createdClassList);
            this.fileService.getClassLists(semesterId).subscribe();
          },
          (error) => {
            console.error('Error creating class list:', error);
          }
        );
      }
    });
  }

  onClassListSelect(classList: ClassList, event: Event): void { // Add event argument 
    event.preventDefault(); // Prevent default link behavior 
  
    if (classList && classList._id) {
      this.selectedClassListId$.next(classList._id);
      this.fileService.getChapters(classList._id).subscribe(
        chapters => { 
          console.log('Chapters in component:', chapters);
          this.cdRef.detectChanges();
        },
        error => console.error('Error fetching chapters:', error)
      );
    }
  }

  createChapter(): void {
    this.selectedClassListIds$.pipe(take(1)).subscribe(selectedClassListIds => {
      if (selectedClassListIds.length !== 1) return;
      const classListId = selectedClassListIds[0];
      const chapterName = prompt("Enter the name for the new chapter:");
      if (chapterName) {
        this.fileService.createChapter(classListId, chapterName).subscribe(
          (createdChapter) => {
            console.log('Created chapter:', createdChapter);
            this.fileService.getChapters(classListId).subscribe();
          },
          (error) => {
            console.error('Error creating chapter:', error);
          }
        );
      }
    });
  }

  
  
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const files = fileInput.files;
  
    if (files && files.length > 0) {
      this.selectedChapterIds$.pipe(take(1)).subscribe(chapterIds => {
        if (chapterIds && chapterIds.length === 1) {
          const chapterId = chapterIds[0];
          const formData = new FormData();
          for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
          }
          formData.append('chapterId', chapterId);
          this.uploadFiles(formData, chapterId);
        } else {
          console.error('Please select exactly one chapter for file upload');
        }
      });
    }
  }
  
  
  
  

  
  onChapterSelect(chapterId: string | undefined, event: Event): void {
    if (!chapterId) return;
    event.preventDefault();
    this.selectedChapterIds$.pipe(take(1)).subscribe(currentIds => {
      if (currentIds.includes(chapterId)) {
        this.selectedChapterIds$.next(currentIds.filter(id => id !== chapterId));
      } else {
        this.selectedChapterIds$.next([...currentIds, chapterId]);
      }
    });
  }
  
  isExactlyOneChapterSelected(): Observable<boolean> {
    return this.selectedChapterIds$.pipe(
      map(ids => ids && ids.length === 1)
    );
  }
}  