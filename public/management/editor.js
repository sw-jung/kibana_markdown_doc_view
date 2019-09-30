import {chain, first, isEmpty, once} from 'lodash';
import angular from 'angular';
import uiRoutes from 'ui/routes';
import '../libs/markdown_editor';
import './editor.less';
import renderErrorTemplate from './render_error.html';
import {compileTemplate} from '../libs/compile_template';
import template from './editor.html';
import {MarkdownTemplate} from '../libs/markdown_template';
import {convertDocToVars} from '../libs/convert_doc_to_vars';

const messages = {
    INTRODUCE_EACH_ALL: `# All fields

{{#each _all}}
- {{label}}: {{{formatted}}}
{{/each}}`
};
const renderError = compileTemplate(renderErrorTemplate);

uiRoutes
    .when('/management/kibana/markdown_template/:id', {
        template,
        resolve: {
            indexPattern: ($route, Promise, redirectWhenMissing, indexPatterns) => {
                const {indexPatternId} = $route.current.params;
                if (isEmpty(indexPatternId)) return;

                return Promise.resolve(indexPatterns
                    .get(indexPatternId))
                    .catch(redirectWhenMissing('/management/kibana/markdown_template'));
            },
            markdownTemplate: ($route, markdownTemplates) => {
                return markdownTemplates.get($route.current.params.id);
            }
        },
        controller: ($scope, $route, $window, markdownTemplates, confirmModal, Notifier, es) => {
            const notify = new Notifier({location: 'Markdown Template Editor'});
            $scope.messages = messages;
            $scope.indexPattern = $route.current.locals.indexPattern;
            $scope.editingId = $route.current.params.id;
            $scope.editingSource = $route.current.locals.markdownTemplate;
            $scope.editorOptions = {
                autofocus: true,
                autosave: {
                    enabled: false
                },
                previewRender(plainText, preview) {
                    $scope.valid = true;
                    Promise.resolve(new MarkdownTemplate(plainText, $scope.editingSource.options))
                        .then(newTemplate => newTemplate.render($scope.vars))
                        .then(renderedHtml => angular.element(preview).empty().append(renderedHtml))
                        .catch(e => {
                            $scope.valid = false;
                            preview.innerHTML = renderError(e);
                        });
                    return 'Loading...';
                }
            };

            $scope.$on('markdownEditor:init', (e, editor) => {
                $scope.markdownEditor = editor;
            });

            $scope.registerDocSelector = $select => {

                const initSampleDoc = once(hits => {
                    $scope.convertDocToVars($scope.indexPattern, $scope.docSample = first(hits));
                });

                $scope.$watch(() => $select.search, qs => {
                    es.search({
                        index: $scope.editingId,
                        q: isEmpty(qs) ? '*' : qs,
                        size: 10
                    }).then(resp => {
                        return $scope.docSamples = resp.hits.hits;
                    }).then(initSampleDoc);
                });
            };

            $scope.convertDocToVars = (indexPattern, doc) => {
                if (!indexPattern) return $scope.noIndexPattern = true;

                $scope.vars = convertDocToVars(indexPattern, doc);
                $scope.varIndex = chain($scope.vars._all)
                    .map(({label, raw, formatted}) => {
                        return [
                            {key: `{{${label}.raw}}`, value: raw},
                            {key: `{{{${label}.formatted}}}`, value: formatted}
                        ];
                    })
                    .flatten()
                    .value();
            };

            $scope.drawText = text => {
                const cm = $scope.markdownEditor.codemirror;
                cm.replaceSelection(text);
                cm.focus();
            };

            $scope.updatePreview = () => {
                if (!$scope.markdownEditor || !$scope.markdownEditor.isPreviewActive()) return;
                const cm = $scope.markdownEditor.codemirror;
                const preview = $scope.mdePreview || ($scope.mdePreview = cm.getWrapperElement().lastChild);
                $scope.editorOptions.previewRender($scope.markdownEditor.value(), preview);
            };

            $scope.delete = () => {
                confirmModal(`Are you sure you want to delete the selected templates? This action is irreversible!`, {
                    confirmButtonText: `Delete templates`,
                    onConfirm: () => markdownTemplates.delete($scope.editingId)
                        .then($scope.cancel)
                        .catch(notify.error)
                });
            };

            $scope.save = () => {
                return markdownTemplates.save($scope.editingId, $scope.editingSource)
                    .then(() => console.log(`You successfully updated markdown template of ${$scope.editingId}`))
                    .catch(notify.error);
            };

            $scope.cancel = () => {
                $window.history.back();
                return false;
            };
        }
    });