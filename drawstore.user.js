// ==UserScript==
// @id             iitc-plugin-drawstore
// @name           IITC plugin: DrawStore
// @category       Info
// @version        0.1.2.20160407.004
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://github.com/Hurqalia/drawstore/raw/master/drawstore.meta.js
// @downloadURL    https://github.com/Hurqalia/drawstore/raw/master/drawstore.user.js
// @installURL     https://github.com/Hurqalia/drawstore/raw/master/drawstore.user.js
// @description    [hurqalia22-2016-04-07-000004] DrawStore
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
	if(typeof window.plugin !== 'function') window.plugin = function() {};
	plugin_info.buildName = 'hurqalia22';
	plugin_info.dateTimeVersion = '20160407.004';
	plugin_info.pluginId = 'drawstore';

	// PLUGIN START ////////////////////////////////////////////////////////

	// use own namespace for plugin
	window.plugin.drawstore             = function() {};
	window.plugin.drawstore.KEY_STORAGE = 'drawstore-storage';
	window.plugin.drawstore.storage     = {};
	window.plugin.drawstore.datas_draw  = '';

	// update the localStorage datas
	window.plugin.drawstore.saveStorage = function() {
		localStorage[window.plugin.drawstore.KEY_STORAGE] = JSON.stringify(window.plugin.drawstore.storage);
	};

	// load the localStorage datas
	window.plugin.drawstore.loadStorage = function() {
		if (localStorage[window.plugin.drawstore.KEY_STORAGE]) {
			window.plugin.drawstore.storage = JSON.parse(localStorage[window.plugin.drawstore.KEY_STORAGE]);
		}
	};

	// read drawtools datas
	window.plugin.drawstore.getDraw = function() {
		if (localStorage['plugin-draw-tools-layer']) {
			window.plugin.drawstore.datas_draw = localStorage['plugin-draw-tools-layer'];
			return true;
		}
		return false;
	};

	// set drawtools datas
	window.plugin.drawstore.setDraw = function() {
		localStorage['plugin-draw-tools-layer'] = window.plugin.drawstore.datas_draw;
	};

	// change draw from store
	window.plugin.drawstore.selectStoredDraw = function() {
		var draw_name = $('#changeDrawButton').val();
		if ($.trim(draw_name) === '') {
			return false;
		}
		if (typeof window.plugin.drawstore.storage[draw_name] === 'undefined') {
			alert('draw not found in store');
			return false;
		}
		window.plugin.drawstore.datas_draw = JSON.stringify(window.plugin.drawstore.storage[draw_name]);
		window.plugin.drawstore.setDraw();

		window.plugin.drawTools.drawnItems.clearLayers();
		window.plugin.drawTools.load();
	};

	window.plugin.drawstore.resetDraw = function() {
		delete localStorage['plugin-draw-tools-layer'];
		window.plugin.drawTools.drawnItems.clearLayers();
		window.plugin.drawTools.load();
		runHooks('pluginDrawTools', {event: 'clear'});
	};
	// remove draw from store
	window.plugin.drawstore.removeDraw = function() {
		var draw_name = $('#changeDrawButton').val();
		if ($.trim(draw_name) === '') {
			window.plugin.drawstore.resetDraw();
			return false;
		}
		if (typeof window.plugin.drawstore.storage[draw_name] === 'undefined') {
			alert('draw not found in store');
			return false;
		}

		delete window.plugin.drawstore.storage[draw_name];
		window.plugin.drawstore.saveStorage();
		window.plugin.drawstore.refreshMenu();
		window.plugin.drawstore.resetDraw();
	};

	// save draw to store
	window.plugin.drawstore.saveDraw = function() {
		var html = '<div class=""><div>Give a draw name</div>name : <input id="draw_name" type="text"></input></div>';

		dialog({
			html: html,
			id: 'plugin-drawstore-new-name',
			dialogClass: '',
			title: 'new draw name',
			buttons:{
				'OK' : function() {
					var new_name = $('#draw_name').val();
					if ($.trim(new_name) === '') {
						alert('draw name required');
						return false;
					}
					var rexp = /^[\+0-9a-zA-Z_-]+$/;
					if (rexp.test(new_name)) {
						if (window.plugin.drawstore.storage[new_name] !== undefined) {
							if (!confirm('name already exists, do you want to overwrite this draw ?')) {
								return false;
							}
						}
						if (window.plugin.drawstore.getDraw()) {
							window.plugin.drawstore.storage[new_name] = JSON.parse(window.plugin.drawstore.datas_draw);
							window.plugin.drawstore.saveStorage();
							window.plugin.drawstore.refreshMenu();
						} else {
							alert('no draw to save');
						}
					} else {
						alert('alphanumeric string only');
						return false;
					}
					$(this).dialog('close');
				},
				'Cancel' : function(){
					$(this).dialog('close');
				}
			}
		});
	};

	// populate select menu
	window.plugin.drawstore.refreshMenu = function() {
		window.plugin.drawstore.loadStorage();
		$('#changeDrawButton').find('option').remove();
		$('#changeDrawButton').append($('<option>', { value : '', text : 'Select a Draw' }));
		if (Object.keys(window.plugin.drawstore.storage).length) {
			$.each(window.plugin.drawstore.storage, function(k, r) {
				$('#changeDrawButton').append($('<option>', { value : k, text : k }));      
			});
		} 
	};

	// init setup
	window.plugin.drawstore.setup = function() {
		if (!window.plugin.drawTools) {
			console.log('**** DrawStore : not loaded, drawtools is missing ****');
			alert('Drawtools plugin is required');
			return;
		}
		window.plugin.drawstore.addPanel();
		console.log('**** DrawStore : loaded ****');
	};
  
	// toolbox menu
	window.plugin.drawstore.addPanel = function() {
		$('#toolbox').after('<div id="drawstore-toolbox" style="padding:3px;"></div>');
		$('#drawstore-toolbox')
			.append(' <strong>Draws : </strong><select onchange="window.plugin.drawstore.selectStoredDraw()" id="changeDrawButton" title="Change Draw"></select><br />')
			.append(' <a onclick="window.plugin.drawstore.saveDraw()">Save</a>&nbsp;&nbsp;')
			.append(' <a onclick="window.plugin.drawstore.removeDraw()">Delete</a>&nbsp;&nbsp;')
			.append(' <a onclick="window.plugin.drawstore.resetDraw()">Clear Draw</a>');
		window.plugin.drawstore.refreshMenu();
	};

	// runrun
	var setup =  window.plugin.drawstore.setup;

	setup.info = plugin_info; //add the script info data to the function as a property
	if(!window.bootPlugins) window.bootPlugins = [];
	window.bootPlugins.push(setup);
	// if IITC has already booted, immediately run the 'setup' function
	if(window.iitcLoaded && typeof setup === 'function') {
		setup();
	}

    // PLUGIN END ////////////////////////////////////////////////////////    
} // WRAPPER END ////////////////////////////////////////////////////////    

var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
