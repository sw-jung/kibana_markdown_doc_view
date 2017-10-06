import { memoize } from 'lodash';
import Handlebars from 'handlebars/dist/handlebars';
import Swag from './swag';

Swag.registerHelpers(Handlebars);
export const compileTemplate = memoize(Handlebars.compile);