import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideClientHydration(), provideAnimations(), provideFirebaseApp(() => initializeApp({"projectId":"miscellaneous-fts","appId":"1:852596679231:web:5cf84b30ac93e82cde4e8a","storageBucket":"miscellaneous-fts.firebasestorage.app","apiKey":"AIzaSyAAUld5xRhWEU4rt-kw1HPEwJfDFm_-_J8","authDomain":"miscellaneous-fts.firebaseapp.com","messagingSenderId":"852596679231","measurementId":"G-L0SHQ3EC3X"})), provideAuth(() => getAuth()), provideAnalytics(() => getAnalytics()), ScreenTrackingService, UserTrackingService, provideFirestore(() => getFirestore()), provideStorage(() => getStorage())]
};
