import { NgModule } from '@angular/core';
import { TreeModule } from '@circlon/angular-tree-component';

@NgModule({
  imports: [TreeModule],
  exports: [TreeModule]
})
export class TreeWrapperModule {}
