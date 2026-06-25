import { decorateIcons } from '../../scripts/aem.js';

export default async function decorate(block) {
  const slider = document.createElement('div');
  slider.className = 'slider';

  let prevBtn;
  let nextBtn;

  [...block.children].forEach((row) => {
    const text = row.textContent.trim();
    if (text === '>>' || text === 'next') {
      nextBtn = document.createElement('button');
      nextBtn.className = 'carousel-btn next';
      nextBtn.innerHTML = `<span class="icon custom-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>`;
      nextBtn.setAttribute('aria-label', 'Next slide');
      nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });
      });
    } else if (text === '<<' || text === 'prev') {
      prevBtn = document.createElement('button');
      prevBtn.className = 'carousel-btn prev';
      prevBtn.innerHTML = `<span class="icon custom-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </span>`;
      prevBtn.setAttribute('aria-label', 'Previous slide');
      prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -slider.clientWidth, behavior: 'smooth' });
      });
    } else {
      row.className = 'slide';
      slider.append(row);
    }
  });

  block.innerHTML = '';
  
  const carouselWrapper = document.createElement('div');
  carouselWrapper.className = 'carousel-wrapper';
  
  if (prevBtn) carouselWrapper.append(prevBtn);
  carouselWrapper.append(slider);
  if (nextBtn) carouselWrapper.append(nextBtn);
  
  block.append(carouselWrapper);
  
  await decorateIcons(block);
}