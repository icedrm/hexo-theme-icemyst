const urlFor = require("hexo-util").url_for.bind(hexo);
function link(args) {
  args = args.join(" ").split(",");
  let title = args[0];
  let text = args[1];
  let link = args[2];
  let imgUrl = args[3] || "";
  let InsideStation = false;

  link = link.trim();
  imgUrl = imgUrl.trim();

  // 获取网页favicon
  if (!imgUrl) {
    let urlNoProtocol = link.replace(/^https?\:\/\//i, "");
    imgUrl = "https://api.iowen.cn/favicon/" + urlNoProtocol + ".png";
  }

  if (imgUrl == "true") {
    InsideStation = true;
  }

  return `<div class='tag link'><a class="link-card" target="_blank" href="${urlFor(link)}">
    <div class="tips">${InsideStation ? "站内地址" : "引用站外地址"}</div>
    <div class="link-group">
        <div class="left" style="background-image: url(${InsideStation ? "/img/siteicon/android-chrome-512x512.png" : imgUrl});"></div>
        <div class="right">
            <div class="title">${title}</div>
            <div class="text">${text}</div>
        </div>
        <i class="fas fa-angle-right"></i>
    </div>
    </a></div>`;
}

hexo.extend.tag.register("link", link, { ends: false });