import { uiModules } from 'ui/modules';
import { Scanner } from 'ui/utils/scanner';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import { MarkdownTemplate } from '../libs/markdown_template';

export function MarkdownTemplatesProvider(kbnIndex, $http, Private) {
  const self = this;
  const type = 'markdown_template';
  const scanner = new Scanner($http, {
    index: kbnIndex,
    type
  });
  const savedObjectsClient = Private(SavedObjectsClientProvider);

  self.list = queryString => {
    return scanner.scanAndMap(queryString, {
      pageSize: 1000,
      docCount: Infinity
    }).then(({ hits }) => hits);
  };

  self.get = id => {
    return savedObjectsClient.get(type, id)
    .then(({ attributes }) => {
      const { template, options } = attributes;
      return new MarkdownTemplate(template, options);
    });
  };

  self.save = (id, docTemplate) => {
    return savedObjectsClient.create(type, docTemplate, {
      id,
      overwrite: true
    });
  };

  self.delete = ids => {
    return Promise.all([].concat(ids)
    .map(id => savedObjectsClient.delete(type, id)));
  };
}

uiModules.get('markdown_doc_view', [])
.service('markdownTemplates', MarkdownTemplatesProvider);