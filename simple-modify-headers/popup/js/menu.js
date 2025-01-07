let started = "off";
let tab_started = "off";

window.onload = function() {
  document.getElementById('config').addEventListener('click', function(e) {start_config();});

  loadFromBrowserStorage(['started', 'config', 'active_headers_groups'], function(result) {
    started = result.started;

    const start_stop      = document.getElementById('start_stop');
    const start_stop_tab  = document.getElementById('start_stop_tab');
    const select_rule_set = document.getElementById('select_rule_set');

    if (started === "on") {
      start_stop.value = "Stop";

      start_stop_tab.parentElement.style.display = 'none'
      start_stop.parentElement.setAttribute('colspan', '2')
    }
    else {
      chrome.runtime.sendMessage({action: 'is-tab-on'}, function(response) {
        if (response === true) {
          tab_started = "on";
          start_stop_tab.value = "Stop Tab";
        }
      });
    }

    start_stop.addEventListener('click', function(e) {start_modify();});
    start_stop_tab.addEventListener('click', function(e) {start_tab_modify();});

    try {
      if (!result.config) throw 0

      const config = JSON.parse(result.config)
      if (!config || !config.headers) throw 0

      for (let name in config.headers)
        appendRuleSet(select_rule_set, name)

      let active_headers_groups
      try {
        active_headers_groups = JSON.parse(result.active_headers_groups)
      }
      catch(e) {
        active_headers_groups = ['default']
      }
      setSelectedValues(select_rule_set, active_headers_groups)

      select_rule_set.addEventListener(
        'change',
        function (e) {setChangeRuleSetTimer()}
      )
    }
    catch(e) {
      select_rule_set.style.display = 'none';
    }
  });
}

function start_modify() {
  const start_stop     = document.getElementById('start_stop');
  const start_stop_tab = document.getElementById('start_stop_tab');

  if (started === "off") {
    storeInBrowserStorage({started: 'on'}, function() {
      chrome.runtime.sendMessage({action: 'on'});
      started = "on";
      start_stop.value = "Stop";

      start_stop_tab.parentElement.style.display = 'none'
      start_stop.parentElement.setAttribute('colspan', '2')

      // if exists reload config tab , to get the start/stop information correct
      chrome.tabs.query({currentWindow: true}, reloadConfigTab);
    });
  }
  else {
    storeInBrowserStorage({started: 'off'}, function() {
      chrome.runtime.sendMessage({action: 'off'});
      started = "off";
      start_stop.value = "Start";

      start_stop.parentElement.setAttribute('colspan', '1')
      start_stop_tab.parentElement.style.display = 'table-cell'

      // if exists reload config tab , to get the start/stop information correct
      chrome.tabs.query({currentWindow: true}, reloadConfigTab);
    });
  }
}

function start_tab_modify() {
  const start_stop_tab = document.getElementById('start_stop_tab');

  if (tab_started === "off") {
    chrome.runtime.sendMessage({action: 'tab-on'}, function(response) {
      if (response !== true) return

      tab_started = "on";
      start_stop_tab.value = "Stop Tab";
    });
  }
  else {
    chrome.runtime.sendMessage({action: 'tab-off'}, function(response) {
      if (response !== true) return

      tab_started = "off";
      start_stop_tab.value = "Start Tab";
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

let changeRuleSetTimer = 0

// debounce within a 5 second period
function setChangeRuleSetTimer() {
  if (changeRuleSetTimer)
    clearTimeout(changeRuleSetTimer)

  changeRuleSetTimer = setTimeout(
    function() {
      changeRuleSetTimer = 0
      changeRuleSet()
    },
    500
  )
}

function changeRuleSet() {
  const active_headers_groups = getSelectedValues(document.getElementById('select_rule_set'))

  storeInBrowserStorage({ active_headers_groups: JSON.stringify(active_headers_groups) }, function() {
    chrome.runtime.sendMessage({action: 'change-groups'})
  })
}

window.onbeforeunload = function(e) {
  if (changeRuleSetTimer) {
    e.preventDefault()
    e.returnValue = true
    return 'Saving changes. Please wait one second.'
  }
}

// -------------------------------------
// multiple HTMLSelectElement

function getSelectedValues(el) {
  return [...el.selectedOptions].map(el => el.value)
}

function setSelectedValues(el, vals) {
  clearSelectedValues(el)

  for (let option of el.options) {
    if (!option.disabled && vals.includes(option.value)) {
      option.selected = true
    }
  }
}

function clearSelectedValues(el) {
  el.selectedIndex = -1
}
