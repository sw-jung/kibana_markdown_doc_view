import {defaultsDeep} from 'lodash';
import {uiModules} from 'ui/modules';
import SimpleMDE from 'simplemde';
import 'simplemde/dist/simplemde.min.css';

uiModules.get('markdown_doc_view', [])
    .directive('markdownEditor', $parse => {
        return {
            restrict: 'A',
            require: 'ngModel',
            link(scope, elems, attrs, ngModel) {
                const options = $parse(attrs.markdownEditor)(scope) || {};
                const editor = new SimpleMDE(defaultsDeep(options, {
                    blockStyles: {
                        italic: '_'
                    },
                    element: elems[0],
                    indentWithTabs: false,
                    spellChecker: false,
                    toolbar: ['bold', 'italic', 'strikethrough', 'heading',
                        '|', 'quote', 'unordered-list', 'ordered-list',
                        '|', 'link', 'image', 'table',
                        '|', 'preview', 'side-by-side', 'fullscreen',
                        '|', 'guide']
                }));

                editor.codemirror.on('change', () => {
                    scope.$applyAsync(() => {
                        ngModel.$setViewValue(editor.value());
                    });
                });

                ngModel.$render = () => {
                    editor.value(ngModel.$modelValue || options.default);
                };
                scope.$emit('markdownEditor:init', editor);
            }
        };
    });