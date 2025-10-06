import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { GuideComponent } from './guide.component';

// Services
import { GuideService } from './services/guide.service';

// Routes
const routes: Routes = [
  {
    path: '',
    component: GuideComponent,
    data: { 
      title: 'Hướng dẫn học tập - Hệ thống học trực tuyến',
      description: 'Tài liệu hướng dẫn sử dụng hệ thống và phương pháp học tập hiệu quả'
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
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
    
    // Components (standalone)
    GuideComponent
  ],
  providers: [
    GuideService
  ],
  exports: [
    RouterModule,
    GuideComponent
  ]
})
export class GuideModule { 
  constructor() {
    console.log('GuideModule đã được khởi tạo');
  }
}
