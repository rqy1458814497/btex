import { Context } from '../Context';
import { ContainerElement, RenderOptions } from '../Element';
import { Token } from '../Token';
import { LabelElement } from './LabelElement';
import { ParagraphElement } from './ParagraphElement';
import { SpanElement, SpanStyle } from './SpanElement';

export class ReferenceElement implements ContainerElement {
  name: 'ref' = 'ref';
  page?: string;
  key?: string;
  url?: string;
  pageSuffix?: string;
  inferPage?: boolean;
  noLink: boolean = false;
  isInline: boolean = true;
  paragraph: ParagraphElement = new ParagraphElement();
  target?: LabelElement;
  style: SpanStyle = {};
  spacingType?: {
    first: string;
    last: string;
  };

  isEmpty(): boolean {
    return false;
  }

  normalise() {
    if (this.paragraph.isEmpty()) this.spacingType = { first: 'letter', last: 'letter' };
    else this.spacingType = this.paragraph.normalise();

    if (this.page) {
      this.page = this.page.normalize('NFC');
    }
  }

  enter(context: Context) {
    this.style.italic = context.getBoolean('text-italic', false) || undefined;
    this.style.bold = context.getBoolean('text-bold', false) || undefined;
    this.style.fontSize = context.getFloat('text-size', 0) || undefined;

    this.style.classes = '';
    if (context.getBoolean('text-class-header', false)) this.style.classes += ' item-header';
    this.style.classes = this.style.classes.trim();

    this.page = context.get('ref-page', true);
    this.key = context.get('ref-key', true);
    this.url = context.get('ref-url', true);
    this.pageSuffix = context.get('ref-page-suffix', true);
    this.inferPage = context.getBoolean('ref-infer-page', false, true);
    this.noLink = context.getBoolean('ref-no-link', false, true);

    if (this.url && /^https?:\/\/\w/.test(this.url)) {
      context.externalLinks.push(this.url);
    } else {
      delete this.url;
    }
  }

  exit(context: Context) {
    context.references.push(this);
  }

  event(name: string, context: Context, initiator: Token) {
    context.throw('UNKNOWN_EVENT', initiator, name);
    return false;
  }

  render(options?: RenderOptions): Node[] {
    let span = document.createElement('span');
    let styles = [];
    if (this.style) {
      if (this.style.italic) styles.push('font-style:italic');
      if (this.style.bold) styles.push('font-weight:bold');
      if (this.style.fontSize && isFinite(this.style.fontSize)) {
        let fontSize = this.style.fontSize;
        if (fontSize < SpanElement.minFontSize) fontSize = SpanElement.minFontSize;
        if (fontSize > SpanElement.maxFontSize) fontSize = SpanElement.maxFontSize;
        styles.push(`font-size:${fontSize}px`);
      }
      if (styles.length > 0) span.setAttribute('style', styles.join(';'));
    }

    if (this.target) {
      let nodes = this.target.paragraph.renderInner(options);
      if (this.noLink) return nodes;

      let link = document.createElement('a');
      link.setAttribute('href', '#' + encodeURIComponent(this.target.bookmarkId));
      link.append(...nodes);

      span.append(link);
      return [span];
    }

    if (this.url) {
      let a = document.createElement('a');
      a.classList.add('external');
      a.setAttribute('href', this.url);
      a.append(...this.paragraph.renderInner(options));

      span.append(a);
      return [span];
    }

    let ref = document.createElement('btex-ref');
    span.append(ref);

    if (this.key) ref.setAttribute('data-key', this.key);
    if (this.page) ref.setAttribute('data-page', this.page);

    if (this.inferPage) {
      let tempParagraph = this.paragraph.clone();
      if (this.pageSuffix) {
        let noSpace =
          this.spacingType?.last === 'cjk' &&
          /^[\p{sc=Hang}\p{sc=Hani}\p{sc=Hira}\p{sc=Kana}]/u.test(this.pageSuffix);

        let span = new SpanElement();
        if (!noSpace) span.append(' ');
        span.append(this.pageSuffix);
        tempParagraph.append(span);
      }
      let page = tempParagraph.getText();

      page = page.replace(/_/g, ' ');
      for (let symbol in symbolName)
        page = page.replace(new RegExp(symbol, 'g'), '_' + symbolName[symbol] + '_');
      page = page
        .replace(/\u200b/g, '')
        .replace(/([\w\p{sc=Hani}])_+([\w\p{sc=Hani}])/gu, '$1 $2')
        .replace(/_/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      this.page = page;
    }

    if (this.noLink) {
      return [span];
    } else {
      let isCategory =
        (this.page?.startsWith('分类:') || this.page?.startsWith('Category:')) && this.inferPage;

      let link = document.createElement('btex-link');
      if (this.key) link.setAttribute('data-key', this.key);
      if (this.page) link.setAttribute('data-page', this.page);
      if (isCategory) link.setAttribute('data-is-category', 'True');

      if (this.paragraph.isEmpty()) {
        link.append(span);
      } else if (!isCategory) {
        link.append(...this.paragraph.renderInner(options));
      }
      return [link];
    }
  }
}

const symbolName: { [symbol: string]: string } = {
  Α: 'Alpha',
  Β: 'Beta',
  Γ: 'Gamma',
  Δ: 'Delta',
  Ε: 'Epsilon',
  Ζ: 'Zeta',
  Η: 'Eta',
  Θ: 'Theta',
  Ι: 'Iota',
  Κ: 'Kappa',
  Λ: 'Lambda',
  Μ: 'Mu',
  Ν: 'Nu',
  Ξ: 'Xi',
  Ο: 'Omicron',
  Π: 'Pi',
  Ρ: 'Rho',
  Σ: 'Sigma',
  Τ: 'Tau',
  Υ: 'Upsilon',
  Φ: 'Phi',
  Χ: 'Chi',
  Ψ: 'Psi',
  Ω: 'Omega',
  α: 'alpha',
  β: 'beta',
  γ: 'gamma',
  δ: 'delta',
  ε: 'epsilon',
  ζ: 'zeta',
  η: 'eta',
  θ: 'theta',
  ι: 'iota',
  κ: 'kappa',
  λ: 'lambda',
  μ: 'mu',
  ν: 'nu',
  ξ: 'xi',
  ο: 'omicron',
  π: 'pi',
  ρ: 'rho',
  σ: 'sigma',
  τ: 'tau',
  υ: 'upsilon',
  φ: 'phi',
  χ: 'chi',
  ψ: 'psi',
  ω: 'omega',
};
