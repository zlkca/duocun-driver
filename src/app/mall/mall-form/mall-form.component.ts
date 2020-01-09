import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { FormBuilder, Validators } from '../../../../node_modules/@angular/forms';
import { Mall } from '../mall.model';

@Component({
  selector: 'app-mall-form',
  templateUrl: './mall-form.component.html',
  styleUrls: ['./mall-form.component.scss']
})
export class MallFormComponent implements OnInit {

  @Output() afterSave: EventEmitter<any> = new EventEmitter();
  @Input() mall: Mall;

  form;
  location;
  address;
  workers;

  constructor(
    private fb: FormBuilder
  ) {
    this.form = this.createForm();
  }

  ngOnInit() {

  }

  createForm() {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.maxLength(750)],
      // street: ['', Validators.required],
      // postalCode:['', Validators.required]
      address: this.fb.group({
        // street: ['', [Validators.required]],
        unit: ['', [Validators.required]],
        postalCode: ['', [Validators.required]],
      }),
    });
  }

    // callback of app-address-input
  onAddressChange(e) {
    // localStorage.setItem('location-' + APP, JSON.stringify(e.addr));
    this.location = e.addr;
    this.address = e.sAddr;
    if (this.location) {
      this.form.get('address').patchValue({ postalCode: this.location.postalCode });
    }

    // this.sharedSvc.emitMsg({ name: 'OnUpdateAddress', addr: e.addr });
  }

  save(){

  }
  cancel(){

  }
}
