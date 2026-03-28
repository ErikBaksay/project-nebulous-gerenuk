import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FullscreenToolOverlayComponent } from './components/fullscreen-tool-overlay/fullscreen-tool-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FullscreenToolOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
