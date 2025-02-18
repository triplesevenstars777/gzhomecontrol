import { Injectable } from '@angular/core';
import { ApiNew } from './api-new';
import { Building } from '../../models/building.model';


@Injectable({
  providedIn: 'root'
})
export class BuildingService {

  constructor(
    private apiNew: ApiNew
  ){}

  create(data: Building){
    return this.apiNew.post('buildings', data );
  }
  update(id: string, data: Building){
    return this.apiNew.put('buildings', id,  data );
  }
  delete(id: string){
    return this.apiNew.delete('buildings', id );
  }
  show(id: string){
    return this.apiNew.getOne( 'buildings', id )
  }
  showAll(params:any = {}){
    return this.apiNew.getAll('buildings', params);
  }
}
