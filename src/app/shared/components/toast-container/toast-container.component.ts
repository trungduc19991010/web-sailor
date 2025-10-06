import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  /**
   * Lấy icon cho từng loại toast
   */
  getIcon(type: Toast['type']): string {
    const icons = {
      success: 'check_circle',
      error: 'error',
      info: 'info',
      warning: 'warning'
    };
    return icons[type];
  }

  /**
   * Lấy CSS classes cho từng loại toast
   */
  getToastClasses(type: Toast['type']): string {
    const baseClasses = 'flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border';
    const typeClasses = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return `${baseClasses} ${typeClasses[type]}`;
  }

  /**
   * Lấy CSS classes cho icon
   */
  getIconClasses(type: Toast['type']): string {
    const typeClasses = {
      success: 'text-green-600',
      error: 'text-red-600',
      info: 'text-blue-600',
      warning: 'text-orange-600'
    };
    return typeClasses[type];
  }

  /**
   * Đóng toast
   */
  close(id: string): void {
    this.toastService.remove(id);
  }
}
