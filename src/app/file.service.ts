import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FileNode } from './file-node.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = 'http://localhost:3000/api'; // Adjust this to your API URL

  constructor(private http: HttpClient) {}

  getTreeData(): Observable<FileNode[]> {
    return this.http.get<FileNode[]>(`${this.apiUrl}/files/tree`);
  }

  uploadFile(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/upload`, formData);
  }

  createFolder(name: string, parentFolder?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/folders`, { name, parentFolder });
  }

  deleteSelectedMaterials(materialIds: string[]): Observable<any> {
    console.log('Sending delete request with materialIds:', materialIds);
    return this.http.post('/api/files/delete-materials', { materialIds });
  }
  

  requestMaterial(materialIds: string[], materialType: string): Observable<any> {
    const body = { materialIDs: materialIds, materialType };
    return this.http.post(`${this.apiUrl}/request-material`, body).pipe(
      map((response: any) => {
        // Assuming your backend sends a response like { message: ..., studyMaterials: ... }
        return response.studyMaterials; // Extract the studyMaterials property
      })
    );
  }
}  