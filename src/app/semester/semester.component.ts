import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { FileService } from '../file.service';
import { Semester } from '../models/semester.model';
import { ClassList } from '../models/class-list.model';
import { Chapter } from '../models/chapter.model';

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
  selectedChapterIds$ = new
  
  BehaviorSubject<string[]>([]);

  newSemesterName = '';
  newClassListName = '';
  newChapterName = '';
  userId = '6643d532b06cfcf923e551b4';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fileService: FileService,
    private cdRef: ChangeDetectorRef
  ) {
    this.semesters$ = this.fileService.semesters$;
    this.classLists$ = this.fileService.classLists$;
    this.chapters$ = this.fileService.chapters$;
  }

  ngOnInit(): void {
    this.fileService.getSemesters(this.userId).subscribe();
  }

  onItemSelect(event: Event, type: 'semester' | 'classList' | 'chapter' | 'file', id: string | undefined): void {
    if (!id) return;
    const checkbox = event.target as HTMLInputElement;
    if (type === 'file') {
      const currentSelectedFileIds = this.selectedFileIds$.value;
      if (checkbox.checked) {
        this.selectedFileIds$.next([...currentSelectedFileIds, id]);
      } else {
        this.selectedFileIds$.next(currentSelectedFileIds.filter(fileId => fileId !== id));
      }
    } else if (type === 'chapter') {
      const currentSelectedChapterIds = this.selectedChapterIds$.value;
      if (checkbox.checked) {
        this.selectedChapterIds$.next([...currentSelectedChapterIds, id]);
      } else {
        this.selectedChapterIds$.next(currentSelectedChapterIds.filter(chapterId => chapterId !== id));
      }
    }
  }

  triggerFileUpload(): void {
    this.isExactlyOneChapterSelected().pipe(take(1)).subscribe(isOneChapterSelected => {
      if (isOneChapterSelected) {
        this.fileInput.nativeElement.click();
      }
    });
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const files = fileInput.files;
    if (files && files.length > 0) {
      this.selectedChapterIds$.pipe(take(1)).subscribe(selectedChapterIds => {
        if (selectedChapterIds.length === 1) {
          const chapterId = selectedChapterIds[0];
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
    fileInput.value = '';
  }
  
  uploadFiles(formData: FormData, chapterId: string): void {
    this.fileService.uploadFiles(formData).subscribe(
      response => {
        console.log('Files uploaded successfully', response);
        // Refresh the chapters for the current class list
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
  

  deleteSelectedItems(): void {
    const selectedSemesterId = this.selectedSemesterId$.value;
    const selectedClassListId = this.selectedClassListId$.value;
    const selectedChapterIds = this.selectedChapterIds$.value;
    const selectedFileIds = this.selectedFileIds$.value;
  
    const totalSelectedItems = selectedChapterIds.length + selectedFileIds.length;
     
    if (totalSelectedItems === 0) return;
  
    const confirmDelete = confirm("Are you sure you want to delete the selected items? This action cannot be undone.");
    if (!confirmDelete) return;
  
    if (selectedChapterIds.length > 0) {
      selectedChapterIds.forEach(id =>
        this.fileService.deleteChapter(id).subscribe(
          () => {
            console.log(`Chapter ${id} deleted successfully`);
            // Refresh the chapters list
            if (selectedClassListId) {
              this.fileService.getChapters(selectedClassListId).subscribe();
            }
          },
          error => console.error(`Error deleting chapter ${id}:`, error)
        )
      );
    }
  
    if (selectedFileIds.length > 0) {
      this.fileService.deleteSelectedMaterials(selectedFileIds).subscribe(
        () => {
          console.log('Selected files deleted successfully');
          // Refresh the chapters list to update file information
          if (selectedClassListId) {
            this.fileService.getChapters(selectedClassListId).subscribe();
          }
        },
        error => console.error('Error deleting selected files:', error)
      );
    }
  
    // Clear all selections
    this.selectedChapterIds$.next([]);
    this.selectedFileIds$.next([]);
  }
  

  createSemester(): void {
    if (this.newSemesterName.trim() !== '') {
      this.fileService.createSemester(this.newSemesterName, this.userId).subscribe();
      this.newSemesterName = '';
    }
  }

  onSemesterSelect(semesterId: string | undefined): void {
    if (!semesterId) return;
    this.selectedSemesterId$.next(semesterId);
    this.fileService.getClassLists(semesterId).subscribe();
  }

  createClassList(semesterId: string | undefined): void {
    if (!semesterId) return;
    if (this.newClassListName.trim() !== '') {
      this.fileService.createClassList(semesterId, this.newClassListName).subscribe();
      this.newClassListName = '';
    }
  }

  onClassListSelect(classList: ClassList): void {
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
  

  createChapter(classListId: string | undefined): void {
    if (!classListId) return;
    if (this.newChapterName.trim() !== '') {
      this.fileService.createChapter(classListId, this.newChapterName).subscribe(
        newChapter => {
          console.log('Created new chapter:', newChapter);
          this.fileService.getChapters(classListId).subscribe();
          this.newChapterName = '';
          this.cdRef.detectChanges();
        },
        error => console.error('Error creating chapter:', error)
      );
    }
  }


  isExactlyOneChapterSelected(): Observable<boolean> {
    return this.selectedChapterIds$.pipe(map(ids => ids.length === 1));
  }
}
