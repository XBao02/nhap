import { DatabaseSchemaWithTypeMapping } from '../SQLiteDAO';

import * as core from './core.json';
import * as media from './media.json';
import * as config from './config.json';
import * as crm from './crm.json';
import * as fnb from './fnb.json';
import * as oms from './oms.json';
import * as payment from './payment.json';
import * as scm from './scm.json';
import * as inventory from './inventory.json';
import * as product from './product.json';

// Ép kiểu rõ ràng tại thời điểm export
export const schemaConfigurations: Record<string, DatabaseSchemaWithTypeMapping> = {
  core,
  media,
  product,
  config,
  crm,
  fnb,
  oms,
  payment,
  scm,
  inventory,
};

