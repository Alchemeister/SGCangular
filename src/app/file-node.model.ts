export interface FileNode {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentFolder?: string | null;
  children?: FileNode[];
  subjectTag?: string;
  isSelected?: boolean;
}
export interface IFlatNode {
  expandable: boolean;
  name: string;
  type: 'folder' | 'file';
  level: number;
  isSelected: boolean;
  _id: string;
  path?: string;
  subjectTag?: string;
  parentFolder?: string | null;
}