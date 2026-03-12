// Theme management
const THEMES = ['obsidian','light','breeze','candy']
const THEME_LABELS = { obsidian:'Obsidian', light:'Light', breeze:'Breeze', candy:'Candy' }

function getTheme() { return localStorage.getItem('kp_theme') || 'obsidian' }
function setTheme(theme) {
  localStorage.setItem('kp_theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  document.querySelectorAll('.theme-dot').forEach(d => d.classList.toggle('active', d.dataset.t === theme))
}
function applyTheme() { setTheme(getTheme()) }

function renderThemeSwitcher(containerId) {
  const el = document.getElementById(containerId)
  if (!el) return
  el.innerHTML = '<div class="theme-bar">' +
    THEMES.map(t => `<div class="theme-dot${getTheme()===t?' active':''}" data-t="${t}" onclick="setTheme('${t}')" title="${THEME_LABELS[t]}"></div>`).join('') +
    '</div>'
}

// Apply on load
document.addEventListener('DOMContentLoaded', applyTheme)
