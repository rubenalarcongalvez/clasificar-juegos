import { ChangeDetectorRef, Component, computed, effect } from '@angular/core';
import { PrimeNgModule } from './shared/style/prime-ng/prime-ng.module';
import { Message, MessageService } from 'primeng/api';
import { AnadirJuego, ListaJuegosComponent } from './components/lista-juegos/lista-juegos.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FooterComponent } from './shared/footer/footer.component';
import { StorageService } from './shared/services/storage.service';
import { AuthService } from './shared/services/auth.service';
import { User } from '@angular/fire/auth';
import { LoginComponent } from './shared/components/login/login.component';
import { Timestamp } from '@angular/fire/firestore';

interface Proveedor {
  nombre: string,
  clase: string,
  activoEnClipboard: boolean,
  listadoJuegos: string | string[]
}

export interface Videojuego {
  nombre: string,
  urlYoutube: string,
  descartado?: boolean,
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PrimeNgModule, ListaJuegosComponent, ReactiveFormsModule, FormsModule, FooterComponent, LoginComponent],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  juegos: Set<string> = new Set();
  listaProveedores: Proveedor[] = [
    {nombre: 'Meristation', clase: 'ga__tl', activoEnClipboard: false, listadoJuegos: ''},
    {nombre: '3djuegos', clase: 's18 dib c0', activoEnClipboard: false, listadoJuegos: ''},

    //Grouvee siempre el ultimo, para anadirlo a revisados
    {nombre: 'Grouvee', clase: 'no-hover', activoEnClipboard: false, listadoJuegos: ''},
  ];

  fechasElegidas: Date = new Date();
  listaOpcionesMostradas: string = 'revisar';
  listaJuegosPorVer: Videojuego[] = [];
  listaJuegosRevisados: Videojuego[] = [];

  /* Auth */
  messages: Message[] = [];
  visibleDeleteUserPopup: boolean = false;
  visibleUpdateEmailPopup: boolean = false;
  visibleUpdatePasswordPopup: boolean = false;
  updateEmailForm: FormGroup = this.fb.group({
    previousEmail: ['', Validators.required],
    email: ['', Validators.required],
    emailConfirmation: ['', Validators.required],
  });
  updatePasswordForm: FormGroup = this.fb.group({
    password: ['', Validators.required],
    passwordConfirmation: ['', Validators.required],
  });

  constructor(private messageService: MessageService, private cdr: ChangeDetectorRef, private storageService: StorageService, private authService: AuthService, private fb: FormBuilder) {
    //3 meses antes
    this.fechasElegidas.setMonth(this.fechasElegidas.getMonth() - 3);
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.listaJuegosPorVer = JSON.parse(localStorage.getItem('listaJuegosPorVer')!) ?? [];
      this.listaJuegosRevisados = JSON.parse(localStorage.getItem('listaJuegosRevisados')!) ?? [];
    }
    this.inicializarDatosBBDD();
    this.cdr.detectChanges();
  }

  private formatoDosDigitos(numero: number): string {
    return numero < 10 ? `0${numero}` : numero.toString();
  }

  private convertirACadenaArray(cadena: string): string[] {
    try {
      // Elimina los corchetes al inicio y al final de la cadena
      const sinCorchetes = cadena.trim().slice(1, -1);
  
      // Divide la cadena en elementos individuales usando comas y espacios
      const elementos = sinCorchetes.split(/,(?=\s*['"])/);
  
      // Limpia los elementos para quitar comillas y filtra entradas vacías
      return elementos
        .map(elemento => elemento.trim().replace(/^['"]|['"]$/g, ''))
        .filter(elemento => elemento !== '');
    } catch (error) {
      console.error("Error al convertir la cadena:", error);
      return [];
    }
  }

  anadirAListados() {
    try {
      //Anadimos los de la lista de no revisados
      this.listaProveedores.filter(p => p.nombre != 'Grouvee').forEach(p => {
        const juegos: string[] = typeof p.listadoJuegos === 'string'
          ? this.convertirACadenaArray(p.listadoJuegos)
          : p.listadoJuegos;
    
        juegos.forEach(nombreJuego => {
          // Lo anadimos solo si no lo hemos revisado o anadido antes
          if (!this.listaJuegosPorVer.find(j => j.nombre === nombreJuego) && !this.listaJuegosRevisados.find(j => j.nombre === nombreJuego)) {
            this.listaJuegosPorVer.push({
              nombre: nombreJuego,
              urlYoutube: `https://www.youtube.com/results?search_query=${encodeURIComponent(nombreJuego + ' gameplay')}`
            });
          }
        });

        p.listadoJuegos = ''; //Reseteamos el input
      });

      //Anadimos a la lista de revisados los de Grouvee
      this.listaProveedores.filter(p => p.nombre == 'Grouvee').forEach(p => {
        const juegos: string[] = typeof p.listadoJuegos === 'string'
          ? this.convertirACadenaArray(p.listadoJuegos)
          : p.listadoJuegos;
    
        juegos.forEach(nombreJuego => {
          // Lo anadimos solo si no lo hemos revisado o anadido antes
          if (!this.listaJuegosPorVer.find(j => j.nombre === nombreJuego) && !this.listaJuegosRevisados.find(j => j.nombre === nombreJuego)) {
            this.listaJuegosRevisados.push({
              nombre: nombreJuego,
              urlYoutube: `https://www.youtube.com/results?search_query=${encodeURIComponent(nombreJuego + ' gameplay')}`
            });
          }
        });

        p.listadoJuegos = ''; //Reseteamos el input
      });
      this.messageService.add({ severity: 'info', summary: 'Juegos añadidos', detail: 'Juegos añadidos al listado con éxito', life: 3000 });
      localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
      this.actualizarListaRevisar();
      localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
      this.actualizarListaRevisados();
    } catch {
      this.messageService.add({ severity: 'error', summary: 'Problema de formato', detail: 'No se añadieron los juegos debido a un problema de formato', life: 3000 });
    }
  }  

  copiarTexto(listaJuegos: string) {
    navigator.clipboard.writeText(listaJuegos);
  }

  pegarTexto(proveedor: Proveedor) {
    navigator.clipboard.readText().then(resp => this.listaProveedores.find(p => p.nombre == proveedor.nombre)!.listadoJuegos = resp);
  }

  codigoRecolectar(clasesARecolectar: string, nombreProveedor: string) {
    clasesARecolectar = clasesARecolectar.replaceAll(' ', '.');

    if (nombreProveedor == 'Grouvee') {
      navigator.clipboard.writeText(`// Recolectar todos los elementos con la clase 'no-hover'
const elementos = document.querySelectorAll('.${clasesARecolectar}');

// Extraer el valor del atributo 'title' de cada elemento y almacenarlos en un array
const textosJuegos = Array.from(elementos).map(elemento => elemento.getAttribute('title'));

// Mostrar el array de títulos
console.log(textosJuegos);
`)
    } else {
      navigator.clipboard.writeText(`
        // Recolectar todos los elementos con la clase
        const elementos = document.querySelectorAll('.${clasesARecolectar}');
        
        // Extraer el texto de cada elemento y almacenarlo en un array
        const textosJuegos = Array.from(elementos).map(elemento => elemento.textContent);
        
        //Lo mostramos para poder copiarlo
        textosJuegos;
            `);
    }

    if (!this.listaProveedores.find(p => p.activoEnClipboard)) {
      this.listaProveedores.forEach(p => p.activoEnClipboard = (p.nombre == nombreProveedor));
      this.messageService.add({ severity: 'success', summary: 'Código JS copiado. Redireccionando...', detail: 'Ahora, pégalo en la consola de la página objetivo', closable: true, life: 3000 });
  
      setTimeout(() => {
        const fechaElegida = new Date(this.fechasElegidas);
        const mesElegido = this.formatoDosDigitos(fechaElegida.getMonth() + 1); //Es +1 porque empieza en 0
        const anoElegido = fechaElegida.getFullYear();
        this.listaProveedores.forEach(p => p.activoEnClipboard = false);
        switch(nombreProveedor) {
          case 'Meristation': {
            window.open(`https://as.com/meristation/juegos/lanzamientos/${anoElegido}/${mesElegido}/`);
            break;
          }
          case '3djuegos': {
            window.open(`https://www.3djuegos.com/lanzamientos/${mesElegido}-${anoElegido}/`);
            break;
          }
          case 'Grouvee': {
            window.open(`https://www.grouvee.com/user/116891-n3buresp1997/shelves/?sort_by=&dir=desc&dateFrom=&dateTo=&num=200&compact=2`);
            break;
          }
        }
      }, 3000);
    }
  }

  anadirJuegoAGrouvee() {
    window.open('https://rubenalarcongalvez.github.io/add-game-to-grouvee/');
  }

  handleMarcarComoRevisado(videojuego: Videojuego) {
    const indiceVideojuego: number = this.listaJuegosPorVer.findIndex(j => j.nombre == videojuego.nombre);
    if (indiceVideojuego >= 0) {
      this.listaJuegosPorVer.splice(indiceVideojuego, 1);
      this.listaJuegosRevisados.unshift(videojuego); //Al principio
      if (videojuego.descartado) {
        this.messageService.add({ severity: 'info', summary: 'Juego revisado descartado', detail: `"${videojuego.nombre}" añadido al listado de revisados (marcado como descartado)`, life: 3000 });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Juego revisado aceptado', detail: `"${videojuego.nombre}" añadido al listado de revisados (en Grouvee)`, life: 3000 });
      }
      localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
      this.actualizarListaRevisar();
      localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
      this.actualizarListaRevisados();
    }
  }

  handleVolverARevisar(videojuego: Videojuego) {
    const indiceVideojuego: number = this.listaJuegosRevisados.findIndex(j => j.nombre == videojuego.nombre);
    if (indiceVideojuego >= 0) {
      this.listaJuegosRevisados.splice(indiceVideojuego, 1);
      this.listaJuegosPorVer.unshift(videojuego); //Al principio
      this.messageService.add({ severity: 'info', summary: 'Juego mandado a revisión', detail: 'Juego añadido al listado de revisión', life: 3000 });
      localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
      this.actualizarListaRevisar();
      localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
      this.actualizarListaRevisados();
    }
  }

  handleAnadirJuego(anadirJuego: AnadirJuego) {
    if (anadirJuego.juegoAnadir && !this.listaJuegosPorVer.find(j => j.nombre === anadirJuego.juegoAnadir) && !this.listaJuegosRevisados.find(j => j.nombre === anadirJuego.juegoAnadir)) {
      if (!anadirJuego.revisados) {
        this.listaJuegosPorVer.push({
          nombre: anadirJuego.juegoAnadir,
          urlYoutube: `https://www.youtube.com/results?search_query=${encodeURIComponent(anadirJuego.juegoAnadir + ' gameplay')}`
        });
        localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
        this.actualizarListaRevisar();
      } else {
        this.listaJuegosRevisados.push({
          nombre: anadirJuego.juegoAnadir,
          urlYoutube: `https://www.youtube.com/results?search_query=${encodeURIComponent(anadirJuego.juegoAnadir + ' gameplay')}`,
          descartado: false
        });
        localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
        this.actualizarListaRevisados();
      }

      this.messageService.add({ severity: 'info', summary: 'Juego añadido', detail: 'Juego añadido al listado con éxito', life: 3000 });
    }
  }

  /*=============================================
  =            Auth            =
  =============================================*/
  
  get loggedIn() : boolean {
    // return this.authService.getCurrentUser() != null; //It is a bit slow to detect it on first instance
    return this.storageService.isLoggedIn(); //In case we use localStorage
  } 
  
  get getUser() : User | null {
    return this.authService.getCurrentUser();
  }

  isEmailAuth(): boolean {
    if (this.getUser && this.getUser?.providerData?.findIndex(p => p.providerId === 'password') != -1) {
      return true;
    }
    return false;
  }

  updateUserEmail() {
    if (this.updateEmailForm.get('previousEmail')?.value == this.getUser?.email && this.updateEmailForm.valid && this.updateEmailForm.get('email')?.value == this.updateEmailForm.get('emailConfirmation')?.value) {
      this.authService.updateEmail(this.getUser!, this.updateEmailForm.get('email')?.value).then(() => {
        this.updateEmailForm.reset();
        this.visibleUpdateEmailPopup = false;
        this.messageService.add({ severity: 'info', summary: 'Confirma tu email', detail: 'Por favor, confirma tu email antes de ingresar', life: 3000 });
      }).catch((err: Error) => {
        if (err.message.includes('requires-recent-login')) {
          this.messageService.add({ severity: 'warn', summary: 'Inicia sesión', detail: 'Debes iniciar sesión de nuevo para realizar esta acción', life: 3000 });
          setTimeout(() => {
            this.logout();
          }, 2000); 
        } else {
          this.messages = [({ severity: 'error', summary: 'Error en el email', detail: 'No puedes cambiar a este email', life: 3000 })];
        }
        console.error(err);
      });
    } else {
      this.messages = [];
      if (this.updateEmailForm.get('previousEmail')?.value != this.getUser?.email) {
        this.messages.push({ severity: 'error', summary: 'Email anterior inválido', detail: 'Por favor, ingresa correctamente el correo anterior', life: 3000 });
      }
      if (this.updateEmailForm.invalid) {
        this.messages.push({ severity: 'warn', summary: 'Nuevo email inválido', detail: 'Por favor, ingresa un correo válido', life: 3000 });
      }
      if (this.updateEmailForm.get('email')?.value != this.updateEmailForm.get('emailConfirmation')?.value) {
        this.messages.push({ severity: 'warn', summary: 'Emails no coinciden', detail: 'Los nuevos correos no coinciden', life: 3000 });
      }
    }
  }

  updateUserPassword() {
    if (this.updatePasswordForm.valid && this.updatePasswordForm.get('password')?.value == this.updatePasswordForm.get('passwordConfirmation')?.value) {
      this.authService.updatePassword(this.getUser!, this.updatePasswordForm.get('password')?.value).then(() => {
        this.updatePasswordForm.reset();
        this.visibleUpdatePasswordPopup = false;
        this.messageService.add({ severity: 'info', summary: 'Contraseña cambiada', detail: 'Contraseña cambiada con éxito', life: 3000 });
      }).catch((err: Error) => {
        if (err.message.includes('requires-recent-login')) {
          this.messageService.add({ severity: 'warn', summary: 'Inicia sesión', detail: 'Debes iniciar sesión de nuevo para realizar esta acción', life: 3000 });
          setTimeout(() => {
            this.logout();
          }, 2000); 
          this.logout();
        } else {
          this.messages = [({ severity: 'error', summary: 'Error de contraseña', detail: 'No puedes poner esta contraseña', life: 3000 })];
        }
        console.error(err);
      });
    } else {
      this.messages = [];
      if (this.updatePasswordForm.invalid) {
        this.messages.push({ severity: 'warn', summary: 'Contraseña inválida', detail: 'La contraseña debe ser al menos de 6 caracteres y máximo 30, y no puede contener <code>|\\/</code>', life: 3000 });
      }
      if (this.updatePasswordForm.get('password')?.value != this.updatePasswordForm.get('passwordConfirmation')?.value) {
        this.messages.push({ severity: 'warn', summary: 'Contraseñas no coinciden', detail: 'Las nuevas contraseñas no coinciden', life: 3000 });
      }
    }
  }

  deleteUser() {
    this.authService.deleteUser(this.getUser!).then(() => {
      this.visibleDeleteUserPopup = false;
      this.messageService.add({ severity: 'info', summary: 'Usuario eliminado', detail: 'Usuario eliminado con éxito', life: 3000 });
      setTimeout(() => {
        this.logout();
      }, 2000);
    }).catch((err: Error) => {
      if (err.message.includes('requires-recent-login')) {
        this.messageService.add({ severity: 'warn', summary: 'Inicia sesión', detail: 'Debes iniciar sesión de nuevo para realizar esta acción', life: 3000 });
        setTimeout(() => {
          this.logout();
        }, 2000); 
        this.logout();
      } 
      console.error(err);
    });
  }

  logout() {
    this.authService.logout();
  }
  
  /*=====  Final de Auth  ======*/

  /*=============================================
  =            Database            =
  =============================================*/

  private convertirTimestampADate(fecha: Timestamp) {
    // Convertir a milisegundos y sumar nanosegundos
    const milliseconds = fecha.seconds * 1000 + Math.floor(fecha.nanoseconds / 1e6);
    
    // Crear un objeto Date
    return new Date(milliseconds);
  }

  inicializarDatosBBDD() {
    this.authService.getCurrentUserPeticion().subscribe((user) => {
      if (user) {
        this.storageService.getDocumentByAddress(`clasificar-juegos/users/${user?.uid}/fechas-elegidas`).subscribe({
          next: (resp: any) => {
            this.fechasElegidas = this.convertirTimestampADate(resp?.['fechasElegidas']);
          },
          error: (err: any) => {
            console.error(err);
          }
        });
        this.storageService.getDocumentByAddress(`clasificar-juegos/users/${user?.uid}/revisar`).subscribe({
          next: (resp: any) => {
            if (resp) {
              this.listaJuegosPorVer = resp?.['listaJuegosPorVer'];
            }
          },
          error: (err: any) => {
            console.error(err);
          }
        });
        this.storageService.getDocumentByAddress(`clasificar-juegos/users/${user?.uid}/revisados`).subscribe({
          next: (resp: any) => {
            if (resp) {
              this.listaJuegosRevisados = resp?.['listaJuegosRevisados'];
            }
          },
          error: (err: any) => {
            console.error(err);
          }
        });
      }
    });
  }
  
  actualizarFecha() {
    return this.storageService.setDocumentByAddress(`clasificar-juegos/users/${this.authService.getCurrentUser()?.uid}/fechas-elegidas`, {
      fechasElegidas: this.fechasElegidas
    });
  }

  actualizarListaRevisar() {
    return this.storageService.setDocumentByAddress(`clasificar-juegos/users/${this.authService.getCurrentUser()?.uid}/revisar`, {
      listaJuegosPorVer: this.listaJuegosPorVer
    });
  }

  actualizarListaRevisados() {
    return this.storageService.setDocumentByAddress(`clasificar-juegos/users/${this.authService.getCurrentUser()?.uid}/revisados`, {
      listaJuegosRevisados: this.listaJuegosRevisados
    });
  }
  
  /*=====  Final de Database  ======*/
}
