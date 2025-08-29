import { Routes } from '@angular/router';

export const routes: Routes = [
  // Route mặc định chuyển hướng đến home
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Route cho home component
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },

  // Route cho guide component
  {
    path: 'guide',
    loadComponent: () => import('./features/guide/guide.component').then(m => m.GuideComponent)
  },

  // Route cho course list component
  {
    path: 'courses',
    loadComponent: () => import('./features/courses/course-list/course-list.component').then(m => m.CourseListComponent)
  },

  // Route cho course detail component
  {
    path: 'courses/:id',
    loadComponent: () => import('./features/courses/course-detail/course-detail.component').then(m => m.CourseDetailComponent)
  },

  // Route cho introduction component
  {
    path: 'introduction',
    loadComponent: () => import('./features/introduction/introduction.component').then(m => m.IntroductionComponent)
  },


  // Route cho các trang khác có thể thêm sau
  // { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },

  // Route wildcard cho 404
  { path: '**', redirectTo: '/home' }
];
