import { Component, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-map',
  template: '<div id="map" style="height: 300px;"></div>',
})
export class LeafletMapComponent implements AfterViewInit, OnChanges {
  @Input() latitude = 0;
  @Input() longitude = 0;
  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([this.latitude, this.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['latitude'] || changes['longitude'])) {
      const newLat = changes['latitude']?.currentValue ?? this.latitude;
      const newLon = changes['longitude']?.currentValue ?? this.longitude;

      // Update map center
      this.map.setView([newLat, newLon], 15);

      // Remove old marker and add new one
      if (this.marker) {
        this.map.removeLayer(this.marker);
      }
      this.marker = L.marker([newLat, newLon]).addTo(this.map);
    }
  }
}
