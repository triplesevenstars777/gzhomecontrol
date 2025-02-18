import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { ApiNew } from './api-new';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private apiNew: ApiNew
  ){}

  create(data: User){
    return this.apiNew.post( 'users', data );
  }
  update(id: string, data: User){
    return this.apiNew.put( 'users', id,  data );
  }
  delete(id: string){
    return this.apiNew.delete( 'users', id );
  }
  show(id: string){
    return this.apiNew.getOne( 'users', id )
  }
  showAll(params:any = {}){
    return this.apiNew.getAll( 'users', params);
  }
  changePassword( data: any = {} ){
    return this.apiNew.post('users/change-password', data );
  }

}
