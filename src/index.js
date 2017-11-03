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

ipc.on('get_snippets', (event, arg) => {
	fs.readFile('snippets.json', 'utf8', function(err, data) {
		if (err) {
			return console.error();(err);
		}
    event.returnValue = data;
	});
});

ipc.on('save_snippets', (event, snippets) => {
	fs.writeFile('snippets.json', snippets, 'utf8', function(){});
	event.returnValue = 1; // Required for sendSync or it hangs forever! You can send back anything here.
});
