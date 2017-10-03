import { defaults, extend, isEmpty } from 'lodash';
import { sanitizeMarkdown } from './sanitize_markdown';
import { compileTemplate } from './compile_template';
import { getRenderer } from './markdown_renderer';
import uuid from 'uuid';
import less from 'less/lib/less-browser';

const lessC = less(window, {
  env: 'production'
});

export class MarkdownTemplate {
  constructor(template = '', options = {}) {
    this.set(template, options);
  }

  set(template = '', options = {}) {
    this.source = template;
    this.options = defaults(options, {
      linkify: true,
      breaks: true,
      style: ''
    });
    this.template = compileTemplate(sanitizeMarkdown(template, {
      allowedTags: sanitizeMarkdown.defaults.allowedTags.concat([ 'div', 'span', 'mark' ]),
      allowedAttributes: extend(sanitizeMarkdown.defaults.allowedAttributes, {
        '*': [ 'class', 'style' ]
      })
    }));
    this.class = `markdown-${uuid.v4()}`;
    lessC.render(`.${this.class} { ${this.options.style} }`, { compress: true }, (e, output) => {
      if (e) console.warn(e);
      if (output) this.css = output.css;
    });
    this.renderer = getRenderer(options);
  }

  render(vars = {}) {
    return `
      <style type="text/css">${this.css || ''}</style>
      <div class="markdown-doc-view ${this.class}">
      ${this.renderer.render(this.template(vars))}
      </div>
    `;
  }

  isEmpty() {
    return isEmpty(this.source);
  }

  toString() {
    return this.source;
  }

  toJSON() {
    return {
      template: this.source,
      options: this.options
    };
  }
}
