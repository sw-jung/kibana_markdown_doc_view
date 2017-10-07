import { uiModules } from 'ui/modules';
import { MarkdownTemplate } from '../libs/markdown_template';

export function MarkdownTemplatesProvider(esAdmin, kbnIndex) {
  const index = kbnIndex;
  const type = 'markdown_template';
  const self = this;
  const cache = {};

  self.list = q => {
    const allHits = [];
    return esAdmin.search({
      index,
      type,
      q,
      size: 100,
      ignoreUnavailable: true
    })
    .then(function getMoreUntilDone(resp) {
      allHits.push(...resp.hits.hits);
      if (resp.hits.total <= allHits.length) return allHits;
      return esAdmin.scroll({
        scrollId: resp._scroll_id
      }).then(getMoreUntilDone);
    });
  };

  self.get = id => {
    return Promise.resolve(cache[id])
    .then((cached) => {
      return cached || esAdmin.getSource({
        index,
        type,
        ignore: 404,
        id: id
      }).then((source = {}) => {
        const { template, options } = source;
        return cache[id] = new MarkdownTemplate(template, options);
      });
    });
  };

  self.save = (id, docTemplate, options) => {
    return esAdmin.index({
      index,
      type,
      id: id,
      body: docTemplate,
      refresh: options ? options.refresh : true
    }).then(() => delete cache[id]);
  };

  self.delete = ids => {
    ids = [].concat(ids);
    return esAdmin.deleteByQuery({
      index,
      type,
      body: {
        query: {
          ids: {
            values: ids
          }
        }
      },
      refresh: true,
      ignoreUnavailable: true
    }).then(() => ids.forEach(id => delete cache[id]));
  };
}

uiModules.get('markdown_doc_view', [])
.service('markdownTemplates', MarkdownTemplatesProvider);