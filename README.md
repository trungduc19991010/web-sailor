# Sailor Web App

Ứng dụng Angular được thiết kế theo mô hình MVC với Angular 19 và Angular Material.

## Tổng quan

Project này được tạo với Angular CLI version 19.2.10 và sử dụng:
- **Angular 19**: Framework chính
- **Angular Material**: UI Components
- **SCSS**: Styling
- **TypeScript**: Ngôn ngữ lập trình
- **Server-Side Rendering (SSR)**: Được kích hoạt

## Cấu trúc MVC

### Model (Dữ liệu)
- **Location**: `src/app/core/services/`
- **File**: `data.service.ts`
- **Chức năng**: Quản lý dữ liệu, API calls, business logic

### View (Giao diện)
- **Location**: `src/app/features/*/component.html`
- **File**: `home.component.html`
- **Chức năng**: Template HTML, hiển thị dữ liệu

### Controller (Điều khiển)
- **Location**: `src/app/features/*/component.ts`
- **File**: `home.component.ts`
- **Chức năng**: Xử lý logic, tương tác giữa Model và View

## Cấu trúc thư mục

```
src/app/
├── core/                 # Core module (singleton services)
│   └── services/         # Services (Model trong MVC)
│       └── data.service.ts
├── shared/               # Shared module (common components, pipes, directives)
│   └── shared.module.ts  # Export Angular Material modules
├── features/             # Feature modules
│   └── home/             # Home feature
│       ├── home.component.ts    # Controller
│       ├── home.component.html  # View
│       └── home.component.scss  # Styles
├── app.component.ts      # Root component
├── app.routes.ts         # Routing configuration
└── app.config.ts         # App configuration
```

## Tính năng chính

1. **Navigation**: Toolbar với Material Design
2. **Routing**: Lazy loading cho các components
3. **Data Management**: Service pattern cho quản lý dữ liệu
4. **Material Design**: UI components từ Angular Material
5. **Responsive**: Thiết kế responsive

## Development server

Chạy `ng serve` để khởi động dev server. Truy cập `http://localhost:4200/`.
Ứng dụng sẽ tự động reload khi bạn thay đổi source files.

## Build

Chạy `ng build` để build project. Build artifacts sẽ được lưu trong thư mục `dist/`.

## Testing

Chạy `ng test` để thực hiện unit tests via [Karma](https://karma-runner.github.io).

## Mở rộng

### Thêm feature mới:
```bash
ng generate module features/new-feature
ng generate component features/new-feature
```

### Thêm service mới:
```bash
ng generate service core/services/new-service
```

### Thêm routing:
Cập nhật `app.routes.ts` để thêm route mới.

## Angular Material Components được sử dụng

- MatToolbarModule
- MatButtonModule
- MatIconModule
- MatCardModule
- MatListModule

## Thông tin thêm

Để biết thêm về Angular CLI, sử dụng `ng help` hoặc xem [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli).
