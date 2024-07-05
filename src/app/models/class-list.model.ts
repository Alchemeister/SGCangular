// src/app/models/class-list.model.ts

import { Chapter } from './chapter.model';

export interface ClassList {
  _id: string;
  name: string;
  semesterId: string;
  chapters: Chapter[];
}
