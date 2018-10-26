// ==UserScript==
// @id             iitc-plugin-drawstore
// @name           IITC plugin: DrawStore
// @category       Info
// @version        0.1.3.20181026.1640
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://cdn.rawgit.com/Hurqalia/drawstore/master/drawstore.meta.js
// @downloadURL    https://cdn.rawgit.com/Hurqalia/drawstore/master/drawstore.user.js
// @description    [2018-10-26-1640] DrawStore
// @include        https://ingress.com/intel*
// @include        http://ingress.com/intel*
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @grant          none
// ==/UserScript==
/*
	0.1.3	Added Opt menu with Import/Export buttons
*/

function wrapper(plugin_info) {
	if(typeof window.plugin !== 'function') window.plugin = function() {};
	plugin_info.buildName = 'hurqalia22';
	plugin_info.dateTimeVersion = '20181026.1640';
	plugin_info.pluginId = 'drawstore';

	// PLUGIN START ////////////////////////////////////////////////////////

	// use own namespace for plugin
	window.plugin.drawstore             = function() {};
	window.plugin.drawstore.KEY_STORAGE = 'drawstore-storage';
	window.plugin.drawstore.storage     = {};
	window.plugin.drawstore.datas_draw  = '';
	window.plugin.drawstore.isAndroid = function() {
		if(typeof android !== 'undefined' && android) {
			return true;
		}
		return false;
	}

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
	
	window.plugin.drawstore.optAlert = function(message) {
		$('.ui-dialog-drwSet .ui-dialog-buttonset').prepend('<p class="drw-alert" style="float:left;margin-top:4px;">'+message+'</p>');
		$('.drw-alert').delay(2500).fadeOut();
	}

	// open opt dialog
	window.plugin.drawstore.openOpt = function() {
		dialog({
		  html: window.plugin.drawstore.htmlSetbox,
		  dialogClass: 'ui-dialog-drwSet',
		  title: 'Drawstore Options'
		});

    //window.runHooks('pluginBkmrksOpenOpt');
	}
	
	// reset store
	window.plugin.drawstore.optReset = function() {
    var promptAction = confirm('All draw projects will be deleted. Are you sure?', '');
    if(promptAction) {
      delete localStorage[window.plugin.drawstore.KEY_STORAGE];
	  window.plugin.drawstore.storage = {};
	  window.plugin.drawstore.saveStorage();
      window.plugin.drawstore.refreshMenu();
      //window.runHooks('pluginBkmrksEdit', {"target": "all", "action": "reset"});
      console.log('DRAWSTORE: reset all draws');
      window.plugin.drawstore.optAlert('Successful. ');
		}
	}
	// copy drawstore for export
	window.plugin.drawstore.optCopy = function() {
    if(typeof android !== 'undefined' && android && android.shareString) {
      return android.shareString(localStorage[window.plugin.drawstore.KEY_STORAGE]);
    } else {
      dialog({
        html: '<p><a onclick="$(\'.ui-dialog-drwSet-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p>'+
			'<textarea readonly>'+
				localStorage[window.plugin.drawstore.KEY_STORAGE]+
			'</textarea>',
        dialogClass: 'ui-dialog-drwSet-copy',
        title: 'Drawstore Export'
			});
		}
	}
	window.plugin.drawstore.optExport = function() {
		if(typeof android !== 'undefined' && android && android.saveFile) {
		  android.saveFile("IITC-drawstore.json", "application/json", localStorage[window.plugin.drawstore.KEY_STORAGE]);
		}
	}

	// import drawstore via paste
	window.plugin.drawstore.optPaste = function() {
    var promptAction = prompt('Press CTRL+V to paste it.', '');
    if(promptAction !== null && promptAction !== '') {
      try {
        JSON.parse(promptAction); // try to parse JSON first
        localStorage[window.plugin.drawstore.KEY_STORAGE] = promptAction;
		window.plugin.drawstore.refreshMenu();//we do refresh the dropdownlist
        console.log('DRAWSTORE: reset and imported drawstore');
        window.plugin.drawstore.optAlert('Successful. ');
      } catch(e) {
        console.warn('DRAWSTORE: failed to import data: '+e);
        window.plugin.drawstore.optAlert('<span style="color: #f88">Import failed </span>');
			}
		}
	}
	
	window.plugin.drawstore.optImport = function() {
    if (window.requestFile === undefined) return;
    window.requestFile(function(filename, content) {
      try {
        JSON.parse(content); // try to parse JSON first
        localStorage[window.plugin.drawstore.KEY_STORAGE] = promptAction;
		window.plugin.drawstore.refreshMenu();//we do refresh the dropdownlist
        console.log('DRAWSTORE: reset and imported drawstore');
        window.plugin.drawstore.optAlert('Successful. ');
      } catch(e) {
        console.warn('DRAWSTORE: failed to import data: '+e);
        window.plugin.drawstore.optAlert('<span style="color: #f88">Import failed </span>');
			}
		});
	}
	
	// init setup
	window.plugin.drawstore.setup = function() {
		if (!window.plugin.drawTools) {
			console.log('**** DrawStore : not loaded, drawtools is missing ****');
			alert('Drawtools plugin is required');
			return;
		}
		window.plugin.drawstore.setupCSS();
		window.plugin.drawstore.addPanel();
		console.log('**** DrawStore : loaded ****');
	};
	window.plugin.drawstore.setupCSS = function() {
		$('<style>').prop('type', 'text/css').html('#drwstoreSetbox a{'+
			'display:block;'+
			'color:#ffce00;'+
			'border:1px solid #ffce00;'+
			'padding:3px 0;'+
			'margin:10px auto;'+
			'width:80%;'+
			'text-align:center;'+
			'background:rgba(8,48,78,.9);'+
			'}'+
			'#drwstoreSetbox a.disabled, #drwstoreSetbox a.disabled:hover{'+
			'color:#666;'+
			'border-color:#666;'+
			'text-decoration:none;}'+
			'#drwstoreSetbox{text-align:center;}'+
			'.ui-dialog-drwSet-copy textarea{'+
			'width:96%;'+
			'height:120px;'+
			'resize:vertical;}')
			.appendTo('head');
	}
	// toolbox menu
	window.plugin.drawstore.addPanel = function() {
		var actions = '';
		actions += '<a onclick="window.plugin.drawstore.optReset();return false;">Reset drawstore</a>';
		actions += '<a onclick="window.plugin.drawstore.optCopy();return false;">Copy drawstore</a>';
		actions += '<a onclick="window.plugin.drawstore.optPaste();return false;">Paste drawstore</a>';
		
		if(window.plugin.drawstore.isAndroid()) {
		  actions += '<a onclick="window.plugin.drawstore.optImport();return false;">Import drawstore</a>';
		  actions += '<a onclick="window.plugin.drawstore.optExport();return false;">Export drawstore</a>';
		}
		window.plugin.drawstore.htmlSetbox = '<div id="drwstoreSetbox">' + actions + '</div>';
		
		$('#toolbox').after('<div id="drawstore-toolbox" style="padding:3px;"></div>');
		$('#drawstore-toolbox')
			.append(' <strong>Draws : </strong><select onchange="window.plugin.drawstore.selectStoredDraw()" id="changeDrawButton" title="Change Draw"></select><br />')
			.append(' <a onclick="window.plugin.drawstore.saveDraw()">Save</a>&nbsp;&nbsp;')
			.append(' <a onclick="window.plugin.drawstore.removeDraw()">Delete</a>&nbsp;&nbsp;')
			.append(' <a onclick="window.plugin.drawstore.resetDraw()">Clear Draw</a>')
			.append(' <a onclick="window.plugin.drawstore.openOpt()">Opt</a>');
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
