import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ToastService } from '../../core/services/toast.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

// Import service
import { GuideService, GuideDocument } from './services/guide.service';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.scss'
})
export class GuideComponent implements OnInit, OnDestroy {
  // Dữ liệu từ service
  guides: GuideDocument[] = [];
  selectedGuide: GuideDocument | null = null;
  
  // Loading states
  loading = false;
  contentLoading = false;

  // Content display
  safeContentUrl: SafeResourceUrl | null = null;
  showContentViewer = false;
  
  // Subject để unsubscribe
  private destroy$ = new Subject<void>();

  constructor(
    private guideService: GuideService,
    private sanitizer: DomSanitizer,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadGuides();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load danh sách tài liệu hướng dẫn
   */
  private loadGuides(): void {
    this.loading = true;
    
    this.guideService.getGuides()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (guides) => {
          this.guides = guides;
          this.loading = false;
          
          // Tự động chọn guide đầu tiên nếu có
          if (guides.length > 0) {
            this.selectGuide(guides[0]);
          }
        },
        error: (error) => {
          console.error('Lỗi khi tải danh sách hướng dẫn:', error);
          this.loading = false;
          this.showErrorMessage('Không thể tải danh sách hướng dẫn');
        }
      });
  }

  /**
   * Chọn và hiển thị tài liệu hướng dẫn
   */
  selectGuide(guide: GuideDocument): void {
    if (this.selectedGuide?.id === guide.id) {
      return; // Đã chọn rồi
    }

    this.selectedGuide = guide;
    this.showContentViewer = false;
    this.safeContentUrl = null;

    if (guide.url) {
      this.loadContent(guide);
    }
  }

  /**
   * Load content (PDF or Video)
   * URL đã được xử lý sẵn bởi service, không cần convert lại
   */
  private loadContent(guide: GuideDocument): void {
    this.contentLoading = true;

    // Sử dụng trực tiếp URL từ guide (service đã convert sẵn)
    const contentUrl = guide.url;
    
    console.log('Loading content from URL:', contentUrl);

    // Sanitize URL to make it safe
    this.safeContentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(contentUrl);

    // Simulate loading time
    setTimeout(() => {
      this.contentLoading = false;
      this.showContentViewer = true;
    }, 500);
  }


  /**
   * Download PDF file
   */
  downloadFile(guide: GuideDocument): void {
    const urlToDownload = guide.originalUrl || guide.url;
    
    if (!urlToDownload) {
      this.showErrorMessage('Không có file để tải xuống');
      return;
    }

    try {
      // Tạo link download
      const link = document.createElement('a');
      link.href = urlToDownload;
      link.download = guide.fileName || `${guide.title}.pdf`;
      link.target = '_blank';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showSuccessMessage('Đang tải xuống file...');
    } catch (error) {
      console.error('Lỗi khi tải file:', error);
      this.showErrorMessage('Không thể tải xuống file');
    }
  }

  /**
   * Open PDF in new tab
   * Sử dụng originalUrl để mở URL gốc từ API
   */
  openInNewTab(guide: GuideDocument): void {
    // Ưu tiên sử dụng originalUrl, fallback sang url
    const urlToOpen = guide.originalUrl || guide.url;
    
    if (!urlToOpen) {
      this.showErrorMessage('Không có file để mở');
      return;
    }
    
    console.log('Opening URL in new tab:', urlToOpen);
    window.open(urlToOpen, '_blank');
  }

  /**
   * Refresh danh sách guides
   */
  refreshGuides(): void {
    this.selectedGuide = null;
    this.showContentViewer = false;
    this.safeContentUrl = null;
    this.loadGuides();
  }

  /**
   * TrackBy function cho guides list
   */
  trackByGuideId(_index: number, guide: GuideDocument): number {
    return guide.id;
  }

  /**
   * Hiển thị thông báo lỗi
   */
  private showErrorMessage(message: string): void {
    this.toast.error(message, 5000);
  }

  /**
   * Hiển thị thông báo thành công
   */
  private showSuccessMessage(message: string): void {
    this.toast.success(message);
  }

  /**
   * Handle PDF iframe load error
   */
  onContentLoadError(): void {
    this.contentLoading = false;
    this.showContentViewer = false;
    this.showErrorMessage('Không thể tải nội dung. Vui lòng thử lại sau.');
  }

  /**
   * Handle PDF iframe load success
   */
  onContentLoadSuccess(): void {
    this.contentLoading = false;
  }

  /**
   * Check if guide is selected
   */
  isGuideSelected(guide: GuideDocument): boolean {
    return this.selectedGuide?.id === guide.id;
  }

  /**
   * Get file size display
   */
  getFileSizeDisplay(sizeInBytes?: number): string {
    if (!sizeInBytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'user-manual': 'book',
      'tutorial': 'school',
      'faq': 'help',
      'policy': 'policy',
      'technical': 'build',
      'default': 'description'
    };
    
    return iconMap[category] || iconMap['default'];
  }
}
