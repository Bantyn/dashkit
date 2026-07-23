import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface TrustedBranch {
  branchId: string;
  trustedUntil: number;
}

export interface ActiveBranchInfo {
  id: string | null;
  name: string;
  type: 'parent' | 'child';
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BranchContextService {
  private http = inject(HttpClient);
  
  private activeBranchSubject = new BehaviorSubject<string | null>(this.getStoredActiveBranch());
  activeBranch$ = this.activeBranchSubject.asObservable();

  private activeBranchInfoSubject = new BehaviorSubject<ActiveBranchInfo>(this.getStoredActiveBranchInfo());
  activeBranchInfo$ = this.activeBranchInfoSubject.asObservable();

  constructor() {}

  getActiveBranch(): string | null {
    return this.activeBranchSubject.value;
  }

  getActiveBranchInfo(): ActiveBranchInfo {
    return this.activeBranchInfoSubject.value;
  }

  setActiveBranch(branchId: string | null) {
    this.setActiveBranchWithInfo(
      branchId,
      branchId ? 'Child Branch' : 'Parent Branch',
      branchId ? 'child' : 'parent'
    );
  }

  setActiveBranchWithInfo(branchId: string | null, name: string, type: 'parent' | 'child') {
    if (branchId) {
      localStorage.setItem('active_branch_id', branchId);
      localStorage.setItem('active_branch_name', name);
      localStorage.setItem('active_branch_type', type);
    } else {
      localStorage.removeItem('active_branch_id');
      localStorage.removeItem('active_branch_name');
      localStorage.removeItem('active_branch_type');
    }
    this.activeBranchSubject.next(branchId);
    this.activeBranchInfoSubject.next({ id: branchId, name, type });
  }

  private getStoredActiveBranch(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('active_branch_id');
  }

  private getStoredActiveBranchInfo(): ActiveBranchInfo {
    if (typeof window === 'undefined') return { id: null, name: 'Parent Branch', type: 'parent' };
    const id = localStorage.getItem('active_branch_id');
    const name = localStorage.getItem('active_branch_name') || 'Parent Branch';
    const type = (localStorage.getItem('active_branch_type') as 'parent' | 'child') || 'parent';
    return { id, name, type };
  }

  isBranchTrusted(branchId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const trusted = JSON.parse(localStorage.getItem('trusted_branches') || '[]');
      const branch = trusted.find((t: TrustedBranch) => t.branchId === branchId);
      if (branch && branch.trustedUntil > Date.now()) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  markBranchAsTrusted(branchId: string) {
    if (typeof window === 'undefined') return;
    try {
      let trusted = JSON.parse(localStorage.getItem('trusted_branches') || '[]');
      trusted = trusted.filter((t: TrustedBranch) => t.branchId !== branchId);
      trusted.push({
        branchId,
        trustedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      localStorage.setItem('trusted_branches', JSON.stringify(trusted));
    } catch (e) {
      console.error('Failed to save trusted branch', e);
    }
  }

  sendSwitchOtp(shopId: string, branchId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/branches/shop/${shopId}/branches/${branchId}/switch-otp/send`, {});
  }

  verifySwitchOtp(shopId: string, branchId: string, otp: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/branches/shop/${shopId}/branches/${branchId}/switch-otp/verify`, { otp }).pipe(
      tap(() => {
        this.markBranchAsTrusted(branchId);
        this.setActiveBranch(branchId);
      })
    );
  }
}
