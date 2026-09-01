import { createOptimizedPicture } from '../../scripts/aem.js';

const getVideoEmbed = (urlString) => {
  const url = new URL(urlString);
  const hostname = url.hostname.toLowerCase();

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const usp = new URLSearchParams(url.search);
    const ytId = usp.get('v') || url.pathname.split('/').filter(Boolean).pop();

    if (!ytId) return null;

    return `
      <div class="imagevideo-embed">
        <iframe
          src="https://www.youtube.com/embed/${ytId}?rel=0"
          title="Video from YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
    `;
  }

  if (hostname.includes('vimeo.com')) {
    const vimeoId = url.pathname.split('/').filter(Boolean).pop();

    if (!vimeoId) return null;

    return `
      <div class="imagevideo-embed">
        <iframe
          src="https://player.vimeo.com/video/${vimeoId}"
          title="Video from Vimeo"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
    `;
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url.pathname)) {
    return `
      <div class="imagevideo-embed">
        <video controls playsinline preload="metadata">
          <source src="${url.href}" type="video/${url.pathname.split('.').pop().toLowerCase()}">
        </video>
      </div>
    `;
  }

  return `
    <div class="imagevideo-embed">
      <iframe
        src="${url.href}"
        title="Embedded video"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>
  `;
};

const getContentCell = (block, finder) => {
  const candidates = [...block.children].flatMap((row) => [...row.children]);
  return candidates.find((cell) => finder(cell)) || candidates[0] || block;
};

const enhanceImage = (cell) => {
  const img = cell.querySelector('img');
  if (!img) return cell;

  const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '1200' }]);
  img.replaceWith(optimized);
  return cell;
};

export default function decorate(block) {
  block.classList.add('imagevideo');

  const imageCell = getContentCell(block, (cell) => cell.querySelector('picture, img')) || block;
  const videoCell = getContentCell(block, (cell) => {
    const quickLink = cell.querySelector('a[href]');
    const iframe = cell.querySelector('iframe');
    const video = cell.querySelector('video');
    return Boolean(quickLink || iframe || video);
  }) || block;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'imagevideo__image';
  const videoWrap = document.createElement('div');
  videoWrap.className = 'imagevideo__video';

  if (imageCell && imageCell !== videoCell) {
    enhanceImage(imageCell);
    imageWrap.append(imageCell.cloneNode(true));
  }

  if (videoCell) {
    const videoLink = videoCell.querySelector('a[href]') || videoCell.querySelector('iframe') || videoCell.querySelector('video');
    if (videoLink) {
      let embedHtml = '';

      if (videoLink instanceof HTMLIFrameElement) {
        embedHtml = `<div class="imagevideo-embed"><iframe src="${videoLink.src}" title="Embedded video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
      } else if (videoLink instanceof HTMLVideoElement) {
        const videoSource = videoLink.currentSrc || videoLink.querySelector('source')?.src || '';
        const videoType = videoSource.split('.').pop().toLowerCase();
        embedHtml = `<div class="imagevideo-embed"><video controls playsinline preload="metadata"><source src="${videoSource}" type="video/${videoType}"></video></div>`;
      } else {
        embedHtml = getVideoEmbed(videoLink.href);
      }

      videoWrap.innerHTML = embedHtml || '<div class="imagevideo-embed"></div>';
    } else {
      const directUrl = videoCell.textContent.trim();
      if (directUrl) {
        videoWrap.innerHTML = getVideoEmbed(directUrl) || '';
      }
    }
  }

  const layout = document.createElement('div');
  layout.className = 'imagevideo__layout';
  layout.append(imageWrap, videoWrap);
  block.replaceChildren(layout);
}
