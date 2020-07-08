import {uiModules} from 'ui/modules';
import {SavedObjectsClientProvider} from 'ui/saved_objects';
import {MarkdownTemplate} from '../libs/markdown_template';

export function MarkdownTemplatesProvider(kbnIndex, $http, Private) {
    const self = this;
    const type = 'markdown_template';
    const savedObjectsClient = Private(SavedObjectsClientProvider);
    const cache = {};

    self.list = queryString => {
        console.log(queryString);
        return savedObjectsClient.find({
            type: type,
            fields: [],
            perPage: 1000
        }).then(resp => resp.savedObjects);
    };

    self.get = id => {
        return Promise.resolve(cache[id] || savedObjectsClient.get(type, id)
            .then(({attributes}) => {
                const {template, options} = attributes;
                cache[id] = new MarkdownTemplate(template, options);
                return cache[id];
            }));
    };

    self.save = (id, docTemplate) => {
        return savedObjectsClient.create(type, docTemplate, {
            id,
            overwrite: true
        })
            .then(() => delete cache[id]);
    };

    self.delete = ids => {
        return Promise.all([].concat(ids)
            .map(id => {
                return savedObjectsClient.delete(type, id)
                    .then(() => delete cache[id]);
            }));
    };
}

uiModules.get('markdown_doc_view', [])
    .service('markdownTemplates', MarkdownTemplatesProvider);