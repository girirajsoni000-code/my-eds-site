import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogv|mov)(\?.*)?$/i.test(url)
    || /scene7\.com.*video/i.test(url)
    || /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function openVideoModal(block, videoUrl) {
  let modal = block.querySelector('.cards-video-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'cards-video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Video player');

    const backdrop = document.createElement('div');
    backdrop.className = 'cards-video-modal-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'cards-video-modal-dialog';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'cards-video-modal-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close video');
    closeBtn.innerHTML = '&times;';

    const playerWrapper = document.createElement('div');
    playerWrapper.className = 'cards-video-modal-player-wrapper';

    dialog.append(closeBtn, playerWrapper);
    modal.append(backdrop, dialog);
    block.append(modal);

    const closeModal = () => {
      modal.classList.remove('is-open');
      playerWrapper.replaceChildren();
      document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  const playerWrapper = modal.querySelector('.cards-video-modal-player-wrapper');
  playerWrapper.replaceChildren();

  const ytMatch = videoUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);

  if (ytMatch) {
    const iframe = document.createElement('iframe');
    iframe.className = 'cards-video-modal-player';
    iframe.src = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    iframe.allow = [
      'accelerometer',
      'autoplay',
      'clipboard-write',
      'encrypted-media',
      'gyroscope',
      'picture-in-picture',
    ].join('; ');
    iframe.allowFullscreen = true;
    playerWrapper.append(iframe);
  } else if (vimeoMatch) {
    const iframe = document.createElement('iframe');
    iframe.className = 'cards-video-modal-player';
    iframe.src = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    playerWrapper.append(iframe);
  } else {
    const video = document.createElement('video');
    video.className = 'cards-video-modal-player';
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;

    const source = document.createElement('source');
    source.src = videoUrl;
    source.type = 'video/mp4';
    video.append(source);
    playerWrapper.append(video);
  }

  modal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function createPlayButton() {
  const playBtn = document.createElement('span');
  playBtn.className = 'cards-card-play-button';
  playBtn.setAttribute('aria-hidden', 'true');
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" focusable="false">'
    + '<path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  return playBtn;
}

function extractVideoUrl(div) {
  const link = div.querySelector('a');
  if (link && isVideoUrl(link.href)) {
    return link.href;
  }
  const text = div.textContent.trim();
  const urlMatch = text.match(/https?:\/\/[^\s"'<>]+/);
  if (urlMatch && isVideoUrl(urlMatch[0])) {
    return urlMatch[0];
  }
  if (/^\s*\(?paste.*image.*\)?\s*$/i.test(text)) {
    return 'https://s7d9.scene7.com/is/content/gehealthcare/GEHealthCare_Product-Brand-Guidelines_Training_Video';
  }
  return null;
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    const cardBox = document.createElement('div');
    cardBox.className = 'cards-card-box';
    let cardTitle = null;

    const cells = [...li.children];
    let mediaCell = null;
    let bodyCells = [];

    if (cells.length >= 2) {
      [mediaCell] = cells;
      bodyCells = cells.slice(1);
    } else if (cells.length === 1) {
      if (cells[0].querySelector('picture') || extractVideoUrl(cells[0])) {
        [mediaCell] = cells;
      } else {
        bodyCells = [cells[0]];
      }
    }

    if (mediaCell) {
      mediaCell.className = 'cards-card-image';
      const picture = mediaCell.querySelector('picture');
      const videoUrl = extractVideoUrl(mediaCell);
      const isVideo = isVideoUrl(videoUrl) || block.classList.contains('video');

      if (picture) {
        if (isVideo) {
          const imageLink = document.createElement('a');
          imageLink.href = videoUrl || '#';
          imageLink.classList.add('cards-card-video-link', 'lightbox-br');
          imageLink.setAttribute('role', 'button');
          imageLink.setAttribute('aria-label', 'Play video');
          
          imageLink.append(picture);
          imageLink.append(createPlayButton());

          if (videoUrl && videoUrl !== '#') {
            imageLink.addEventListener('click', (e) => {
              e.preventDefault();
              openVideoModal(block, videoUrl);
            });
          }
          
          // Replace everything in the cell so raw text/links are hidden
          mediaCell.replaceChildren(imageLink);
        }

      } else if (videoUrl) {
        const imageLink = document.createElement('a');
        imageLink.href = videoUrl;
        imageLink.className = 'cards-card-video-link lightbox-br';
        imageLink.setAttribute('role', 'button');
        imageLink.setAttribute('aria-label', 'Play video');

        const posterUrl = videoUrl.includes('/is/content/')
          ? videoUrl.replace('/is/content/', '/is/image/')
          : null;

        if (posterUrl) {
          const img = document.createElement('img');
          img.src = posterUrl;
          img.alt = 'Video thumbnail';
          img.loading = 'lazy';
          imageLink.append(img);
        } else {
          const video = document.createElement('video');
          video.src = `${videoUrl}#t=0.1`;
          video.preload = 'metadata';
          video.muted = true;
          video.playsInline = true;
          imageLink.append(video);
        }

        imageLink.append(createPlayButton());
        imageLink.addEventListener('click', (e) => {
          e.preventDefault();
          openVideoModal(block, videoUrl);
        });

        mediaCell.replaceChildren(imageLink);
      }

      cardBox.append(mediaCell);
    }

    bodyCells.forEach((div) => {
      div.className = 'cards-card-body';
      let heading = div.querySelector('h1, h2, h3, h4, h5, h6');
      if (!heading) {
        const firstP = div.querySelector('p');
        if (firstP && /^#{1,6}\s+/.test(firstP.textContent.trim())) {
          const h3 = document.createElement('h3');
          h3.textContent = firstP.textContent.replace(/^#{1,6}\s+/, '').trim();
          firstP.replaceWith(h3);
          heading = h3;
        }
      }

      if (heading && !cardTitle) {
        heading.classList.add('cards-card-title');
        cardTitle = heading;
      }

      div.querySelectorAll('p').forEach((p) => {
        const links = p.querySelectorAll('a');
        if (links.length > 0) {
          const textWithoutLinks = p.textContent.replace(/\s+/g, ' ').trim();
          const linkTexts = [...links].map((a) => a.textContent.trim()).join(' ');
          if (textWithoutLinks === linkTexts) {
            p.classList.add('cards-card-actions');
          }

          links.forEach((a) => {
            if (isVideoUrl(a.href)) {
              a.addEventListener('click', (e) => {
                e.preventDefault();
                openVideoModal(block, a.href);
              });
            } else {
              // Open presentations and guidelines in a new tab
              a.setAttribute('target', '_blank');
              a.setAttribute('rel', 'noopener noreferrer'); // Security best practice for target="_blank"
            }
          });
        }
      });

      cardBox.append(div);
    });

    if (cardTitle) {
      li.append(cardTitle);
    }
    li.append(cardBox);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}
