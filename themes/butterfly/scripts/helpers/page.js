'use strict';

const { stripHTML, escapeHTML, prettyUrls } = require('hexo-util');
const crypto = require('crypto');

// 注册页面描述生成器
hexo.extend.helper.register('page_description', function () {
  const { config, page } = this;
  const description = escapeHTML(stripHTML(page.description || page.content || page.title || config.description || '')
    .substring(0, 150).trim()).replace(/\n/g, ' ');

  return description;
});

// 注册标签云生成器
hexo.extend.helper.register('cloudTags', function ({
  source,
  fontsize = 1, // 默认字体大小
  limit = 0,
  unit = 'px',
  orderby = 'name',
  order = 1
} = {}) {
  const env = this;
  let result = '';

  if (limit > 0) {
    source = source.limit(limit);
  }

  source.sort(orderby, order).forEach(tag => {
    const style = `font-size: ${fontsize}${unit}; color: rgb(${Math.floor(Math.random() * 201)}, ${Math.floor(Math.random() * 201)}, ${Math.floor(Math.random() * 201)});`;
    result += `<a href="${env.url_for(tag.path)}" style="${style}"><span class='icon'># </span>${tag.name}<sup class='tag_num' style="font-style:italic;">${tag.length}</sup></a>`;
  });

  return result;
});

// 注册无索引的URL生成器
hexo.extend.helper.register('urlNoIndex', function (url = null, trailingIndex = false, trailingHtml = false) {
  return prettyUrls(url || this.url, { trailing_index: trailingIndex, trailing_html: trailingHtml });
});

// 注册MD5生成器
hexo.extend.helper.register('md5', function (path) {
  return crypto.createHash('md5').update(decodeURI(this.url_for(path))).digest('hex');
});

// 注册HTML注入器
hexo.extend.helper.register('injectHtml', function (data) {
  return data ? data.join('') : '';
});

// 注册归档标题查找器
hexo.extend.helper.register('findArchivesTitle', function (page, menu, date) {
  if (page.year) {
    const dateStr = `${page.year}${page.month ? `-${page.month}` : ''}`;
    const dateFormat = page.month ? hexo.theme.config.aside.card_archives.format : 'YYYY';
    return date(dateStr, dateFormat);
  }

  const defaultTitle = this._p('page.archives');
  const loop = (m) => {
    for (const key in m) {
      if (typeof m[key] === 'object') {
        const foundTitle = loop(m[key]);
        if (foundTitle) return foundTitle;
      } else if (/\/archives\//.test(m[key])) {
        return key;
      }
    }
  };

  return loop(menu) || defaultTitle;
});

// 注册图片或URL检测器
hexo.extend.helper.register('isImgOrUrl', function (path) {
  const imgTestReg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i;
  return path.includes('//') || imgTestReg.test(path);
});
