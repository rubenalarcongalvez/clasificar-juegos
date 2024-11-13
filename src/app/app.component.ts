import { afterNextRender, ChangeDetectorRef, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNgModule } from './shared/style/prime-ng/prime-ng.module';
import { MessageService } from 'primeng/api';
import { AnadirJuego, ListaJuegosComponent } from './components/lista-juegos/lista-juegos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Proveedor {
  nombre: string,
  clase: string,
  activoEnClipboard: boolean,
  listadoJuegos: string | string[]
}

export interface Videojuego {
  nombre: string,
  urlYoutube: string
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PrimeNgModule, ListaJuegosComponent, ReactiveFormsModule, FormsModule],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  juegos: Set<string> = new Set();
  listaProveedores: Proveedor[] = [
    {nombre: 'Meristation', clase: 'ga__tl', activoEnClipboard: false, listadoJuegos: ''},
    {nombre: '3djuegos', clase: 's18 dib c0', activoEnClipboard: false, listadoJuegos: ''},
  ];

  fechasElegidas: string | Date = this.formatoDosDigitos(new Date().getMonth()) + '/' + new Date().getFullYear().toString();
  listaMostrada: string = 'revisar';
  listaJuegosPorVer: Videojuego[] = [];
  listaJuegosRevisados: Videojuego[] = [];

  constructor(private messageService: MessageService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.listaJuegosPorVer = JSON.parse(localStorage.getItem('listaJuegosPorVer')!) ?? [];
      this.listaJuegosRevisados = JSON.parse(localStorage.getItem('listaJuegosRevisados')!) ?? [];
    }
    this.cdr.detectChanges();
  }

  private formatoDosDigitos(numero: number): string {
    return numero < 10 ? `0${numero}` : numero.toString();
  }

  anadirAListadoPorVer() {
    try {
      this.listaProveedores.forEach(p => {
        const juegos: string[] = typeof p.listadoJuegos === 'string'
          ? (p?.listadoJuegos ? JSON.parse(p?.listadoJuegos?.replaceAll(/'/g, '"')) : [])
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
      });
  
      this.messageService.add({ severity: 'info', summary: 'Juegos añadidos', detail: 'Juegos añadidos al listado con éxito', life: 3000 });
      localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
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

    navigator.clipboard.writeText(`
// Recolectar todos los elementos con la clase
const elementos = document.querySelectorAll('.${clasesARecolectar}');

// Extraer el texto de cada elemento y almacenarlo en un array
const textosJuegos = Array.from(elementos).map(elemento => elemento.textContent);

//Lo mostramos para poder copiarlo
textosJuegos;
    `);

    if (!this.listaProveedores.find(p => p.activoEnClipboard)) {
      this.listaProveedores.forEach(p => p.activoEnClipboard = (p.nombre == nombreProveedor));
      this.messageService.add({ severity: 'success', summary: 'Mensaje copiado. Redireccionando...', detail: 'Ahora, pégalo en la consola de la página objetivo', closable: true, life: 3000 });
  
      setTimeout(() => {
        const fechaElegida = new Date(this.fechasElegidas);
        const mesElegido = this.formatoDosDigitos(fechaElegida.getMonth());
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
        }
      }, 3000);
    }
  }

  handleMarcarComoRevisado(videojuego: Videojuego) {
    const indiceVideojuego: number = this.listaJuegosPorVer.findIndex(j => j.nombre == videojuego.nombre);
    if (indiceVideojuego >= 0) {
      this.listaJuegosPorVer.splice(indiceVideojuego, 1);
      this.listaJuegosRevisados.unshift(videojuego); //Al principio
      this.messageService.add({ severity: 'success', summary: 'Juego revisado', detail: 'Juego añadido al listado de revisados', life: 3000 });
      localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
      localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
    }
  }

  handleVolverARevisar(videojuego: Videojuego) {
    const indiceVideojuego: number = this.listaJuegosRevisados.findIndex(j => j.nombre == videojuego.nombre);
    if (indiceVideojuego >= 0) {
      this.listaJuegosRevisados.splice(indiceVideojuego, 1);
      this.listaJuegosPorVer.unshift(videojuego); //Al principio
      this.messageService.add({ severity: 'info', summary: 'Juego mandado a revisión', detail: 'Juego añadido al listado de revisión', life: 3000 });
      localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegosPorVer));
      localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
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
      } else {
        this.listaJuegosRevisados.push({
          nombre: anadirJuego.juegoAnadir,
          urlYoutube: `https://www.youtube.com/results?search_query=${encodeURIComponent(anadirJuego.juegoAnadir + ' gameplay')}`
        });
        localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegosRevisados));
      }

      this.messageService.add({ severity: 'info', summary: 'Juego añadido', detail: 'Juego añadido al listado con éxito', life: 3000 });
    }
  }
}
