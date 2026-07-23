import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TailoringService, TailoringJob, TailoringJobStatus } from '../../core/services/tailoring.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-tailoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tailoring-dashboard.component.html',
})
export class TailoringDashboardComponent implements OnInit {
  private tailoringService = inject(TailoringService);
  private authService = inject(AuthService);

  shopId = '';
  jobs: TailoringJob[] = [];
  isLoading = false;
  searchQuery = '';
  statusFilter = 'all';
  
  isModalOpen = false;
  editingJob: Partial<TailoringJob> | null = null;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.shopId) {
        this.shopId = user.shopId;
        this.loadJobs();
      }
    });
  }

  loadJobs() {
    this.isLoading = true;
    this.tailoringService.getJobs(this.shopId).subscribe({
      next: (res) => {
        this.jobs = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredJobs() {
    return this.jobs.filter(job => {
      const matchSearch = job.customerName.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          (job.phoneNumber || '').includes(this.searchQuery);
      const matchStatus = this.statusFilter === 'all' || job.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  openAddModal() {
    this.editingJob = {
      shopId: this.shopId,
      customerId: '', // In a real flow, this comes from selecting a customer
      customerName: '',
      phoneNumber: '',
      type: 'alteration',
      status: 'measurement_taken',
      amount: 0,
      paidAmount: 0,
      notes: ''
    };
    this.isModalOpen = true;
  }
  
  openEditModal(job: TailoringJob) {
    this.editingJob = { ...job };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingJob = null;
  }

  saveJob() {
    if (!this.editingJob) return;
    
    if (this.editingJob.id) {
      this.tailoringService.updateJob(this.editingJob.id, this.editingJob).subscribe({
        next: () => {
          this.loadJobs();
          this.closeModal();
        }
      });
    } else {
      this.tailoringService.createJob(this.editingJob).subscribe({
        next: () => {
          this.loadJobs();
          this.closeModal();
        }
      });
    }
  }
  
  updateStatus(jobId: string, status: TailoringJobStatus) {
    this.tailoringService.updateJob(jobId, { status }).subscribe({
      next: () => this.loadJobs()
    });
  }
}
