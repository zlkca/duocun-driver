import { Component, OnInit, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';

declare let google: any;

function getFunc(location) {
  return () => {
    (<any>window).location = encodeURI('https://www.google.com/maps/dir/?api=1&destination=' +
      + location.streetNumber + '+' + location.streetName + '+'
      + (location.subLocality ? location.subLocality : location.city) + '+'
      + location.province
      + '&destination_placeId=' + location.placeId);
  };
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges {
  @Input() center: any;
  @Input() zoom: any;
  @Input() places: any[];
  @ViewChild('map', { static: true }) input: ElementRef;

  constructor() { }

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(v) {
    this.initMap();
  }

  initMap() {
    const self = this;
    if (typeof google !== 'undefined') {
      const mapDom = this.input.nativeElement;
      const map = new google.maps.Map(mapDom, {
      // const map = new google.maps.Map(document.getElementById('map'), {
        zoom: self.zoom,
        center: self.center,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      if (this.places && this.places.length > 0) {
        // var infowindow = new google.maps.InfoWindow({
        //   content: contentString
        // });


        this.places.map((p, i) => {
          // return
          const marker1 = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            label: {
              text: self.places[i].name,
              fontSize: '11px'
            },
            map: map,
            icon: {
              url: p.icon
            }
          });

          if (p.status === 'done') {
            google.maps.event.removeListener(p.listener);
          } else {
            p.listener = marker1.addListener('click', getFunc(self.places[i]));
          }


          // marker1.setMap(map);
        });
      }// end of this.places

    }
  }

}
