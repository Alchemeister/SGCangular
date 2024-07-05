// src/app/models/chapter.model.ts

import { File } from './file.model';

export interface Chapter {
  _id: string;
  name: string;
  classListId: string;
  fileUploadIds: string[];
}
