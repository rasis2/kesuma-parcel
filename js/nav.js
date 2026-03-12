// Standard nav renderer for inner pages
function renderNav(titleKey, showTheme) {
  const nav = document.getElementById('mainNav')
  if (!nav) return
  nav.innerHTML = `
    <a href="index.html" class="nav-back" id="txt-back"></a>
    <span class="nav-title" id="txt-nav-title"></span>
    <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
      <div id="themeSwitcher"></div>
      <div style="width:1px;height:14px;background:var(--border)"></div>
      <div id="langSwitcher" style="display:flex;gap:5px"></div>
    </div>`
  document.getElementById('txt-back').textContent = t('back')
  document.getElementById('txt-nav-title').textContent = t(titleKey)
  renderThemeSwitcher('themeSwitcher')
  renderLangSwitcher('langSwitcher')
}
