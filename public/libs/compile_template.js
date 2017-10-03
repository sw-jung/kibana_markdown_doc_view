import { memoize } from 'lodash';
import Handlebars from 'handlebars/dist/handlebars';

Handlebars.registerHelper({
  eq: function (value, compareTo) {
    return value === compareTo;
  },
  ne: function (value, compareTo) {
    return value !== compareTo;
  },
  lt: function (value, compareTo) {
    return value < compareTo;
  },
  gt: function (value, compareTo) {
    return value > compareTo;
  },
  lte: function (value, compareTo) {
    return value <= compareTo;
  },
  gte: function (value, compareTo) {
    return value >= compareTo;
  },
  and: function (value, compareTo) {
    return value && compareTo;
  },
  or: function (value, compareTo) {
    return value || compareTo;
  }
});

export const compileTemplate = memoize(Handlebars.compile);