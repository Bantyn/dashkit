import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BranchFormComponent } from './branch-form.component';

@Component({
  selector: 'app-branch-add',
  standalone: true,
  imports: [CommonModule, BranchFormComponent],
  template: `
    <div class="p-8 bg-[#f5f7fa] min-h-full">
       <div class="max-w-4xl mx-auto">
          <app-branch-form 
             (close)="navigateBack()" 
             (onSaved)="onSaved()"
          ></app-branch-form>
       </div>
    </div>
  `
})
export class BranchAdd {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  navigateBack() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onSaved() {
    this.navigateBack();
  }
}
