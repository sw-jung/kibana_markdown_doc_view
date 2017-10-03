import { extend, pick } from 'lodash';
import MarkdownIt from 'markdown-it';
import { getLanguage, highlight } from 'highlight.js';
import 'highlight.js/styles/vs2015.css';

const AVAILABLE_OPTIONS = ['linkify', 'breaks'];

const FIXED_OPTIONS = {
  html: true,
  langPrefix: 'hljs ',
  highlight: function (str, lang) {
    if (lang && getLanguage(lang)) {
      try {
        return highlight(lang, str).value;
      } catch (e) {
        console.warn('Failed to syntax highlighting.', e);
      }
    }

    return '';
  }
};

export function getRenderer(options) {
  const md = new MarkdownIt(extend({}, pick(options, AVAILABLE_OPTIONS), FIXED_OPTIONS))
  .use(require('markdown-it-abbr'))
  .use(require('markdown-it-deflist'))
  .use(require('markdown-it-footnote'))
  .use(require('markdown-it-ins'))
  .use(require('markdown-it-mark'))
  .use(require('markdown-it-sub'))
  .use(require('markdown-it-sup'));

  md.renderer.rules.table_open = () => '<table class="table">';

  return md;
}