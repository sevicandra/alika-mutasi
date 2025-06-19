import path from 'path';
import moduleAlias from 'module-alias';

const basePath = __dirname.includes('dist') ? 'dist' : 'src';

moduleAlias.addAlias('@', path.join(__dirname, '..', basePath));
