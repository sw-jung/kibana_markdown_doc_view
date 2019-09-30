import {management} from 'ui/management';
import '../libs/markdown_templates';
import './list';
import './editor';

management.getSection('kibana').register('markdown_template', {
    display: 'Markdown Templates',
    order: 40,
    url: '#/management/kibana/markdown_template/'
});