import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// Make sure this interface matches your backend's data structure
interface FileNode {
  _id?: string;
  name: string;
  type: 'folder' | 'file';
  path?: string;
  subjectTag?: string;
  parentFolder?: string;
  children?: FileNode[];
}

@Injectable({ providedIn: 'root' })
export class FileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTreeData(): Observable<FileNode[]> {
    return this.http.get<FileNode[]>(`${this.apiUrl}/tree`);
  }

  // We'll add more methods here later for other API calls
}
