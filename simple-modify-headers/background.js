"use strict";

let config
let started = 'off'
let active_headers_group = 'default'
let active_headers = []

/*
* Initialize global state
*
*/
loadFromBrowserStorage(['config', 'started', 'active_headers_group'], function (result) {
  if (result.config === undefined) {
    loadDefaultConfiguration()
  }
  else {
    try {
      started = result.started
      active_headers_group = result.active_headers_group

      config = JSON.parse(result.config)
      upgradeConfig()

      if (!config || !config.headers || (typeof config.headers !== 'object'))
        throw 0
    }
    catch(e) {
      loadDefaultConfiguration()
    }
  }

  preProcessConfig()

  if (started === 'on') {
    start(true)
  }
  else if (started !== 'off') {
    started = 'off'
    storeInBrowserStorage({ started })
  }

  // listen for change in configuration or start/stop
  chrome.runtime.onMessage.addListener(notify)
})

function loadDefaultConfiguration() {
  console.log('Load default config')

  const headers = {
    "default": [
    ],
    "allow CORS": [{
      url_contains: '^.*$',
      action:       'add',
      header_name:  'access-control-allow-origin',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-headers',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-methods',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-credentials',
      header_value: 'true',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-expose-headers',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-max-age',
      header_value: '600',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'sec-fetch-mode',
      header_value: 'same-origin',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'sec-fetch-site',
      header_value: 'same-origin',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    }],
    "disable CSP": [{
      url_contains: '^.*$',
      action:       'delete',
      header_name:  'content-security-policy',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'content-security-policy-report-only',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    }],
    "RawGit": [{
      url_contains: '^https://raw\\.githubusercontent\\.com/.*$',
      action:       'delete',
      header_name:  'content-security-policy',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.htm[l]?(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'text/html; charset=utf-8',
      comment:      'https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.css(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'text/css; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.[m]?js(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'text/javascript; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.json(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'application/json; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.ico(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'image/vnd.microsoft.icon',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.png(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'image/png',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.jp[e]?g(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'image/jpeg',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.svg(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'image/svg+xml',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.woff[2]?(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'font-woff',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.wasm(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'application/wasm',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.pdf(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'application/pdf',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.mp3(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'audio/mpeg',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.mp4(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'video/mp4',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.ts(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'video/mp2t',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.m3u8(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'application/vnd.apple.mpegurl',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.mpd(?:[#\\?].*)?$',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'application/dash+xml',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    }],
    "examples": [{
      url_contains: '^https?://httpbin\\.org/.*$',
      action:       'add',
      header_name:  'test-header-name-1',
      header_value: 'test-header-value-1',
      comment:      'test at: https://httpbin.org/headers',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-2',
      header_value: 'test-header-value-2',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'accept*',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'sec-fetch-*',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '^https?://postman-echo\\.com/.*$',
      action:       'add',
      header_name:  'test-header-name-3',
      header_value: 'test-header-value-3',
      comment:      'test at: http://postman-echo.com/get',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-4',
      header_value: 'test-header-value-4',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'modify',
      header_name:  'accept-encoding',
      header_value: 'identity',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'cookie',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '^https?://headers\\.jsontest\\.com.*$',
      action:       'delete',
      header_name:  '*',
      header_value: '',
      comment:      'test at: http://headers.jsontest.com',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-5',
      header_value: 'test-header-value-5',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-6',
      header_value: 'test-header-value-6',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'modify',
      header_name:  'content-type',
      header_value: 'text/plain',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'content-disposition',
      header_value: 'attachment; filename="headers.txt"',
      comment:      '',
      apply_on:     'res',
      status:       'off'
    }]
  }

  config = { headers: headers, format_version: 2, debug_mode: false, show_comments: true }
  active_headers_group = 'examples'
  storeInBrowserStorage({ config: JSON.stringify(config), active_headers_group })
}

// migrate config from format used < v3.0.0
function upgradeConfig() {
  if (!config || !config.headers || !Array.isArray(config.headers))
    return

  config.headers = {"default": config.headers}
  config.format_version = 2
  active_headers_group = 'default'
  storeInBrowserStorage({ config: JSON.stringify(config), active_headers_group })
}

function preProcessConfig() {
  active_headers = []

  if (!active_headers_group || !config.headers[active_headers_group]) {
    active_headers_group = 'default'
    storeInBrowserStorage({ active_headers_group })
  }

  if (!config.headers[active_headers_group] || !config.headers[active_headers_group].length)
    return

  let header
  let regex_ok = false
  for (let i=0; i < config.headers[active_headers_group].length; i++) {
    header = config.headers[active_headers_group][i]

    if (header.url_contains) {
      if (typeof header.url_contains === 'string') {
        try {
          header.url_contains = new RegExp(header.url_contains, 'i')
          regex_ok = true
        }
        catch(e) {
          regex_ok = false
        }
      }
      else if (header.url_contains instanceof RegExp) {
        regex_ok = true
      }
      else {
        header.url_contains = null
      }
    }

    if (regex_ok)
      active_headers.push(header)
  }
}

function loadFromBrowserStorage(item, callback_function) {
  chrome.storage.local.get(item, callback_function)
}

function storeInBrowserStorage(item, callback_function) {
  chrome.storage.local.set(item, callback_function)
}

/*
 * This function set a key-value pair in HTTP header "Cookie",
 *   and returns the value of HTTP header after modification.
 * If key already exists, it modify the value.
 * If key doesn't exist, it add the key-value pair.
 * If value is undefined, it delete the key-value pair from cookies.
 *
 * Assuming that, the same key SHOULD NOT appear twice in cookies.
 * Also assuming that, all cookies doesn't contains semicolon.
 *   (99.9% websites are following these rules)
 *
 * Example:
 *   cookie_keyvalues_set("msg=good; user=recolic; password=test", "user", "p")
 *     => "msg=good; user=p; password=test"
 *   cookie_keyvalues_set("msg=good; user=recolic; password=test", "time", "night")
 *     => "msg=good; user=recolic; password=test;time=night"
 */
function cookie_keyvalues_set(original_cookies, key, value) {
  let new_element = key + "=" + value; // not used if value is undefined.
  let cookies_ar = original_cookies.split(";").filter(e => e.trim().length > 0);
  let selected_cookie_index = cookies_ar.findIndex(kv => kv.trim().startsWith(key+"="));
  if (selected_cookie_index == -1) {
    if (value !== undefined)
      cookies_ar.push(new_element);
  }
  else {
    if (value === undefined)
      cookies_ar.splice(selected_cookie_index, 1);
    else
      cookies_ar.splice(selected_cookie_index, 1, new_element);
  }
  return cookies_ar.join(";");
}

/*
 * This function modify the HTTP response header "Set-Cookie",
 *   and replace the value of its cookie, to some new_value.
 * If key doesn't match original_set_cookie_header_content, new key is used in result.
 *
 * Example:
 *   set_cookie_modify_cookie_value("token=123; path=/; expires=Sat, 30 Oct 2021 17:57:32 GMT; secure; HttpOnly", "token", "bar")
 *     => "token=bar; path=/; expires=Sat, 30 Oct 2021 17:57:32 GMT; secure; HttpOnly"
 *   set_cookie_modify_cookie_value("  user=recolic", "user", "hacker")
 *     => "user=hacker"
 *   set_cookie_modify_cookie_value("user=recolic; path=/; HttpOnly", "token", "bar")
 *     => "token=bar; path=/; HttpOnly"
 */
function set_cookie_modify_cookie_value(original_set_cookie_header_content, key, new_value) {
  let trimmed = original_set_cookie_header_content.trimStart();
  let original_attributes = trimmed.indexOf(";") === -1 ? "" : trimmed.substring(trimmed.indexOf(";"))
  return key + "=" + new_value + original_attributes;
}

/*
* Standard function to log messages
*
*/
function log(message) {
  console.log(new Date() + ' SimpleModifyHeader : ' + message)
}

/*
* Rewrite HTTP headers (add, modify, or delete)
*
*/
function rewriteHttpHeaders(headers, url, apply_on) {
  const headersType = (apply_on === 'req') ? 'request' : 'response'

  if (config.debug_mode) log('Start modify ' + headersType + ' headers for url ' + url)
  let prev_url_contains = null
  for (let to_modify of active_headers) {
    // sanity check
    if (!to_modify.action || !to_modify.apply_on || !to_modify.header_name)
      continue

    if (to_modify.url_contains) prev_url_contains = to_modify.url_contains

    const header_name_lc     = to_modify.header_name.toLowerCase()
    const header_name_lc_end = header_name_lc.slice(-1)
    const header_name_lc_pre = header_name_lc.slice(0, -1)

    if ((to_modify.status === 'on') && (to_modify.apply_on === apply_on) && prev_url_contains && prev_url_contains.test(url)) {
      if (to_modify.action === 'add') {
        if (config.debug_mode) log('Add ' + headersType + ' header : name=' + to_modify.header_name + ',value=' + to_modify.header_value + ' for url ' + url)
        const new_header = { name: to_modify.header_name, value: to_modify.header_value }
        headers.push(new_header)
      }
      else if (to_modify.action === 'modify') {
        for (let header of headers) {
          if (header.name.toLowerCase() === header_name_lc) {
            if (config.debug_mode) log('Modify ' + headersType + ' header :  name= ' + header.name + ',old value=' + header.value + ',new value=' + to_modify.header_value + ' for url ' + url)
            header.value = to_modify.header_value
          }
        }
      }
      else if (to_modify.action === 'delete') {
        for (let i = (headers.length - 1); i >= 0; i--) {
          if (header_name_lc_end === '*') {
            // fuzzy match
            if (headers[i].name.toLowerCase().indexOf(header_name_lc_pre) === 0) {
              if (config.debug_mode) log('Delete ' + headersType + ' header :  name=' + headers[i].name + ' for url ' + url)
              headers.splice(i, 1)
            }
          }
          else {
            // exact match
            if (headers[i].name.toLowerCase() === header_name_lc) {
              if (config.debug_mode) log('Delete ' + headersType + ' header :  name=' + headers[i].name + ' for url ' + url)
              headers.splice(i, 1)
            }
          }
        }
      }
      else if (to_modify.action === "cookie_add_or_modify") {
        if (apply_on === 'req') {
          let header_cookie = headers.find(header => header.name.toLowerCase() === "cookie");
          let new_cookie = cookie_keyvalues_set(header_cookie === undefined ? "" : header_cookie.value, to_modify.header_name, to_modify.header_value);
          if (header_cookie === undefined) {
            headers.push({"name": "Cookie", "value": new_cookie});
            if (config.debug_mode) log("cookie_add_or_modify.req new_header : name=Cookie,value=" + new_cookie + " for url " + url);
          }
          else {
            header_cookie.value = new_cookie;
            if (config.debug_mode) log("cookie_add_or_modify.req modify_header : name=Cookie,value=" + new_cookie + " for url " + url);
          }
        }
        else {
          let header_cookie = headers.find(header => 
              header.name.toLowerCase() === "set-cookie" && 
              header.value.toLowerCase().trim().startsWith(to_modify.header_name.toLowerCase()+"=")
          );
          let new_header_value = set_cookie_modify_cookie_value(header_cookie === undefined ? "" : header_cookie.value, to_modify.header_name, to_modify.header_value);
          if (header_cookie === undefined) {
            log("SimpleModifyHeaders.Warning: you're using cookie_add_or_modify in Response. While adding new cookie in response, this plugin only generates `Set-Cookie: cookie-name=cookie-value `, without ANY additional attributes. Add a `Set-Cookie` header if you need them. ");
            headers.push({"name": "Set-Cookie", "value": new_header_value});
            if (config.debug_mode) log("cookie_add_or_modify.resp new_header : name=Cookie,value=" + new_header_value + " for url " + url);
          }
          else {
            header_cookie.value = new_header_value;
            if (config.debug_mode) log("cookie_add_or_modify.resp modify_header : name=Cookie,value=" + new_header_value + " for url " + url);
          }
        }
      }
      else if (to_modify.action === "cookie_delete") {
        if (apply_on === 'req') {
          let header_cookie = headers.find(header => header.name.toLowerCase() === "cookie");
          let new_cookie = cookie_keyvalues_set(header_cookie === undefined ? "" : header_cookie.value, to_modify.header_name, undefined);
          if (header_cookie === undefined) {
            if (config.debug_mode) log("cookie_delete.req: no cookie header found. doing nothing for url " + url);
          }
          else {
            header_cookie.value = new_cookie;
            if (config.debug_mode) log("cookie_delete.req modify_header : name=Cookie,value=" + new_cookie + " for url " + url);
          }
        }
        else {
          let index = headers.findIndex(header => 
              header.name.toLowerCase() === "set-cookie" && 
              header.value.toLowerCase().trim().startsWith(to_modify.header_name.toLowerCase()+"=")
          );
          if (index === -1) {
            if (config.debug_mode) log("cookie_delete.resp: no matching set-cookie header. doing nothing for url " + url);
          }
          else {
            headers.splice(index, 1);
            if (config.debug_mode) log("cookie_delete.resp delete_header : name=" + to_modify.header_name + " for url " + url);
          }
        }
      }
    }
  }
  if (config.debug_mode) log('End modify ' + headersType + ' headers for url ' + url)
}

/*
* Rewrite HTTP request headers (add, modify, or delete)
*
*/
function rewriteRequestHeaders(details) {
  const headers  = details.requestHeaders
  const url      = details.url
  const apply_on = 'req'

  rewriteHttpHeaders(headers, url, apply_on)

  return { requestHeaders: headers }
}

/*
* Rewrite HTTP response headers (add, modify, or delete)
*
*/
function rewriteResponseHeaders(details) {
  const headers  = details.responseHeaders
  const url      = details.url
  const apply_on = 'res'

  rewriteHttpHeaders(headers, url, apply_on)

  return { responseHeaders: headers }
}

/*
* Listen for message form config.js
* if message is reload : reload the configuration
* if message is on : start the modify header
* if message is off : stop the modify header
*
**/
function notify(message) {
  if (!message || !(typeof message === 'object') || !message.action || !(typeof message.action === 'string'))
    return

  switch(message.action) {
    case 'change-group': {
        if (config.debug_mode) log('Change active headers group')
        loadFromBrowserStorage(['active_headers_group'], function (result) {
          active_headers_group = result.active_headers_group
          preProcessConfig()
        })
      }
      break
    case 'reload': {
        if (config.debug_mode) log('Reload configuration')
        loadFromBrowserStorage(['config', 'active_headers_group'], function (result) {
          try {
            config = JSON.parse(result.config)
            active_headers_group = result.active_headers_group
            preProcessConfig()
          }
          catch(e) {
            active_headers = []
          }
        })
      }
      break
    case 'on': {
        start()
      }
      break
    case 'off': {
        stop()
      }
      break
  }
}

/*
* Add rewriteRequestHeaders  as a listener to onBeforeSendHeaders.
* Add rewriteResponseHeaders as a listener to onHeadersReceived.
* Make it "blocking" so we can modify the headers.
*
*/
function addListeners() {
  let extraInfoSpec

  // "extraHeaders" option is needed for Chrome v72+: https://developer.chrome.com/extensions/webRequest
  extraInfoSpec = chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
    ? ['blocking', 'requestHeaders', 'extraHeaders']
    : ['blocking', 'requestHeaders']

  chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteRequestHeaders,
    { urls: ['<all_urls>'] },
    extraInfoSpec
  )

  // "extraHeaders" option is needed for Chrome v72+: https://developer.chrome.com/extensions/webRequest
  extraInfoSpec = chrome.webRequest.OnHeadersReceivedOptions.hasOwnProperty('EXTRA_HEADERS')
    ? ['blocking', 'responseHeaders', 'extraHeaders']
    : ['blocking', 'responseHeaders']

  chrome.webRequest.onHeadersReceived.addListener(
    rewriteResponseHeaders,
    { urls: ['<all_urls>'] },
    extraInfoSpec
  )
}

/*
* Remove the two listeners
*
*/
function removeListeners() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(rewriteRequestHeaders)
  chrome.webRequest.onHeadersReceived.removeListener(rewriteResponseHeaders)
}

function start(skip_check) {
  if (!skip_check && (started === 'on'))
    return

  addListeners()
  chrome.browserAction.setIcon({ path: 'icons/modify-green-32.png' })
  started = 'on'
  if (config.debug_mode) log('Start modifying headers')
}

function stop(skip_check) {
  if (!skip_check && (started === 'off'))
    return

  removeListeners()
  chrome.browserAction.setIcon({ path: 'icons/modify-32.png' })
  started = 'off'
  if (config.debug_mode) log('Stop modifying headers')
}
