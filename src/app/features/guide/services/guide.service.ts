import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { HdsdResponse, HdsdItem } from '../../../core/models/hdsd.model';

// Interfaces cho dữ liệu guide
export interface GuideDocument {
  id: number;
  title: string;
  description?: string;
  category: string;
  categoryName: string;
  url: string; // URL đã được xử lý cho embed
  originalUrl?: string; // URL gốc từ API
  fileType: 'pdf' | 'video' | 'slide'; // Phân loại tệp
  fileName?: string;
  fileSize?: number; // in bytes
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  author?: string;
  tags?: string[];
}

export interface GuideCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class GuideService {
  // BehaviorSubject để quản lý state
  private guidesSubject = new BehaviorSubject<GuideDocument[]>([]);
  public guides$ = this.guidesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private apiUrl = `${environment.services_domain}/HDSDTrainee`;

  constructor(private http: HttpClient) {
    // Tự động load dữ liệu khi service được khởi tạo
    this.loadGuides();
  }

  /**
   * Lấy danh sách tất cả tài liệu hướng dẫn từ API
   */
  getGuides(): Observable<GuideDocument[]> {
    return this.http.get<HdsdResponse>(`${this.apiUrl}/get-all`).pipe(
      map(response => {
        if (response.result === 1 && response.data) {
          return this.mapHdsdToGuideDocuments(response.data);
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching guides from API:', error);
        // Fallback to mock data if API fails
        return this.getMockGuides();
      })
    );
  }

  private mapHdsdToGuideDocuments(hdsdItems: HdsdItem[]): GuideDocument[] {
    return hdsdItems.map((item, index) => ({
      id: index + 1, // Sử dụng index vì API trả về string id
      title: item.title,
      description: item.descriptTion || item.subTitle,
      category: this.getCategoryFromCode(item.code),
      categoryName: item.subTitle || 'Hướng dẫn',
      url: this.convertToEmbeddableUrl(item.url), // URL đã xử lý cho embed
      originalUrl: item.url, // Lưu URL gốc từ API
      fileType: this.detectFileType(item.url),
      fileName: `${item.code}.pdf`,
      fileSize: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      author: 'VOSCO EDU',
      tags: [item.code, item.subTitle]
    }));
  }

  /**
   * Determine category from code
   */
  private getCategoryFromCode(code: string): string {
    const codeUpper = code.toUpperCase();
    if (codeUpper.includes('HDSD')) return 'user-manual';
    if (codeUpper.includes('FAQ')) return 'faq';
    if (codeUpper.includes('STCW')) return 'stcw-guide';
    if (codeUpper.includes('POLICY')) return 'policy';
    return 'user-manual';
  }

  /**
   * Detect file type from URL
   */
  private detectFileType(url: string): 'pdf' | 'video' | 'slide' {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('drive.google.com/file')) return 'video';
    if (urlLower.includes('presentation') || urlLower.includes('slides')) return 'slide';
    return 'pdf';
  }

  /**
   * Convert Google Drive URL to embeddable format
   * Theo course-detail: Sử dụng trực tiếp /preview thay vì wrap trong Google Docs Viewer
   */
  private convertToEmbeddableUrl(url: string): string {
    // Google Drive file pattern - Extract file ID
    const driveFileRegex = /drive\.google\.com.*\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(driveFileRegex);
    
    if (match && match[1]) {
      const fileId = match[1];
      // Sử dụng trực tiếp /preview như course-detail
      // Google Drive /preview có thể embed được nếu file đã public
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Google Slides pattern
    const slidesRegex = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
    const slidesMatch = url.match(slidesRegex);
    
    if (slidesMatch && slidesMatch[1]) {
      const fileId = slidesMatch[1];
      return `https://docs.google.com/presentation/d/${fileId}/embed?start=false&loop=false&delayms=3000`;
    }

    // Nếu là URL Google Drive khác - sử dụng Google Docs Viewer
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }

    // Fallback: Sử dụng Google Docs Viewer cho file document không phải Google
    if (url.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return url;
  }

  /**
   * Fallback mock data nếu API fail
   */
  private getMockGuides(): Observable<GuideDocument[]> {
    const guides: GuideDocument[] = [
      {
        id: 1,
        title: 'Hướng dẫn sử dụng hệ thống đào tạo thuyền viên',
        description: 'Tài liệu hướng dẫn chi tiết cách sử dụng các tính năng của hệ thống đào tạo thuyền viên VOSCO, từ đăng ký tài khoản đến hoàn thành chứng chỉ.',
        category: 'user-manual',
        categoryName: 'Hướng dẫn sử dụng',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        fileType: 'pdf',
        fileName: 'huong-dan-su-dung-he-thong-vosco.pdf',
        fileSize: 2048576, // 2MB
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-08-15'),
        version: '2.1',
        author: 'Đội ngũ phát triển VOSCO',
        tags: ['hướng dẫn', 'sử dụng', 'hệ thống', 'thuyền viên']
      },
      {
        id: 2,
        title: 'Quy trình đào tạo và cấp chứng chỉ STCW',
        description: 'Hướng dẫn chi tiết về quy trình đào tạo, thi cử và cấp chứng chỉ STCW theo tiêu chuẩn quốc tế cho thuyền viên.',
        category: 'stcw-guide',
        categoryName: 'Hướng dẫn STCW',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        fileType: 'pdf',
        fileName: 'quy-trinh-dao-tao-stcw.pdf',
        fileSize: 1536000, // 1.5MB
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-07-20'),
        version: '1.3',
        author: 'Thuyền trưởng Nguyễn Văn Hải',
        tags: ['STCW', 'chứng chỉ', 'quy trình', 'đào tạo']
      },
      {
        id: 3,
        title: 'Câu hỏi thường gặp (FAQ)',
        description: 'Tổng hợp các câu hỏi thường gặp và câu trả lời chi tiết về việc sử dụng hệ thống, đăng ký khóa học và các vấn đề kỹ thuật.',
        category: 'faq',
        categoryName: 'Câu hỏi thường gặp',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        fileType: 'pdf',
        fileName: 'cau-hoi-thuong-gap.pdf',
        fileSize: 1024000, // 1MB
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-08-10'),
        version: '3.0',
        author: 'Đội hỗ trợ khách hàng',
        tags: ['FAQ', 'hỗ trợ', 'câu hỏi']
      },
      {
        id: 4,
        title: 'Quy định và chính sách học tập',
        description: 'Các quy định, chính sách về việc tham gia khóa học, quyền và nghĩa vụ của học viên, quy trình cấp chứng chỉ.',
        category: 'policy',
        categoryName: 'Quy định & Chính sách',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        fileType: 'pdf',
        fileName: 'quy-dinh-chinh-sach.pdf',
        fileSize: 2560000, // 2.5MB
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
        version: '1.0',
        author: 'Phòng Đào tạo',
        tags: ['quy định', 'chính sách', 'học tập']
      },
      {
        id: 5,
        title: 'Hướng dẫn kỹ thuật cho giảng viên',
        description: 'Tài liệu hướng dẫn kỹ thuật dành cho giảng viên về cách tạo khóa học, quản lý học viên và sử dụng các công cụ giảng dạy.',
        category: 'technical',
        categoryName: 'Hướng dẫn kỹ thuật',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        fileType: 'pdf',
        fileName: 'huong-dan-ky-thuat-giang-vien.pdf',
        fileSize: 3072000, // 3MB
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-08-01'),
        version: '1.2',
        author: 'Đội kỹ thuật',
        tags: ['kỹ thuật', 'giảng viên', 'hướng dẫn']
      },
      {
        id: 6,
        title: 'Hướng dẫn sử dụng ứng dụng di động',
        description: 'Cách tải và sử dụng ứng dụng di động để học tập mọi lúc mọi nơi, đồng bộ dữ liệu và sử dụng các tính năng offline.',
        category: 'user-manual',
        categoryName: 'Hướng dẫn sử dụng',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
        fileType: 'pdf',
        fileName: 'huong-dan-ung-dung-mobile.pdf',
        fileSize: 1792000, // 1.75MB
        createdAt: new Date('2024-04-15'),
        updatedAt: new Date('2024-08-05'),
        version: '1.1',
        author: 'Đội phát triển Mobile',
        tags: ['mobile', 'ứng dụng', 'di động']
      },
      {
        id: 7,
        title: 'Video hướng dẫn an toàn',
        description: 'Video hướng dẫn các quy trình an toàn trên tàu.',
        category: 'reference',
        categoryName: 'Tham khảo',
        url: 'https://drive.google.com/file/d/1MnqiAwUSiYyEUvoMnKgU_l4-M3TuVviz/view?usp=sharing',
        fileType: 'video',
        fileName: 'video-huong-dan-an-toan.mp4',
        fileSize: 25000000, // Cần cập nhật kích thước thực tế nếu có
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'Vosco',
        tags: ['tham khảo', 'google drive', 'bổ sung']
      },
      {
        id: 8,
        title: 'Bài giảng về An toàn Hàng hải',
        description: 'Slide bài giảng chi tiết về các quy tắc an toàn hàng hải quốc tế.',
        category: 'lecture',
        categoryName: 'Bài giảng',
        url: 'https://docs.google.com/presentation/d/1_6_7idZrZXlR2gqWkr_nYe10kLmEHYWX/edit?usp=sharing&ouid=103189668869674003612&rtpof=true&sd=true',
        fileType: 'slide',
        fileName: 'bai-giang-an-toan-hang-hai.pptx',
        fileSize: 5000000, // Placeholder size
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        author: 'Thuyền trưởng Trần Văn An',
        tags: ['bài giảng', 'slide', 'an toàn', 'hàng hải']
      },
    ];

    return of(guides).pipe(delay(800));
  }

  /**
   * Lấy danh sách categories
   */
  getCategories(): Observable<GuideCategory[]> {
    const categories: GuideCategory[] = [
      {
        id: 'user-manual',
        name: 'Hướng dẫn sử dụng',
        description: 'Tài liệu hướng dẫn sử dụng hệ thống',
        icon: 'book',
        order: 1
      },
      {
        id: 'tutorial',
        name: 'Hướng dẫn học tập',
        description: 'Phương pháp và kỹ thuật học tập',
        icon: 'school',
        order: 2
      },
      {
        id: 'faq',
        name: 'Câu hỏi thường gặp',
        description: 'Các câu hỏi và trả lời thường gặp',
        icon: 'help',
        order: 3
      },
      {
        id: 'policy',
        name: 'Quy định & Chính sách',
        description: 'Các quy định và chính sách của hệ thống',
        icon: 'policy',
        order: 4
      },
      {
        id: 'technical',
        name: 'Hướng dẫn kỹ thuật',
        description: 'Tài liệu kỹ thuật cho người dùng nâng cao',
        icon: 'build',
        order: 5
      }
    ];

    return of(categories).pipe(delay(300));
  }

  /**
   * Lấy tài liệu theo ID
   */
  getGuideById(id: number): Observable<GuideDocument | undefined> {
    return new Observable(observer => {
      this.getGuides().subscribe(guides => {
        const guide = guides.find(g => g.id === id);
        observer.next(guide);
        observer.complete();
      });
    });
  }

  /**
   * Lấy tài liệu theo category
   */
  getGuidesByCategory(category: string): Observable<GuideDocument[]> {
    return new Observable(observer => {
      this.getGuides().subscribe(guides => {
        const filteredGuides = guides.filter(g => g.category === category);
        observer.next(filteredGuides);
        observer.complete();
      });
    });
  }

  /**
   * Tìm kiếm tài liệu
   */
  searchGuides(query: string): Observable<GuideDocument[]> {
    return new Observable(observer => {
      this.getGuides().subscribe(guides => {
        const searchResults = guides.filter(guide =>
          guide.title.toLowerCase().includes(query.toLowerCase()) ||
          guide.description?.toLowerCase().includes(query.toLowerCase()) ||
          guide.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        observer.next(searchResults);
        observer.complete();
      });
    });
  }

  /**
   * Load dữ liệu guides
   */
  private loadGuides(): void {
    this.loadingSubject.next(true);

    this.getGuides().subscribe({
      next: (guides) => {
        this.guidesSubject.next(guides);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách guides:', error);
        this.loadingSubject.next(false);
      }
    });
  }

  /**
   * Refresh dữ liệu guides
   */
  refreshGuides(): void {
    this.loadGuides();
  }

  /**
   * Download guide file
   */
  downloadGuide(guide: GuideDocument): Observable<Blob> {
    // Simulate file download
    return new Observable(observer => {
      // In real implementation, this would fetch the actual file
      fetch(guide.url)
        .then(response => response.blob())
        .then(blob => {
          observer.next(blob);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}
