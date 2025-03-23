// Firefox only

function onTheme(isDark) {
  const color = isDark ? 'white' : 'black'
  chrome.runtime.sendMessage({action: 'change-default-icon', color})
}

function initTheme() {
  const isPrivate = chrome.extension.inIncognitoContext
  onTheme(isPrivate)
}

function initFirefox() {
  const isFirefox = window.navigator.userAgent.toLowerCase().includes('firefox')
  if (!isFirefox) return

  window.addEventListener('focus', initTheme)
  initTheme()  
}

initFirefox()
