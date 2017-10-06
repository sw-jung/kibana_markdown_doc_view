import mappings from './lib/mappings.json';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'markdown_doc_view',
    uiExports: {
      docViews: ['plugins/markdown_doc_view/doc_view/markdown'],
      managementSections: ['plugins/markdown_doc_view/management'],
      mappings
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

  });
}
