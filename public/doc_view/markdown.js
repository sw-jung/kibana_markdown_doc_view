import '../libs/markdown_templates';
import './markdown.less';
import defaultTemplate from './no_template.html';
import { DocViewsRegistryProvider } from 'ui/registry/doc_views';
import { convertDocToVars } from '../libs/convert_doc_to_vars';

DocViewsRegistryProvider.register((markdownTemplates, $compile) => {
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
        markdownTemplates.get(indexPattern.id)
        .then(template => template.isEmpty() ? defaultTemplate : template.render(convertDocToVars(indexPattern, hit)))
        .then(renderedText => $compile(renderedText)($scope))
        .then(compiledElement => elem.empty().append(compiledElement));
      }
    }
  };
});