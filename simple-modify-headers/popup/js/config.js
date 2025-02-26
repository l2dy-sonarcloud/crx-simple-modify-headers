let config
let started
let active_headers_group
let active_headers
let line_number

const is_edited = {}

window.onload = function() {
  initConfigurationPage()
}

window.onbeforeunload = function(e) {
  if (is_edited.config || is_edited.active_headers_group || is_edited.form) {
    e.preventDefault()
    e.returnValue = true
    return 'Save changes before closing?'
  }
}

function initConfigurationPage() {
  initGlobalValue()

  // load configuration from local storage
  loadFromBrowserStorage(['config', 'started', 'active_headers_groups'], function (result) {
    try {
      if (!result.config)
        throw 0

      config = JSON.parse(result.config)
    }
    catch(e) {
      config = {}
      is_edited.config = true
    }

    if (config.headers === 'undefined') {
      config.headers = {"default": []}
      is_edited.config = true
    }

    if (config.debug_mode === 'undefined') {
      config.debug_mode = false
      is_edited.config = true
    }

    if (config.show_comments === 'undefined') {
      config.show_comments = true
      is_edited.config = true
    }

    started = (result.started === 'on') ? 'on' : 'off'
    try {
      if (!result.active_headers_groups)
        throw 0

      const active_headers_groups = JSON.parse(result.active_headers_groups)
      if (!Array.isArray(active_headers_groups) || !active_headers_groups.length)
        throw 0

      active_headers_group = active_headers_groups[0]
    }
    catch(e) {
      active_headers_group = 'default'
    }
    active_headers = config.headers[active_headers_group] || []

    is_edited.initial_headers_group = active_headers_group

    updateFormFieldValues()
    updateStartButtonImage()
    addFormFieldEventListeners()
  })
}

function updateFormFieldValues() {
  removeAllRuleSets()
  removeAllLines()

  for (let name in config.headers)
    appendRuleSet(name)

  for (let to_add of active_headers)
    appendLine(to_add.url_contains, to_add.action, to_add.header_name, to_add.header_value, to_add.comment, to_add.apply_on, to_add.status)

  reshapeTable()

  document.getElementById('debug_mode'   ).checked = !!config.debug_mode
  document.getElementById('show_comments').checked = !!config.show_comments
  document.getElementById('select_rule_set').value = active_headers_group

  is_edited.form = false
}

function updateStartButtonImage() {
  if (started === 'on')
    document.getElementById('start_img').src = 'img/stop.png'
  else
    document.getElementById('start_img').src = 'img/start.png'
}

function addFormFieldEventListeners() {
  document.getElementById('save_button').addEventListener(
    'click',
    function (e) {saveData()}
  )
  document.getElementById('export_button').addEventListener(
    'click',
    function (e) {exportData()}
  )
  document.getElementById('import_button').addEventListener(
    'click',
    function (e) {importData()}
  )
  document.getElementById('delete_all_button').addEventListener(
    'click',
    function (e) {deleteAllData()}
  )
  document.getElementById('parameters_button').addEventListener(
    'click',
    function (e) {showParametersScreen()}
  )
  document.getElementById('select_rule_set').addEventListener(
    'change',
    function (e) {changeRuleSet()}
  )
  document.getElementById('add_rule_set_button').addEventListener(
    'click',
    function (e) {addRuleSet()}
  )
  document.getElementById('add_line_button').addEventListener(
    'click',
    function (e) {appendLine('','add','','','','req','on')}
  )
  document.getElementById('start_img').addEventListener(
    'click',
    function (e) {toggleStartButton()}
  )
  document.getElementById('exit_parameters_screen_button').addEventListener(
    'click',
    function (e) {hideParametersScreen()}
  )
  document.getElementById('debug_mode').addEventListener(
    'click',
    function (e) {showDebugLogsClick()}
  )
  document.getElementById('show_comments').addEventListener(
    'click',
    function (e) {showCommentsClick()}
  )
  document.getElementById('config_form').addEventListener(
    'submit',
    function (e) {e.preventDefault()},
    true
  )
  document.getElementById('config_form').addEventListener(
    'click',
    function (e) {if ((e.target.tagName === 'BUTTON') || (e.target.parentElement.tagName === 'BUTTON')) is_edited.form = true},
    true
  )
  document.getElementById('config_form').addEventListener(
    'input',
    function (e) {is_edited.form = true}
  )
}

function initGlobalValue() {
  config               = {}
  started              = 'off'
  active_headers_group = 'default'
  active_headers       = []
  line_number          = 1

  is_edited.config               = false
  is_edited.active_headers_group = false
  is_edited.form                 = false
}

function log(message) {
  console.log(new Date() + ' SimpleModifyHeader : ' + message)
}

/** PARAMETERS SCREEN MANAGEMENT **/

function showParametersScreen() {
  document.getElementById('main_screen').hidden       = true
  document.getElementById('parameters_screen').hidden = false
}

function hideParametersScreen() {
  document.getElementById('main_screen').hidden       = false
  document.getElementById('parameters_screen').hidden = true
}

function showDebugLogsClick() {
  config.debug_mode = !!document.getElementById('debug_mode').checked
  is_edited.config = true
}

function showCommentsClick() {
  config.show_comments = !!document.getElementById('show_comments').checked

  reshapeTable()
}

/** END PARAMETERS SCREEN MANAGEMENT **/

function appendRuleSet(name) {
  const option = document.createElement('option')
  option.value = name
  option.textContent = name

  document.getElementById('select_rule_set').appendChild(option)
}

/**
* Add a new configuration line on the UI
*
**/
function appendLine(url_contains,action,header_name,header_value,comment,apply_on,status) {
  let html = `
    <td>
      <input class="form-control" id="url_contains${line_number}" />
    </td>
    <td width="0">
      <select class="form-control" id="select_action${line_number}"> disable="false">
        <option value="add">Add</option>
        <option value="modify">Modify</option>
        <option value="add_or_modify">Add or Modify</option>
        <option value="cookie_add_or_modify">Add or Modify Cookie</option>
        <option value="delete">Delete</option>
        <option value="cookie_delete">Delete Cookie</option>
      </select>
    </td>
    <td>
      <select class="form-control common_header_names" id="common_header_names${line_number}">
        <option value="-1"></option>
      </select>
      <input class="form-control" id="header_name${line_number}" />
    </td>
    <td>
      <input class="form-control" id="header_value${line_number}" />
    </td>
    <td${config.show_comments ? '' : ' hidden'}>
      <input class="form-control" id="comment${line_number}" />
    </td>
    <td width="0">
      <select class="form-control" id="apply_on${line_number}">
        <option value="req">Request</option>
        <option value="res">Response</option>
      </select>
    </td>
    <td width="0">
      <button type="button" class="btn btn-primary btn-sm" title="Activate/deactivate rule" id="activate_button${line_number}">ON <span class="glyphicon glyphicon-ok"></span></button>
    </td>
    <td width="0">
      <button type="button" class="btn btn-default btn-sm" title="Move line up" id="up_button${line_number}">
        <span class="glyphicon glyphicon-arrow-up"></span>
      </button>
    </td>
    <td width="0">
      <button type="button" class="btn btn-default btn-sm" title="Move line down" id="down_button${line_number}">
        <span class="glyphicon glyphicon-arrow-down"></span>
      </button>
    </td>
    <td width="0">
      <button type="button" class="btn btn-default btn-sm" title="Delete line" id="delete_button${line_number}">
        <span class="glyphicon glyphicon-trash"></span>
      </button>
    </td>
  `

  const newTR     = document.createElement('tr')
  newTR.id        = 'line' + line_number
  newTR.innerHTML = html

  document.getElementById('config_tab').appendChild(newTR)
  document.getElementById('select_action' + line_number).value = action
  document.getElementById('apply_on'      + line_number).value = apply_on
  document.getElementById('url_contains'  + line_number).value = url_contains
  document.getElementById('header_name'   + line_number).value = header_name
  document.getElementById('header_value'  + line_number).value = header_value
  document.getElementById('comment'       + line_number).value = comment

  const line_number_to_modify = line_number
  document.getElementById('activate_button' + line_number).addEventListener(
    'click',
    function (e) {switchActivateButton(line_number_to_modify)}
  )
  document.getElementById('delete_button' + line_number).addEventListener(
    'click',
    function (e) {deleteLine(line_number_to_modify)}
  )
  document.getElementById('up_button' + line_number).addEventListener(
    'click',
    function (e) {invertLine(line_number_to_modify, (line_number_to_modify - 1))}
  )
  document.getElementById('down_button' + line_number).addEventListener(
    'click',
    function (e) {invertLine(line_number_to_modify, (line_number_to_modify + 1))}
  )
  document.getElementById('common_header_names' + line_number).addEventListener(
    'focus',
    function (e) {populateCommonHeaderNames(line_number_to_modify)}
  )
  document.getElementById('common_header_names' + line_number).addEventListener(
    'change',
    function (e) {selectFromCommonHeaderNames(line_number_to_modify)}
  )
  setButtonStatus(
    document.getElementById('activate_button' + line_number),
    status
  )
  line_number++
}

function removeAllRuleSets() {
  removeAllChildren(document.getElementById('select_rule_set'))
}

function removeAllLines() {
  removeAllChildren(document.getElementById('config_tab'))
  line_number = 1
}

function removeAllChildren(node) {
  if (node && (node instanceof Node)) {
    while(node.childNodes.length) {
      node.removeChild(node.childNodes[0])
    }
  }
}

/** ACTIVATE BUTTON MANAGEMENT **/

function setButtonStatus(button,status) {
  if (status === 'on') {
    button.className = 'btn btn-primary btn-sm'
    button.innerHTML = 'ON  <span class="glyphicon glyphicon-ok"></span>'
  }
  else {
    button.className = 'btn btn-default btn-sm'
    button.innerHTML = 'OFF <span class="glyphicon glyphicon-ban-circle"></span>'
  }
}

function getButtonStatus(button) {
  return (button.className === 'btn btn-primary btn-sm')
    ? 'on'
    : 'off'
}

function switchActivateButton(button_number) {
  const activate_button = document.getElementById('activate_button' + button_number)

  // toggle button status
  if (getButtonStatus(activate_button) === 'on')
    setButtonStatus(activate_button, 'off')
  else
    setButtonStatus(activate_button, 'on')
}

/** END ACTIVATE BUTTON MANAGEMENT **/

function reshapeTable() {
  const th_elements = document.querySelectorAll('#config_table_head th')
  const tr_elements = document.querySelectorAll('#config_tab tr')

  for (let i=0; i < tr_elements.length; i++) {
    tr_elements[i].children[4].hidden = (!config.show_comments)
  }
  th_elements[4].hidden = (!config.show_comments)
}

/**
* Create a JSON String representing the configuration data
*
* throws Error for invalid regex
**/
function updateConfig() {
  if (!is_edited.form) return

  const headers     = []
  const tr_elements = document.querySelectorAll('#config_tab tr')

  for (let i=0; i < tr_elements.length; i++) {
    const url_contains = tr_elements[i].children[0].children[0].value.trim()

    if (url_contains && !isRegExpValid(url_contains)) {
      // highlight input field containing invalid regex pattern value
      tr_elements[i].children[0].children[0].style.color = 'red'

      // throw
      throw new Error(`invalid regex pattern:\n'${url_contains}'`)
    }
    else {
      // remove highlight for corrected value
      tr_elements[i].children[0].children[0].style.color = 'black'
    }

    const action       = tr_elements[i].children[1].children[0].value
    const header_name  = tr_elements[i].children[2].children[1].value.trim()
    const header_value = tr_elements[i].children[3].children[0].value.trim()
    const comment      = tr_elements[i].children[4].children[0].value.trim()
    const apply_on     = tr_elements[i].children[5].children[0].value
    const status       = getButtonStatus(tr_elements[i].children[6].children[0])

    headers.push({
      url_contains, action, header_name, header_value, comment, apply_on, status
    })
  }

  active_headers = headers
  config.headers[active_headers_group] = active_headers

  is_edited.config = true
  is_edited.form = false
}

// return TRUE when invalid regex Error occurs
function askToUpdateConfig() {
  if (is_edited.form && window.confirm('Keep unsaved changes to current rule set?')) {
    try {
      updateConfig()
    }
    catch(error) {
      alert(error.message)
      return true
    }
  }
}

/**
* check if url patterns are valid
*
**/
function isRegExpValid(source) {
  try {
    new RegExp(source)
    return true
  }
  catch(error) {
    return false
  }
}

/**
*  save the data to the local storage and restart modify header
*
**/
function saveData() {
  try {
    updateConfig()
    storeConfiguration()
  }
  catch(error) {
    alert(error.message)
  }
}

/**
* If url pattern is valid save the data in a file
*
**/
function exportData() {
  const to_export = JSON.stringify(config, null, 2)

  // Create file to save
  const a    = document.createElement('a')
  a.href     = 'data:attachment/json,' +  encodeURIComponent(to_export)
  a.target   = 'download'
  a.download = 'SimpleModifyHeader.conf'

  // use iframe "download" to put the link (in order not to be redirect in the parent frame)
  let myf
  myf = document.getElementById('download')
  myf = myf.contentWindow.document || myf.contentDocument
  myf.body.appendChild(a)
  a.click()
}

/**
* Choose a file and import data from the choosen file
*
**/
function importData() {
  // create an input field in the iframe
  const input = document.createElement('input')
  input.type  = 'file'
  input.addEventListener('change', importDataCallback, false)

  let myf
  myf = document.getElementById('download')
  myf = myf.contentWindow.document || myf.contentDocument
  myf.body.appendChild(input)
  input.click()
}

/**
* Import configuration from a file
*
**/
function importDataCallback(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = function(e) {
    loadConfiguration(e.target.result, true)
  }
  reader.readAsText(file)
}

/**
* Delete all HTTP header rules from config data
*
**/
function deleteAllData() {
  const options = []

  if (Object.keys(config.headers).length > 1)
    options.push({mode: 'all-rule-sets', text: 'All rule sets'})
  if (active_headers_group !== 'default')
    options.push({mode: 'current-rule-set', text: 'Current rule set'})
  if (config.headers[active_headers_group].length)
    options.push({mode: 'all-lines-in-current-rule-set', text: 'All lines in current rule set'})

  if (!options.length) {
    alert('Nothing to delete')
    return
  }

  const prompt_text = [
    'Enter numer to select what items to delete:',
    '',
    ...options.map((item, index) => `  ${index + 1}. ${item.text}`)
  ].join("\n")

  let option_index = window.prompt(prompt_text)
  if (!option_index) return

  option_index = parseInt(option_index, 10)
  if (isNaN(option_index)) {
    alert('Invalid selection')
    return
  }
  option_index--

  if ((option_index < 0) || (option_index >= options.length)) {
    alert('Invalid selection')
    return
  }

  switch(options[option_index].mode) {
    case 'all-rule-sets': {
        config.headers       = {"default": []}
        active_headers_group = 'default'
        active_headers       = []
      }
      break
    case 'current-rule-set': {
        delete config.headers[active_headers_group]
        active_headers_group = 'default'
        active_headers       = config.headers[active_headers_group] || []
      }
      break
    case 'all-lines-in-current-rule-set': {
        config.headers[active_headers_group] = []
        active_headers = []
      }
      break
    default:
      return
  }

  updateFormFieldValues()
  is_edited.config = true
}

function changeRuleSet() {
  if (askToUpdateConfig()) return

  active_headers_group = document.getElementById('select_rule_set').value
  active_headers = config.headers[active_headers_group] || []

  updateFormFieldValues()
  is_edited.active_headers_group = (active_headers_group !== is_edited.initial_headers_group)
}

function addRuleSet() {
  let name = window.prompt('Name for new rule set?')
  if (!name) return

  name = name.trim()
  if (!name) return

  if (config.headers[name]) {
    alert('Rule set already exists')
  }
  else {
    config.headers[name] = []
    appendRuleSet(name)
    is_edited.config = true
  }

  document.getElementById('select_rule_set').value = name
  changeRuleSet()
}

/**
* Load configuration from a string
*
**/
function loadConfiguration(configuration, doMerge) {
  if (askToUpdateConfig()) return

  try {
    const new_config = JSON.parse(configuration)

    if (!new_config || !new_config.headers)
      throw 0

    // migrate from old format
    if (Array.isArray(new_config.headers)) {
      new_config.headers = {"default": new_config.headers}
    }

    if (typeof new_config.headers !== 'object')
      throw 0

    if (doMerge)
      mergeConfiguration(new_config)
    else
      config = new_config

    active_headers = config.headers[active_headers_group] || []
    updateFormFieldValues()
    is_edited.config = true
  }
  catch(error) {
    console.log(error)
    alert('Invalid file format')
  }
}

function mergeConfiguration(new_config) {
  for (let new_headers_group in new_config.headers) {
    if (config.headers[new_headers_group]) {
      config.headers[new_headers_group] = config.headers[new_headers_group].concat( new_config.headers[new_headers_group] )
    }
    else {
      config.headers[new_headers_group] = new_config.headers[new_headers_group]
    }
  }
}

function storeConfiguration() {
  if (is_edited.config) {
    storeInBrowserStorage({ config: JSON.stringify(config), active_headers_groups: JSON.stringify([active_headers_group]) }, function() {
      chrome.runtime.sendMessage({action: 'reload'})

      is_edited.config = false
      is_edited.active_headers_group = false
      is_edited.initial_headers_group = active_headers_group
    })
  }
  else {
    storeInBrowserStorage({ active_headers_groups: JSON.stringify([active_headers_group]) }, function() {
      chrome.runtime.sendMessage({action: 'change-group'})

      is_edited.active_headers_group = false
      is_edited.initial_headers_group = active_headers_group
    })
  }
}

/**
* Delete a configuration line on the UI
*
**/
function deleteLine(line_number_to_delete) {
  if (line_number_to_delete !== line_number) {
    for (let i = line_number_to_delete; i < (line_number - 1); i++) {
      const j = i + 1
      document.getElementById('select_action' + i).value = document.getElementById('select_action' + j).value
      document.getElementById('url_contains'  + i).value = document.getElementById('url_contains'  + j).value
      document.getElementById('header_name'   + i).value = document.getElementById('header_name'   + j).value
      document.getElementById('header_value'  + i).value = document.getElementById('header_value'  + j).value
      document.getElementById('comment'       + i).value = document.getElementById('comment'       + j).value
      document.getElementById('apply_on'      + i).value = document.getElementById('apply_on'      + j).value
      setButtonStatus(
        document.getElementById('activate_button' + i),
        getButtonStatus(
          document.getElementById('activate_button' + j)
        )
      )
    }
  }

  const line = document.getElementById('line' + (line_number - 1))
  line.parentNode.removeChild(line)
  line_number--
}

/**
* Invert two configuration lines on the UI
*
**/
function invertLine(line1, line2) {
  // if a line does not exist , do nothing
  if ((line1 === 0) || (line2 === 0) || (line1 >= line_number) || (line2 >= line_number))
    return

  // Save data for line 1
  const select_action1 = document.getElementById('select_action' + line1).value
  const url_contains1  = document.getElementById('url_contains'  + line1).value
  const header_name1   = document.getElementById('header_name'   + line1).value
  const header_value1  = document.getElementById('header_value'  + line1).value
  const comment1       = document.getElementById('comment'       + line1).value
  const apply_on1      = document.getElementById('apply_on'      + line1).value
  const select_status1 = getButtonStatus(document.getElementById('activate_button' + line1))

  // Copy line 2 to line 1
  document.getElementById('select_action' + line1).value = document.getElementById('select_action' + line2).value
  document.getElementById('url_contains'  + line1).value = document.getElementById('url_contains'  + line2).value
  document.getElementById('header_name'   + line1).value = document.getElementById('header_name'   + line2).value
  document.getElementById('header_value'  + line1).value = document.getElementById('header_value'  + line2).value
  document.getElementById('comment'       + line1).value = document.getElementById('comment'       + line2).value
  document.getElementById('apply_on'      + line1).value = document.getElementById('apply_on'      + line2).value
  setButtonStatus(
    document.getElementById('activate_button' + line1),
    getButtonStatus(
      document.getElementById('activate_button' + line2)
    )
  )

  // Copy line 1 to line 2
  document.getElementById('select_action' + line2).value = select_action1
  document.getElementById('url_contains'  + line2).value = url_contains1
  document.getElementById('header_name'   + line2).value = header_name1
  document.getElementById('header_value'  + line2).value = header_value1
  document.getElementById('comment'       + line2).value = comment1
  document.getElementById('apply_on'      + line2).value = apply_on1
  setButtonStatus(
    document.getElementById('activate_button' + line2),
    select_status1
  )
}

const http_header_names = {
  "req": [
    "A-IM",
    "Accept",
    "Accept-Charset",
    "Accept-Datetime",
    "Accept-Encoding",
    "Accept-Language",
    "Access-Control-Request-Headers",
    "Access-Control-Request-Method",
    "Authorization",
    "Cache-Control",
    "Connection",
    "Content-Encoding",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Cookie",
    "DNT",
    "Date",
    "Expect",
    "Forwarded",
    "From",
    "Front-End-Https",
    "HTTP2-Settings",
    "Host",
    "If-Match",
    "If-Modified-Since",
    "If-None-Match",
    "If-Range",
    "If-Unmodified-Since",
    "Max-Forwards",
    "Origin",
    "Pragma",
    "Proxy-Authorization",
    "Proxy-Connection",
    "Range",
    "Referer",
    "Save-Data",
    "TE",
    "Trailer",
    "Transfer-Encoding",
    "Upgrade",
    "Upgrade-Insecure-Requests",
    "User-Agent",
    "Via",
    "Warning",
    "X-ATT-DeviceId",
    "X-Correlation-ID",
    "X-Csrf-Token",
    "X-Forwarded-For",
    "X-Forwarded-Host",
    "X-Forwarded-Proto",
    "X-Http-Method-Override",
    "X-Request-ID",
    "X-Requested-With",
    "X-UIDH",
    "X-Wap-Profile"
  ],
  "res": [
    "Accept-Patch",
    "Accept-Ranges",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Origin",
    "Access-Control-Expose-Headers",
    "Access-Control-Max-Age",
    "Age",
    "Allow",
    "Alt-Svc",
    "Cache-Control",
    "Connection",
    "Content-Disposition",
    "Content-Encoding",
    "Content-Language",
    "Content-Length",
    "Content-Location",
    "Content-MD5",
    "Content-Range",
    "Content-Security-Policy",
    "Content-Type",
    "Date",
    "Delta-Base",
    "ETag",
    "Expires",
    "IM",
    "Last-Modified",
    "Link",
    "Location",
    "P3P",
    "Pragma",
    "Proxy-Authenticate",
    "Public-Key-Pins",
    "Refresh",
    "Retry-After",
    "Server",
    "Set-Cookie",
    "Status",
    "Strict-Transport-Security",
    "Timing-Allow-Origin",
    "Tk",
    "Trailer",
    "Transfer-Encoding",
    "Upgrade",
    "Vary",
    "Via",
    "WWW-Authenticate",
    "Warning",
    "X-Content-Duration",
    "X-Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Correlation-ID",
    "X-Frame-Options",
    "X-Powered-By",
    "X-Request-ID",
    "X-UA-Compatible",
    "X-WebKit-CSP",
    "X-XSS-Protection"
  ]
}

/**
* Populate select dropdown with list of common HTTP header names
*
**/
function populateCommonHeaderNames(line_number) {
  const dropdown = document.getElementById('common_header_names' + line_number)
  const apply_on = document.getElementById('apply_on'            + line_number).value
  const attr_key = 'data-mode'

  if (!dropdown) return
  if (dropdown.getAttribute(attr_key) === apply_on) return

  // set an attribute to flag whether the options are still current
  dropdown.setAttribute(attr_key, apply_on)

  // remove stale options
  while (dropdown.children.length > 1) {
    dropdown.removeChild( dropdown.lastChild )
  }

  // add current options
  const options = http_header_names[ apply_on ]
  let option
  for (let index=0; index < options.length; index++) {
    option = document.createElement('option')
    option.setAttribute('value', index)
    option.innerText = options[index]
    dropdown.appendChild(option)
  }
}

/**
* Copy common HTTP header name from list to text field
*
**/
function selectFromCommonHeaderNames(line_number) {
  const dropdown = document.getElementById('common_header_names' + line_number)
  const apply_on = document.getElementById('apply_on'            + line_number).value
  const hdr_name = document.getElementById('header_name'         + line_number)

  const options  = http_header_names[ apply_on ]
  const index    = parseInt( dropdown.value, 10 )

  if (index >= 0) {
    hdr_name.value = options[index]
    dropdown.value = -1
  }
}

/**
* Stop or Start modify header
*
**/
function toggleStartButton() {
  if (started === 'off') {
      saveData()
      storeInBrowserStorage({started:'on'}, function() {
        chrome.runtime.sendMessage({action: 'on'})
        started = 'on'
        updateStartButtonImage()
      })
  }
  else {
    storeInBrowserStorage({started:'off'}, function() {
      chrome.runtime.sendMessage({action: 'off'})
      started = 'off'
      updateStartButtonImage()
    })
  }
}
