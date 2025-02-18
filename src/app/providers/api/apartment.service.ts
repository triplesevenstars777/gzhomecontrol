import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Apartment } from '../../models/apartment.model';
import { ApiNew } from './api-new';

@Injectable({
  providedIn: 'root'
})
export class ApartmentService {

  constructor(
    private apiNew: ApiNew
  ){}

  create(data: Apartment){
    return this.apiNew.post('apartments', data );
  }

  update(id: string, data: Apartment){
    return this.apiNew.put('apartments', id,  data );
  }

  delete(id: string){
    return this.apiNew.delete('apartments', id );
  }

  show(id: string){
    return this.apiNew.getOne( 'apartments', id )
  }
  
  showAll(params:any = {}){
    return this.apiNew.getAll('apartments', params);
  }

}
