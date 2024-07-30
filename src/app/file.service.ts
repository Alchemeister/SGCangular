import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject, Subject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Semester } from './models/semester.model';
import { ClassList } from './models/class-list.model';
import { Chapter } from './models/chapter.model';
import { UserService } from './user.service';
import { File as CustomFile } from './models/file.model';

// Interfaces for API responses
interface StudyMaterialResponse {
  message: string;
  studyMaterials: string;
}

interface DeleteMaterialsResponse {
  message: string;
  deletedPaths: string[];
  errors?: string[];
  remainingUploadCount: number;
  remainingUploads: string[];
}

interface UploadResponse {
  message: string;
  uploadedFiles: CustomFile[];
}


@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = '/api/files';

  // BehaviorSubjects to manage application state
  private semestersSubject = new BehaviorSubject<Semester[]>([]);
  private classListsSubject = new BehaviorSubject<ClassList[]>([]);
  private chaptersSubject = new BehaviorSubject<Chapter[]>([]);

  constructor(private http: HttpClient, private userService: UserService) {}

  // --- Semester Management ---
  getSemesters(): Observable<Semester[]> {
    const headers = this.userService.setAuthHeader();
    return this.http.get<Semester[]>(`${this.apiUrl}/semesters`, { headers })
      .pipe(
        tap(semesters => {
          this.semestersSubject.next(semesters); 
        }),
        catchError(this.handleError<Semester[]>('getSemesters', []))
      );
  }

  createSemester(name: string): Observable<Semester> {
    const headers = this.userService.setAuthHeader();
    return this.http.post<Semester>(`${this.apiUrl}/semesters`, { name }, { headers })
      .pipe(
        tap(newSemester => {
          const currentSemesters = this.semestersSubject.value;
          this.semestersSubject.next([...currentSemesters, newSemester]);
        }),
        catchError(this.handleError<Semester>('createSemester'))
      );
  }

  private uploadCompletedSubject = new Subject<void>();
  uploadCompleted$ = this.uploadCompletedSubject.asObservable();
  

  deleteSemester(semesterId: string): Observable<void> {
    const headers = this.userService.setAuthHeader();
    return this.http.delete<void>(`${this.apiUrl}/semesters/${semesterId}`, { headers })
      .pipe(
        tap(() => {
          const currentSemesters = this.semestersSubject.value;
          this.semestersSubject.next(currentSemesters.filter(s => s._id !== semesterId));
        }),
        catchError(this.handleError<void>('deleteSemester'))
      );
  }

  // --- Class List Management ---
  getClassLists(semesterId: string): Observable<ClassList[]> {
    const headers = this.userService.setAuthHeader();
    return this.http.get<ClassList[]>(`${this.apiUrl}/semesters/${semesterId}/class-lists`, { headers })
      .pipe(
        tap(classLists => {
          this.classListsSubject.next(classLists); 
        }),
        catchError(this.handleError<ClassList[]>('getClassLists', []))
      );
  }

  createClassList(semesterId: string, name: string): Observable<ClassList> {
    const headers = this.userService.setAuthHeader();
    return this.http.post<ClassList>(`${this.apiUrl}/semesters/${semesterId}/class-lists`, { name }, { headers })
      .pipe(
        tap(newClassList => {
          const currentClassLists = this.classListsSubject.value;
          this.classListsSubject.next([...currentClassLists, newClassList]);
        }),
        catchError(this.handleError<ClassList>('createClassList'))
      );
  }

  deleteClassList(classListId: string): Observable<void> {
    const headers = this.userService.setAuthHeader();
    return this.http.delete<void>(`${this.apiUrl}/class-lists/${classListId}`, { headers })
      .pipe(
        tap(() => {
          const currentClassLists = this.classListsSubject.value;
          this.classListsSubject.next(currentClassLists.filter(cl => cl._id !== classListId));
        }),
        catchError(this.handleError<void>('deleteClassList'))
      );
  }

  // --- Chapter Management ---
  getChapters(classListId: string): Observable<Chapter[]> {
    const headers = this.userService.setAuthHeader();
    return this.http.get<Chapter[]>(`${this.apiUrl}/class-lists/${classListId}/chapters`, { headers })
      .pipe(
        tap(chapters => {
          this.chaptersSubject.next(chapters);
        }),
        catchError(this.handleError<Chapter[]>('getChapters', []))
      );
  }

  createChapter(classListId: string, chapterName: string): Observable<Chapter[]> {
    const headers = this.userService.setAuthHeader();
    return this.http.post<Chapter>(`${this.apiUrl}/class-lists/${classListId}/chapters`, { name: chapterName }, { headers })
      .pipe(
        switchMap(newChapter => {
          return this.getChapters(classListId);
        }),
        catchError(this.handleError<Chapter[]>('createChapter', []))
      );
  }

  deleteChapter(chapterId: string): Observable<void> {
    const headers = this.userService.setAuthHeader();
    return this.http.delete<void>(`${this.apiUrl}/chapters/${chapterId}`, { headers })
      .pipe(
        tap(() => {
          const currentChapters = this.chaptersSubject.value;
          this.chaptersSubject.next(currentChapters.filter(ch => ch._id !== chapterId));
        }),
        catchError(this.handleError<void>('deleteChapter'))
      );
  }


  saveMaterial(content: string, type: string, title: string): Observable<any> {
    const headers = this.userService.setAuthHeader();
    return this.http.post(`${this.apiUrl}/study-materials`, { content, type, title }, { headers }).pipe(
      tap(response => console.log('Save response:', response)),
      catchError(this.handleError<any>('saveMaterial'))
    );
  }
  
  getSavedMaterials(): Observable<any[]> {
    const headers = this.userService.setAuthHeader();
    return this.http.get<any[]>(`${this.apiUrl}/study-materials`, { headers }).pipe(
      tap(materials => console.log('Retrieved saved materials:', materials)),
      catchError(this.handleError<any[]>('getSavedMaterials', []))
    );
  }
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
  
  
  


  
  // --- File Management --- 
  uploadFiles(formData: FormData): Observable<UploadResponse> {
    const headers = this.userService.setAuthHeader();
    const files = formData.getAll('files') as File[];
    files.forEach((file, index) => {
      formData.append(`originalNames[${index}]`, file.name);
    });
  
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, { headers })
      .pipe(
        tap(() => {
          this.uploadCompletedSubject.next();
          // Refresh chapters data
          const classListId = formData.get('classListId') as string;
          if (classListId) {
            this.getChapters(classListId).subscribe();
          }
        }),
        catchError(this.handleError<UploadResponse>('uploadFiles', { message: 'Upload failed', uploadedFiles: [] }))
      );
  }
  
  

  getFileDetails(fileId: string): Observable<File | null> {
    const headers = this.userService.setAuthHeader();
    return this.http.get<File>(`${this.apiUrl}/files/${fileId}`, { headers })
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of(null); 
          }
          return throwError(() => error);
        })
      );
  }

  deleteSelectedMaterials(fileIds: string[]): Observable<DeleteMaterialsResponse> {
    const headers = this.userService.setAuthHeader();
    return this.http.post<DeleteMaterialsResponse>(`${this.apiUrl}/delete-materials`, { materialIds: fileIds }, { headers })
      .pipe(
        catchError(this.handleError<DeleteMaterialsResponse>('deleteSelectedMaterials', {
          message: 'Deletion failed',
          deletedPaths: [],
          remainingUploadCount: 0,
          remainingUploads: []
        }))
      );
  }

  requestMaterial(materialIds: string[], materialType: string): Observable<StudyMaterialResponse> {
    const headers = this.userService.setAuthHeader();
    return this.http.post<StudyMaterialResponse>(`${this.apiUrl}/request-materials`, { materialIDs: materialIds, materialType }, { headers })
      .pipe(
        catchError(this.handleError<StudyMaterialResponse>('requestMaterial', {
          message: 'Failed to generate study materials',
          studyMaterials: ''
        }))
      );
  }

 

  // --- Observables for Component Consumption ---
  get semesters$(): Observable<Semester[]> {
    return this.semestersSubject.asObservable();
  }

  get classLists$(): Observable<ClassList[]> {
    return this.classListsSubject.asObservable();
  }

  get chapters$(): Observable<Chapter[]> {
    return this.chaptersSubject.asObservable();
  }
}