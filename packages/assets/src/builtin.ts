import catalog from '../catalog.json' with { type: 'json' };
import phone1 from '../artwork/phone-v1.svg';
import phone2 from '../artwork/phone-v2.svg';
import book1 from '../artwork/book-v1.svg';
import { createAssetLibrary } from './index.ts';

// Studio bundles exactly the same files whose hashes the Node loader verifies.
export const builtinLibrary = createAssetLibrary(catalog, {
  'artwork/phone-v1.svg': phone1,
  'artwork/phone-v2.svg': phone2,
  'artwork/book-v1.svg': book1,
});
