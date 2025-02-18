import { Injectable } from '@angular/core';
import { Scene } from '../../models/scene.model';
import { ApiNew } from './api-new';



@Injectable({
  providedIn: 'root'
})
export class ScenesService {

  constructor(
    private apiNew: ApiNew
  ){
  }

  create(data: Scene){
    return this.apiNew.post('scenes', data );
  }
  update(id: string, data){
    return this.apiNew.put('scenes', id,  data );
  }
  delete(id: string){
    return this.apiNew.delete('scenes', id );
  }
  show(id: string){
    return this.apiNew.getOne( 'scenes', id )
  }
  showAll(params:any = {}){
    return this.apiNew.getAll( 'scenes', params);
  }
}

