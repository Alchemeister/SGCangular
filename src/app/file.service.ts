import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Semester } from './models/semester.model';
import { ClassList } from './models/class-list.model';
import { Chapter } from './models/chapter.model';


@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000/api';

  private semestersSubject = new BehaviorSubject<Semester[]>([]);
  private classListsSubject = new BehaviorSubject<ClassList[]>([]);
  private chaptersSubject = new BehaviorSubject<Chapter[]>([]);

  constructor(private http: HttpClient) {}

  

  


  // Semesters
  getSemesters(userId: string): Observable<Semester[]> {
    return this.http.get<Semester[]>(`${this.apiUrl}/files/semesters?userId=${userId}`).pipe(
      tap(semesters => this.semestersSubject.next(semesters)),
      catchError(this.handleError)
    );
  }

  createSemester(name: string, userId: string): Observable<Semester> {
    return this.http.post<Semester>(`${this.apiUrl}/files/semesters`, { name, userId }).pipe(
      tap(newSemester => {
        const currentSemesters = this.semestersSubject.value;
        this.semestersSubject.next([...currentSemesters, newSemester]);
      }),
      catchError(this.handleError)
    );
  }

  deleteSemester(semesterId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/semesters/${semesterId}`).pipe(
      tap(() => {
        const currentSemesters = this.semestersSubject.value;
        this.semestersSubject.next(currentSemesters.filter(s => s._id !== semesterId));
      }),
      catchError(this.handleError)
    );
  }

  // Class Lists
  getClassLists(semesterId: string): Observable<ClassList[]> {
    return this.http.get<ClassList[]>(`${this.apiUrl}/files/semesters/${semesterId}/class-lists`).pipe(
      tap(classLists => this.classListsSubject.next(classLists)),
      catchError(this.handleError)
    );
  }

  createClassList(semesterId: string, name: string): Observable<ClassList> {
    return this.http.post<ClassList>(`${this.apiUrl}/files/class-lists`, { name, semesterId }).pipe(
      tap(newClassList => {
        console.log('Created new class list:', newClassList);
        // Update the class lists for the current semester
        this.getClassLists(semesterId).subscribe();
      }),
      catchError(this.handleError)
    );
  }
  

  deleteClassList(classListId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/class-lists/${classListId}`).pipe(
      tap(() => {
        const currentClassLists = this.classListsSubject.value;
        this.classListsSubject.next(currentClassLists.filter(cl => cl._id !== classListId));
      }),
      catchError(this.handleError)
    );
  }

  // Chapters
  get chapters$(): Observable<Chapter[]> {
    return this.chaptersSubject.asObservable();
  }

  getChapters(classListId: string): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.apiUrl}/files/class-lists/${classListId}/chapters`).pipe(
      tap(chapters => {
        console.log('Fetched chapters:', chapters);
        this.chaptersSubject.next(chapters);
      }),
      catchError(this.handleError)
    );
  }
  
  

  createChapter(classListId: string, chapterName: string): Observable<Chapter[]> {
    return this.http.post<Chapter>(`${this.apiUrl}/files/class-lists/${classListId}/chapters`, { name: chapterName }).pipe(
      switchMap(newChapter => {
        console.log('Created new chapter:', newChapter);
        return this.getChapters(classListId);
      }),
      catchError(this.handleError)
    );
  }
  
  


  deleteChapter(chapterId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/files/chapters/${chapterId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Files
  uploadFiles(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/upload`, formData).pipe(
      catchError(this.handleError)
    );
  }

  getFileDetails(fileId: string): Observable<File | null> {
    return this.http.get<File>(`${this.apiUrl}/files/${fileId}`).pipe(
      catchError(error => {
        if (error.status === 404) {
          console.warn(`File with ID ${fileId} not found`);
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  deleteSelectedMaterials(fileIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/delete-materials`, { materialIds: fileIds }).pipe(
      catchError(this.handleError)
    );
  }

  requestMaterial(materialIds: string[], materialType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/request-materials`, { materialIDs: materialIds, materialType }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Backend returned code ${error.status}, body was: ${JSON.stringify(error.error)}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Getters for the BehaviorSubjects
  get semesters$(): Observable<Semester[]> {
    return this.semestersSubject.asObservable();
  }

  get classLists$(): Observable<ClassList[]> {
    return this.classListsSubject.asObservable();
  }
}