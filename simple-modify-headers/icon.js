function onTheme(isDark) {
  const color = isDark ? 'white' : 'black'
  chrome.runtime.sendMessage({action: 'change-default-icon', color})
}

function initTheme() {
  const isFirefox = window.navigator.userAgent.toLowerCase().includes('firefox')
  const isPrivate = chrome.extension.inIncognitoContext

  if (isFirefox && isPrivate) {
    onTheme(true)
  }
  else if (window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    onTheme(prefersDark && prefersDark.matches)
  }
}

window.addEventListener('focus', initTheme)
initTheme()
