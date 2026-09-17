import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

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

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-card-image';
        cardBox.append(div);
      } else {
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
          }
        });

        cardBox.append(div);
      }
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
