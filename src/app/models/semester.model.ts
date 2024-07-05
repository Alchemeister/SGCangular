// src/app/models/semester.model.ts

import { ClassList } from './class-list.model';

export interface Semester {
  _id: string;
  name: string;
  userId: string;
  classLists: ClassList[];
}
