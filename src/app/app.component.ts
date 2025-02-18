import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from './providers';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent {
  showSplash = true;
  isInactive = false;
  env = environment;

  constructor(
    private platform: Platform,
    private router: Router,
    private translate: TranslateService,
    public settings: Settings
  ) {
    this.initializeApp();
  }

  initTranslate() {
    // Set the default language for translation strings, and the current language.
    this.translate.addLangs(["en", "de", "fr", "es", "it", "pos"]);
    
    // Get stored language from settings
    const storedLang = this.settings.getCurrentLanguage();
    if (storedLang) {
      this.translate.setDefaultLang(storedLang);
      this.translate.use(storedLang);
    } else {
      // If no stored language, use browser language or fallback to 'en'
      const browserLang = this.translate.getBrowserLang();
      const defaultLang = browserLang && this.translate.getLangs().includes(browserLang) ? browserLang : 'en';
      this.translate.setDefaultLang(defaultLang);
      this.translate.use(defaultLang);
      this.settings.updateCurrentLanguage(defaultLang);
    }

    // Subscribe to language changes
    this.settings.currentLang().subscribe(lang => {
      if (lang) {
        this.translate.use(lang);
      }
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Add theme class based on environment
      document.body.classList.add(environment.css === 'default.css' ? 'gZHomeControl' : 'emiZmart');
      this.initTranslate();
      // Check for token and navigate accordingly
      setTimeout(() => {
        this.showSplash = false;
        const token = localStorage.getItem('com.gozmartch.gzre:token');
        if (!token) {
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      }, 3000);
    });
  }

  
}
