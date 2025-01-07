// -------------------------------------
// chrome.storage.local

function loadFromBrowserStorage(item, callback_function) {
  chrome.storage.local.get(item, callback_function)
}

function storeInBrowserStorage(item, callback_function) {
  chrome.storage.local.set(item, callback_function)
}
