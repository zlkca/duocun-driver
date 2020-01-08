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

    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe(result => {

    });
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

          // if (p.status === 'done') {
          //   google.maps.event.removeListener(p.listener);
          // } else {
            p.listener = marker1.addListener('click', function() {
              self.openDeliveryDialog(self.places[i]);
            });
          // }


          // marker1.setMap(map);
        });
      }// end of this.places

    }
  }

}
