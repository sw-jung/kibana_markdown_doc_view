import { chain, set } from 'lodash';

export function convertDocToVars(indexPattern, doc) {
  if (doc.$_template_vars) return doc.$_template_vars;

  const flattenedHit = indexPattern.flattenHit(doc);
  const formattedHit = indexPattern.formatHit(doc);

  const vars = doc.$_template_vars = {};

  vars._all = chain(flattenedHit)
  .map((value, key) => {
    const formattedValue = formattedHit[key];
    set(vars, `${key}.raw`, value);
    set(vars, `${key}.formatted`, formattedValue);
    return {
      label: key,
      raw: value,
      formatted: formattedValue
    };
  })
  .sortBy('label')
  .value();

  return vars;
}