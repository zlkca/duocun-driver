import { Component, OnInit, Input, OnChanges, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialog } from '../../../../node_modules/@angular/material';
import { takeUntil } from '../../../../node_modules/rxjs/operators';
import { Subject } from '../../../../node_modules/rxjs';
import { DeliveryDialogComponent } from '../../order/delivery-dialog/delivery-dialog.component';

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
export class MapComponent implements OnInit, OnDestroy, OnChanges {
  @Input() center: any;
  @Input() zoom: any;
  @Input() places: any[];
  @Input() pickup: any;
  @ViewChild('map', { static: true }) input: ElementRef;

  onDestroy$ = new Subject();
  markers = [];
  map;

  constructor(
    public dialogSvc: MatDialog
  ) { }

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(v) {
    this.initMap();
  }

  ngOnDestroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  openDeliveryDialog(location: any) {
    const params = {
      width: '300px',
      data: {
        title: '订单', content: '', buttonTextNo: '取消', buttonTextYes: '确认', location: location, pickup: this.pickup
      },
      panelClass: 'delivery-dialog'
    };
    const dialogRef = this.dialogSvc.open(DeliveryDialogComponent, params);

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(group => {
      if (group) {
        this.updatePlace(this.map, group);
      }
    });
  }

  addPlaces(map) {
    const self = this;
    if (this.places && this.places.length) {
      this.places.map((p, i) => {
        const iconUrl = p.icon ? p.icon : 'http://labs.google.com/ridefinder/images/mm_20_red.png';
        const marker1 = new google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          label: {
            text: self.places[i].name,
            fontSize: '11px'
          },
          icon: {
            url: iconUrl
          },
          placeId: p.placeId
        });

        // if (p.status === 'done') {
        //   google.maps.event.removeListener(p.listener);
        // } else {
        p.listener = marker1.addListener('click', function () {
          self.openDeliveryDialog(self.places[i]);
        });
        // }

        marker1.setMap(map);
        this.markers.push(marker1);
      });
    }// end of this.places
  }

  removePlaces() {
    if (this.places && this.places.length) {
      this.places.map((p, i) => {
        google.maps.event.removeListener(p.listener);
      });
    }
    this.markers.map(m => {
      m.setMap(null);
    });
  }

  updatePlace(map: any, group: any) {
    const self = this;
    const icons = {
      yellow: 'http://maps.google.com/mapfiles/ms/icons/yellow.png',
      green: 'http://maps.google.com/mapfiles/ms/icons/green.png',
      red: 'http://maps.google.com/mapfiles/ms/icons/red.png',
    };

    const place: any = this.places.find(p => p.placeId === group.placeId);
    const marker: any = this.markers.find(m => m.placeId === group.placeId);
    let isDone = true; // place.status === 'done';
    // group.items.push({ balance: balance, order: order, code: code, status: status, paid: (order.status === 'paid') });
    group.items.map(x => {
      if (x.status !== 'done') {
        isDone = false;
      }
    });
    place.icon = isDone ? icons['green'] : icons['red'];

    google.maps.event.removeListener(place.listener);

    marker.setMap(null);

    const iconUrl = place.icon ? place.icon : 'http://labs.google.com/ridefinder/images/mm_20_red.png';
    const newMarker = new google.maps.Marker({
      position: place,
      label: {
        text: place.name,
        fontSize: '11px'
      },
      icon: {
        url: iconUrl
      },
      placeId: group.placeId
    });

    place.listener = newMarker.addListener('click', function () {
      self.openDeliveryDialog(place);
    });

    newMarker.setMap(map);
    this.markers.push(newMarker);
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

      this.addPlaces(map);
      this.map = map;
    }
  }

}
