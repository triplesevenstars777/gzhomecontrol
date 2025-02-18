import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiNew } from './api-new';
import { Rule } from '../../models/rule.model';

@Injectable({
  providedIn: 'root'
})
export class RuleService {

  constructor(
    private apiNew: ApiNew
  ) { }

  create(data: Rule) {
    return this.apiNew.post('rules', data).pipe(
      map(response => response)
    );
  }

  update(id: string, data: Rule) {
    return this.apiNew.put('rules', id, data).pipe(
      map(response => response)
    );
  }

  delete(id: string) {
    return this.apiNew.delete('rules', id).pipe(
      map(response => response)
    );
  }

  show(id: string) {
    return this.apiNew.getOne('rules', id).pipe(
      map(response => response)
    );
  }

  showAll(params: any = {}) {
    return this.apiNew.getAll('rules', params).pipe(
      map(response => response)
    );
  }
}
