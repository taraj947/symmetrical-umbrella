import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      // an image-only cell becomes the background, everything else is content
      if (cell.querySelector('picture') && !cell.textContent.trim()) {
        cell.classList.add('hero-teaser-background');
      } else {
        cell.classList.add('hero-teaser-content');
      }
    });
  });

  // image authored in the same cell as the text: move it into its own layer
  if (!block.querySelector('.hero-teaser-background')) {
    const picture = block.querySelector('.hero-teaser-content picture');
    if (picture) {
      const background = document.createElement('div');
      background.classList.add('hero-teaser-background');
      background.append(picture);
      block.prepend(background);
      block.querySelectorAll('p:empty').forEach((p) => p.remove());
    }
  }

  block.querySelectorAll('.hero-teaser-background img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, true, [{ width: '2000' }]),
    );
  });
}
