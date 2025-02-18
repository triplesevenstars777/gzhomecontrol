import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { ApiNew } from './api-new';
import { Room } from '../../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(
    private apiNew: ApiNew
  ){}

  create(data: Room){
    return this.apiNew.post( 'rooms', data );
  }
  update(id: string, data: Room){
    return this.apiNew.put( 'rooms', id,  data );
  }
  delete(id: string){
    return this.apiNew.delete( 'rooms', id );
  }
  show(id: string){
    return this.apiNew.getOne( 'rooms', id )
  }
  showAll(params:any = {}){
    return this.apiNew.getAll( 'rooms', params);
  }

}
