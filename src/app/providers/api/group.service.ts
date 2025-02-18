import { Injectable } from '@angular/core';
import { Group } from '../../models/group.model';
import { ApiNew } from './api-new';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  constructor(
    private apiNew: ApiNew
  ){}

  create(data: Group){
    return this.apiNew.post('groups', data );
  }
  update(id: string, data: Group){
    return this.apiNew.put('groups', id,  data );
  }
  delete(id: string){
    return this.apiNew.delete('groups', id );
  }
  show(id: string){
    return this.apiNew.getOne( 'groups', id )
  }
  showAll(params:any = {}){
    return this.apiNew.getAll('groups', params);
  }
  
}
