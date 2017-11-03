'use strict';
const electron = require('electron');

var fs = require('fs');

const app = electron.app;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 800,
		height: 500
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});

const ipc = require('electron').ipcMain;
const path = require('path');

const data_file_path = path.join(app.getPath('userData'), 'snippets.json');

ipc.on('get_snippets', (event, arg) => {
	fs.readFile(data_file_path, 'utf8', function(err, data) {
		if (err) {
			// try to recover existing snippet data from old version
			fs.readFile('snippets.json', 'utf8', function(err_, data_) {
				if (err_) {
					event.returnValue = null;
					return console.error();(err_);
				} else {
					fs.writeFile(data_file_path, data_, 'utf8', function(){});
					event.returnValue = data_;
				}
			});
		} else {
			event.returnValue = data;
		}
	});
});

ipc.on('save_snippets', (event, snippets) => {
	fs.writeFile(data_file_path, snippets, 'utf8', function(){});
	event.returnValue = 1; // Required for sendSync or it hangs forever! You can send back anything here.
});
