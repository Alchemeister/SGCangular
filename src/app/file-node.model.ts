export interface FileNode {
  _id?: string;
  name: string;
  type: 'folder' | 'file';
  path?: string;
  subjectTag?: string;
  parentFolder?: string | undefined;  // Changed to string | undefined
  children?: FileNode[];
  isSelected: boolean;
}