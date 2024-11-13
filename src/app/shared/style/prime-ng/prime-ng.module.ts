import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { StepperModule } from 'primeng/stepper';
import { CalendarModule } from 'primeng/calendar';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
  declarations: [],
  exports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    StepperModule,
    CalendarModule,
    FloatLabelModule,
    InputTextareaModule,
    SelectButtonModule,
    ConfirmPopupModule,
    InputTextModule
  ]
})
export class PrimeNgModule { }
