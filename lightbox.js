function openLightbox(src) {
  let lb = document.getElementById('lightbox')
  if (!lb) {
    lb = document.createElement('div')
    lb.id = 'lightbox'
    lb.className = 'lightbox'
    lb.innerHTML = '<button class="lightbox-close" onclick="closeLightbox()">✕</button><img id="lb-img" src="">'
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox() })
    document.body.appendChild(lb)
  }
  document.getElementById('lb-img').src = src
  lb.classList.add('open')
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  const lb = document.getElementById('lightbox')
  if (lb) { lb.classList.remove('open'); document.body.style.overflow = '' }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox() })
