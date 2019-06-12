import { Component, OnInit, Input, OnChanges } from '@angular/core';

declare let google: any;
declare let MarkerClusterer: any;

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges {
    @Input()
    center: any;

    @Input()
    zoom: any;

    @Input()
    places: any[];

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
            const map = new google.maps.Map(document.getElementById('map'), {
                zoom: self.zoom,
                center: self.center,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            });

            // const marker = new google.maps.Marker({
            //     position: self.center,
            //     map: map,
            //     label: ''
            // });


            if (this.places && this.places.length > 0) {
                // var infowindow = new google.maps.InfoWindow({
                //   content: contentString
                // });

                // var marker = new google.maps.Marker({
                //   position: uluru,
                //   map: map,
                //   title: 'Uluru (Ayers Rock)'
                // });
                // marker.addListener('click', function() {
                //   infowindow.open(map, marker);
                // });

                // const markers = this.places.map((location, i) => {
                //     return new google.maps.Marker({
                //         position: location,
                //         label: {
                //           text: self.places[i].name,
                //           fontSize: '11px'
                //         }
                //     });
                // });
                const markers = this.places.map((p, i) => {
                  // return
                  const marker1 = new google.maps.Marker({
                    position: p,
                    label: {
                      text: self.places[i].name,
                      fontSize: '11px'
                    },
                    icon: {
                      url: p.icon
                    }
                  });
                  marker1.setMap(map);
                });
                // const markerCluster = new MarkerClusterer(map, markers,
                //     { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });

            }// end of this.places

        }
    }

}
