import '../libs/markdown_templates';
import './markdown.less';
import defaultTemplate from './no_template.html';
import { DocViewsRegistryProvider } from 'ui/registry/doc_views';
import { convertDocToVars } from '../libs/convert_doc_to_vars';

DocViewsRegistryProvider.register(markdownTemplates => {
  return {
    title: 'Markdown',
    order: 30,
    directive: {
      scope: {
        hit: '=',
        indexPattern: '=',
        filter: '=',
        columns: '='
      },
      link: ($scope, elem) => {
        const { indexPattern, hit } = $scope;
        markdownTemplates.get(indexPattern.title)
        .then(template => template.isEmpty() ? defaultTemplate : template.render(convertDocToVars(indexPattern, hit)))
        .then(renderedHtml => elem.empty().append(renderedHtml));
      }
    }
  };
});