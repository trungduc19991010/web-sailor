import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { HomeComponent } from './home.component';

// Services
import { HomeService } from './services/home.service';

// Routes
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { 
      title: 'Trang chủ - Hệ thống học trực tuyến',
      description: 'Nền tảng giáo dục đào tạo số với các khóa học đa dạng và chất lượng cao'
    }
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    
    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    
    // Components (standalone)
    HomeComponent
  ],
  providers: [
    HomeService
  ],
  exports: [
    RouterModule,
    HomeComponent
  ]
})
export class HomeModule { 
  constructor() {
    console.log('HomeModule đã được khởi tạo');
  }
}
