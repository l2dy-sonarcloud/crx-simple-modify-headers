let started = "off";

window.onload = function() {
  document.getElementById('config').addEventListener('click', function(e) {start_config();});

  loadFromBrowserStorage(['started', 'config', 'active_headers_group'], function(result) {
    started = result.started;

    const start_stop      = document.getElementById('start_stop');
    const select_rule_set = document.getElementById('select_rule_set')

    if (started === "on")
      start_stop.value = "Stop";

    start_stop.addEventListener('click', function(e) {start_modify();});

    try {
      if (!result.config) throw 0

      const config = JSON.parse(result.config)
      if (!config || !config.headers) throw 0

      for (let name in config.headers)
        appendRuleSet(select_rule_set, name)

      select_rule_set.value = result.active_headers_group || 'default'

      select_rule_set.addEventListener(
        'change',
        function (e) {changeRuleSet()}
      )
    }
    catch(e) {
      select_rule_set.style.display = 'none';
    }
  });
}

function loadFromBrowserStorage(item,callback_function) {
  chrome.storage.local.get(item, callback_function);
}

function storeInBrowserStorage(item,callback_function)  {
  chrome.storage.local.set(item,callback_function);
}

function start_modify() {
  if (started === "off") {
    storeInBrowserStorage({started: 'on'}, function() {
      chrome.runtime.sendMessage({action: 'on'});
      started = "on";
      document.getElementById("start_stop").value = "Stop";
      // if exists reload config tab , to get the start/stop information correct
      chrome.tabs.query({currentWindow: true}, reloadConfigTab);
    });
  }
  else {
    storeInBrowserStorage({started: 'off'}, function() {
      chrome.runtime.sendMessage({action: 'off'});
      started = "off";
      document.getElementById("start_stop").value = "Start";
      // if exists reload config tab , to get the start/stop information correct
      chrome.tabs.query({currentWindow: true}, reloadConfigTab);
    });
  }
}
	
function reloadConfigTab(tabs)  {
  let config_tab;
  // search for config tab
  for (let tab of tabs)  {
    if (tab.url.startsWith(chrome.extension.getURL(""))) config_tab = tab;
  }
  // config tab exists , reload it
  if (config_tab) chrome.tabs.reload(config_tab.id);
}

function start_config()  {
  chrome.tabs.query({currentWindow: true}, loadConfigTab);
  }
		
function loadConfigTab(tabs)  {
  let config_tab;
  // search for config tab
  for (let tab of tabs)  {
    if (tab.url.startsWith(chrome.extension.getURL(""))) config_tab = tab;
  }
  // config tab exits , put the focus on it
  if (config_tab) chrome.tabs.update(config_tab.id, {active:true})
  // else create a new tab
  else chrome.tabs.create({url:"/popup/config.html"});
}

function appendRuleSet(select_rule_set, name) {
  const option = document.createElement('option')
  option.value = name
  option.textContent = name

  select_rule_set.appendChild(option)
}

function changeRuleSet() {
  const active_headers_group = document.getElementById('select_rule_set').value

  storeInBrowserStorage({active_headers_group}, function() {
    chrome.runtime.sendMessage({action: 'change-group'})
  })
}
