import { Injectable } from '@angular/core';
import { ApiNew } from './api-new';

@Injectable({
  providedIn: 'root'
})
export class MeasureService {

  constructor(
    private apiNew: ApiNew
  ){}

  create(data: any){
    return this.apiNew.post( 'measures', data );
  }
  update(id: string, data: any){
    return this.apiNew.put( 'measures', id,  data );
  }
  delete(id: string){
    return this.apiNew.delete( 'measures', id );
  }
  show(id: string){
    return this.apiNew.getOne( 'measures', id )
  }
  showAll(params:any = {}){
    return this.apiNew.getAll( 'measures', params);
  }

}
