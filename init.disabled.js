//////////////////////////////////////////////////////////////////////////////80
// Keybind
//////////////////////////////////////////////////////////////////////////////80
// Copyright (c) Atheos & Liam Siira (Atheos.io), distributed as-is and without
// warranty under the modified License: MIT - Hippocratic 1.2: firstdonoharm.dev
// See [root]/license.md for more. This information must remain intact.
//////////////////////////////////////////////////////////////////////////////80
// Description:
// Keybinding module for adding keyboard shortcuts to functions. Exposes init()
// and bind() to global for use by plugins.
//												- Liam Siira
//////////////////////////////////////////////////////////////////////////////80

(function(global) {

	var atheos = global.atheos,
		amplify = global.amplify,
		oX = global.onyx;

	var self = null;

	amplify.subscribe('system.loadExtra', () => atheos.outline.init());


	//////////////////////////////////////////////////////////////////////
	// Bindings
	//////////////////////////////////////////////////////////////////////

	atheos.outline = {

		outlineButton: null,
		outlineMenu: null,

		init: function() {
			self = this;

			// OutlineMenu = onyx('<ul id="OutlineMenu" class="options-menu"></ul>');
			oX('#cursor-position').before('<a id="OutlineButton">Outline</a>');
			oX('#cursor-position').before('<ul id="OutlineMenu" class="options-menu" style="display:none;"></ul>');
			self.outlineButton = oX('#OutlineButton');
			self.outlineMenu = oX('#OutlineMenu');

			atheos.common.initMenuHandler(self.outlineButton, self.outlineMenu);

			self.outlineMenu.on('click', function(e) {
				var line = oX(e.target).attr('data-line');
				if (line) {
					atheos.editor.gotoLine(line);
				}
			});

			amplify.subscribe('chrono.mega', self.updateOutline);

			amplify.subscribe('active.onFocus active.onSave', function() {
				self.updateOutline();
			});

			amplify.subscribe('active.onClose', function() {
				self.disableOutline();
			});
		},

		//////////////////////////////////////////////////////////////////////
		// Update Outline
		//////////////////////////////////////////////////////////////////////
		updateOutline: function() {

			var editor = atheos.editor;

			var content = editor.getContent();
			var activeSession = editor.activeInstance.getSession();
			var currMode = activeSession.getMode().$id;
			currMode = currMode.substring(currMode.lastIndexOf('/') + 1);

			if (currMode !== 'php') {
				self.disableOutline();
				return;
			}

			var loc = content.split(/\r?\n/);
			var matches = [];
			var editorOutline = [];

			var keywords = ['public', 'private', 'protected'];
			var regexClass = /^(\s+|())+class\s(\w+)/;

			loc.forEach(function(line, index) {
				if (line.indexOf("function") > -1) {

					matches.push(self.parsePHPfunction(line, index));

				}
				if (line.indexOf("class") > -1 && line.match(regexClass)) {
					var KeyArray = line.match(regexClass);
					var KeyFunction = KeyArray.pop();
					matches.push('<li class="class"><a data-line="' + (index + 1) + '" title="' + KeyFunction + '">' + KeyFunction + '</a></li>');
				}

			});

			if (matches.length > 0) {
				self.outlineMenu.empty();
				self.outlineMenu.html(matches.join(""));

				editor = atheos.editor.getActive().getSession();
				editor.setAnnotations(editorOutline.concat(editor.getAnnotations()));

			} else {
				self.disableOutline();
			}
		},

		parsePHPfunction: function(line, lineNum) {
			var split = line.replace("\t", ' ').split(' ').filter(item => item !== "");
			var types = ['public', 'private', 'protected'];

			types = types.filter(t => split.includes(t));
			var type = types[0] || 'public';

			var index = split.indexOf('function');

			if (index > -1) {
				split = split.slice(index + 1).join('');
				if (split.indexOf("(") > -1) {
					split = split.substring(0, split.indexOf("("));
				}
				return '<li class="function ' + type + '"><a data-line="' + (lineNum + 1) + '" title="' + split + '">' + split + '</a></li>';
			}
		},

		disableOutline: function() {
			self.outlineMenu.empty();
			self.outlineMenu.append("<li><a>Nothing</a></li>");
		}
	};

})(this);