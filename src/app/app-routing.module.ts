import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: 'device-detail',
    loadChildren: () => import('./pages/device-detail/device-detail.module').then(m => m.DeviceDetailPageModule)
  },
  {
    path: 'device-door-bell',
    loadChildren: () => import('./pages/device-door-bell/device-door-bell.module').then(m => m.DeviceDoorBellPageModule)
  },
  {
    path: 'news',
    loadChildren: () => import('./pages/news/news.module').then(m => m.NewsPageModule)
  },
  {
    path: 'transports',
    loadChildren: () => import('./pages/transports/transports.module').then(m => m.TransportsPageModule)
  },
  {
    path: 'devices-clima',
    loadChildren: () => import('./pages/devices-clima/devices-clima.module').then(m => m.DevicesClimaPageModule)
  },
  {
    path: 'devices-temp',
    loadChildren: () => import('./pages/devices-temp/devices-temp.module').then(m => m.DevicesTempPageModule)
  },  
  // {
  //   path: '/device-temp/device-temp-detail',
  //   loadChildren: () => import('./pages/devices-temp/devices-temp-detail/devices-temp-detail.module').then(m => m.DeviceTempDetailPageModule)
  // },
  {
    path: 'devices-blind',
    loadChildren: () => import('./pages/devices-blind/devices-blind.module').then(m => m.DevicesBlindPageModule)
  },
  {
    path: 'devices-light',
    loadChildren: () => import('./pages/devices-light/devices-light.module').then(m => m.DevicesLightPageModule)
  },
  {
    path: 'devices-sensor',
    loadChildren: () => import('./pages/devices-sensor/devices-sensor.module').then(m => m.DevicesSensorPageModule)
  },
  {
    path: 'meterkit',
    loadChildren: () => import('./pages/meterkit/meterkit.module').then(m => m.MeterkitPageModule)
  },
  {
    path: 'devices-heater',
    loadChildren: () => import('./pages/devices-heater/devices-heater.module').then(m => m.DevicesHeaterPageModule)
  },
  {
    path: 'devices-doorlock',
    loadChildren: () => import('./pages/devices-doorlock/devices-doorlock.module').then(m => m.DevicesDoorlockPageModule)
  },
  {
    path: 'devices-mailbox',
    loadChildren: () => import('./pages/devices-mailbox/devices-mailbox.module').then(m => m.DevicesMailboxPageModule)
  },
  {
    path: 'global-settings',
    loadChildren: () => import('./pages/global-settings/global-settings.module').then(m => m.GlobalSettingsPageModule)
  },
  {
    path: 'global-settings/scenes/edit',
    loadComponent: () => import('./pages/global-settings/scenes/scenes-edit/scenes-edit').then(m => m.ScenesEditPage)
  },
  {
    path: 'global-settings/in-toggles',
    loadChildren: () => import('./pages/global-settings/in-toggles/in-toggles-routing.module').then(m => m.InTogglesPageRoutingModule)
  },
  {
    path: 'xxxxxxxx',
    loadChildren: () => import('./xxxxxxxx/xxxxxxxx.module').then( m => m.XxxxxxxxPageModule)
  },
  // Catch all route - redirect to login
  {
    path: '**',
    redirectTo: localStorage.getItem('com.gozmartch.gzre:token') ? 'dashboard' : 'login'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { 
      preloadingStrategy: PreloadAllModules,
      onSameUrlNavigation: 'reload',
      paramsInheritanceStrategy: 'always'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
