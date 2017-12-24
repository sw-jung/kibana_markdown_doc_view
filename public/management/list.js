import { chain, upperFirst, camelCase, remove, pick, attempt, isArray, find } from 'lodash';
import Promise from 'bluebird';
import angular from 'angular';
import { saveAs } from '@elastic/filesaver';
import uiRoutes from 'ui/routes';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import template from './list.html';

uiRoutes
.when('/management/kibana/markdown_template', {
  template,
  controller: ($scope, $route, courier, markdownTemplates, confirmModal, esAdmin, kbnIndex, Notifier, Private) => {
    const notify = new Notifier({ location: 'Markdown Templates' });
    const savedObjectsClient = Private(SavedObjectsClientProvider);
    $scope.list = [];
    $scope.templates = [];
    $scope.selectedItems = [];
    $scope.listOrder = '+_id';

    $scope.getData = () => {
      return Promise.all([
        savedObjectsClient.find({
          type: 'index-pattern',
          fields: [],
          perPage: 10000
        })
        .then(resp => resp.savedObjects),
        markdownTemplates.list()
      ])
      .then(([indexPatterns, templates]) => {
        $scope.list = chain(indexPatterns)
        .map(indexPattern => ({
          _id: indexPattern.attributes.title,
          _type: 'index-pattern',
          indexPatternId: indexPattern.id
        }))
        .concat(templates)
        .reduce((map, hit) => {
          const { _id, _type, _source, indexPatternId } = hit;
          const item = map[_id] || (map[_id] = { _id });
          item[`has${upperFirst(camelCase(_type))}`] = true;
          if (_type === 'index-pattern') {
            item.indexPatternId = indexPatternId;
          } else if (_type === 'markdown_template') {
            item._type = _type;
            item._source = _source;
          }
          return map;
        }, {})
        .values()
        .map(item => {
          item.status = (() => {
            if (!item.hasIndexPattern) return 'error';
            if (!item.hasMarkdownTemplate) return 'warning';
            else return 'success';
          })();
          return item;
        })
        .value();

        $scope.templates = $scope.list.filter(item => item.hasMarkdownTemplate);
      })
      .then(() => $scope.$apply());
    };

    $scope.changeOrder = key => {
      const [direction, field] = $scope.listOrder.match(/^([\+\-])?(.+)$/).slice(1);
      if (field !== key) $scope.listOrder = `+${key}`;
      else $scope.listOrder = `${direction === '-' ? '+' : '-'}${key}`;
    };

    $scope.areAllRowsChecked = () => {
      if ($scope.list.length === 0) {
        return false;
      }

      return $scope.selectedItems.length === $scope.templates.length;
    };

    $scope.toggleAll = () => {
      if ($scope.selectedItems.length === $scope.templates.length) {
        $scope.selectedItems.length = 0;
      } else {
        $scope.selectedItems = [].concat($scope.templates);
      }
    };

    $scope.toggleItem = item => {
      if (!remove($scope.selectedItems, item).length) $scope.selectedItems.push(item);
    };

    $scope.delete = () => {
      confirmModal(`Are you sure you want to delete the selected templates? This action is irreversible!`, {
        confirmButtonText: `Delete templates`,
        onConfirm: () => markdownTemplates.delete($scope.selectedItems.map(item => item._id))
        .then($scope.getData)
        .then(() => $scope.selectedItems.length = 0)
        .catch(notify.error)
      });
    };

    $scope.export = (items = []) => {
      if (!items.length) notify.error('No templates to export.');
      const blob = new Blob([
        angular.toJson(items.map(item => pick(item, ['_id', '_type', '_source'])), true)
      ], {
        type: 'application/json'
      });
      saveAs(blob, 'export.json');
    };

    $scope.import = contents => {
      const docs = attempt(() => JSON.parse(contents));

      if (!isArray(docs)) {
        notify.error('Uploaded file format is invalid and cannot be imported.');
        return;
      }

      return new Promise(resolve => {
        confirmModal(
          `If any of the templates already exist, do you want to automatically overwrite them?`, {
            confirmButtonText: `Yes, overwrite all`,
            cancelButtonText: `No, prompt me for each one`,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          }
        );
      })
      .then(overwriteAll => Promise.map(docs, doc => {
        if (doc._type !== 'markdown_template') {
          notify.warning(`Skipped import of template for ${doc._id}, Invalid type: "${doc._type}"`, {
            lifetime: 0,
          });
          return;
        }

        if (overwriteAll || !find($scope.templates, pick(doc, ['_id']))) return doc;

        return new Promise(resolve => {
          confirmModal(
            `Are you sure you want to overwrite ${doc._id}`, {
              confirmButtonText: `Overwrite template`,
              onConfirm: () => resolve(doc),
              onCancel: () => resolve(),
            }
          );
        });
      }))
      .then(docs => Promise.map(docs, doc => {
        if (!doc) return;
        const { _id, _source } = doc;
        return markdownTemplates.save(_id, _source, { refresh: false })
        .catch(e => {
          e.message = `Importing template for ${_id} failed: ${e.message}`;
          notify.error(e);
        });
      }))
      .then($scope.getData)
      .catch(notify.error);
    };
  }
});