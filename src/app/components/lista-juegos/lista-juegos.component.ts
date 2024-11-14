import { Component, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Videojuego } from '../../app.component';
import { PrimeNgModule } from '../../shared/style/prime-ng/prime-ng.module';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { normalizarCadena } from '../../shared/utils/util';

export interface AnadirJuego {
  juegoAnadir: string,
  revisados: boolean
}
@Component({
  selector: 'app-lista-juegos',
  standalone: true,
  imports: [PrimeNgModule, FormsModule],
  providers: [ConfirmationService],
  templateUrl: './lista-juegos.component.html',
  styleUrl: './lista-juegos.component.scss'
})
export class ListaJuegosComponent {
  @Input('listaJuegos') listaJuegos: Videojuego[] = [];
  @Output() listaJuegosChange = new EventEmitter<Videojuego[]>();
  @Input('revisados') revisados: boolean = false;
  @Output('anadirJuego') anadirJuego = new EventEmitter<AnadirJuego>();
  @Output('marcarComoRevisado') marcarComoRevisado = new EventEmitter<Videojuego>();
  @Output('volverARevisar') volverARevisar = new EventEmitter<Videojuego>();
  filtroSignal = signal<string>('');
  public get filtro() : string {
    return this.filtroSignal();
  }
  public set filtro(v : string) {
    this.filtroSignal.set(v);
  }
  listaOpcionesMostradas: string[] = [];
  juegoAnadir: string = '';

  /* Paginacion */
  first: number = 0; //Empieza en la posicion 0
  rows: number = 5; //Por defecto, va de 5 en 5
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }

  constructor(private confirmationService: ConfirmationService, private messageService: MessageService) {
    /* Cuando el filtro cambie, hay que resetear el primer valor de la lista */
    effect(() => {
      if (this.filtroSignal()) {
        this.first = 0;
      }
    });
  }

  irALaUrlDelJuego(juego: Videojuego) {
    //Primero, copiamos el nombre del juego
    navigator.clipboard.writeText(juego.nombre);
    this.messageService.add({ severity: 'info', summary: 'Nombre del juego copiado', detail: 'Para buscar más información', life: 3000 });

    setTimeout(() => {
      window.open(juego.urlYoutube);
    }, 1000);
  }

  buscarInfoGoogle(nombreJuego: string) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(nombreJuego)}+videojuego`)
  }

  confirmarBorradoDeLista(event: Event) {
      this.confirmationService.confirm({
          target: event.target as EventTarget,
          message: '¿Seguro que quieres borrar todos los elementos de esta lista?',
          icon: 'pi pi-info-circle',
          acceptButtonStyleClass: 'p-button-danger p-button-sm',
          rejectLabel: 'No',
          acceptLabel: 'Sí, limpiar',
          accept: () => {
              this.messageService.add({ severity: 'info', summary: 'Confirmado', detail: 'Listado limpio', life: 3000 });
              this.listaJuegos = [];
              this.listaJuegosChange.emit(this.listaJuegos); //Lo debemos hacer asi cuando igualamos, al cambiar la lista con push o asi, no hace falta
              if (!this.revisados) {
                localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegos));
              } else {
                localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegos));
              }
          },
      });
  }

  public get listaJuegosFiltrada() : Videojuego[] {
    return this.listaJuegos.filter(juego => (!this.listaOpcionesMostradas.length || this.listaOpcionesMostradas.includes('aceptados') && !juego.descartado || this.listaOpcionesMostradas.includes('descartados') && juego.descartado) && normalizarCadena(juego.nombre).includes(normalizarCadena(this.filtro)));
  }

  public get listaJuegosFiltradaPaginada() : Videojuego[] {
    return this.listaJuegosFiltrada.splice(this.first, this.rows);
  }

  anadirJuegoLista() {
    this.anadirJuego.emit({
      juegoAnadir: this.juegoAnadir,
      revisados: this.revisados
    });

    this.juegoAnadir = '';
  }

  borrarJuego(nombreJuego: string) {
    const indiceJuego: number = this.listaJuegos.findIndex(j => j.nombre === nombreJuego);
    if (indiceJuego >= 0) {
      this.listaJuegos.splice(indiceJuego, 1);
      this.messageService.add({ severity: 'error', summary: 'Juego borrado', detail: `"${nombreJuego}" eliminado de la lista`, life: 3000 });
      if (!this.revisados) {
        localStorage.setItem('listaJuegosPorVer', JSON.stringify(this.listaJuegos));
      } else {
        localStorage.setItem('listaJuegosRevisados', JSON.stringify(this.listaJuegos));
      }
    }
  }

  marcarComoRevisadoLista(videojuego: Videojuego, descartado: boolean = false) {
    videojuego.descartado = descartado;
    this.marcarComoRevisado.emit(videojuego);

    if (!descartado) {
      //Vamos a anadirlo en Grouvee
      setTimeout(() => {
        window.open(`https://www.grouvee.com/search/?q=${encodeURIComponent(videojuego.nombre)}`);
      }, 1000);
    }
  }

  volverARevisarLista(videojuego: Videojuego) {
    this.volverARevisar.emit(videojuego);
  }
}
