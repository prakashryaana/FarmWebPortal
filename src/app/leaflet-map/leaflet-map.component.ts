import { Component, Input, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-map',
  template: '<div id="map" style="height: 300px;"></div>',
})
export class LeafletMapComponent implements AfterViewInit {
  @Input() latitude = 0;
  @Input() longitude = 0;
  private map?: L.Map;

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([this.latitude, this.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    L.marker([this.latitude, this.longitude]).addTo(this.map);
  }
}
