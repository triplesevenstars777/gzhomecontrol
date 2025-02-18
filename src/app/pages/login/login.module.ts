import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { LoginPage } from './login';
import { RouterModule } from '@angular/router';
// import { TranslateModule } from '@ngx-translate/core';
// import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    LoginPage,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: LoginPage
      }
    ]),
    // TranslateModule
  ]
})
export class LoginPageModule { }
