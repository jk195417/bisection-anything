import { Pipe, PipeTransform } from '@angular/core';
import { itemName } from '../core/item';

/** Shows an item line without its image URL. */
@Pipe({ name: 'itemName' })
export class ItemNamePipe implements PipeTransform {
  transform(item: string | null | undefined): string {
    return item ? itemName(item) : '';
  }
}
