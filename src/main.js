"use strict";

let ipc = require('electron').ipcRenderer;

let code_editor = document.getElementById('code_editor')
let code_render = document.getElementById('code_render')

let copy = require('copy-to-clipboard')

code_render.innerText = code_editor.value
hljs.highlightBlock(code_render);


var edit_mode = {
  enabled: false,
  start: function() {
    $('#snippet-title').prop('readonly', false);
    $('#snippet-language').prop('readonly', false);
    $('#code_editor').show()
    $('#code_render').hide()
    this.enabled = true
  },
  end: function() {
    $('#snippet-title').prop('readonly', true);
  	$('#snippet-language').prop('readonly', true);
  	$('#code_editor').hide()
  	$('#code_render').show()
  	this.enabled = false
  }
}


const app = new Moon({
	el: ".window",
	data: {
		snippets: [{
				title: 'hello world',
				language: 'python',
				contents: 'print "Hello, world!"',
				deleted: false,
				shown: true,
				path: 'Python/other'
			},
			{
				title: 'duplicate list',
				language: 'javascript',
				contents: 'var x = y.copy("true")',
				deleted: false,
				shown: true,
				path: 'javascript/native/other'
			},
			{
				title: 'load jQuery',
				language: 'html',
				contents: '<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>',
				deleted: false,
				shown: true,
				path: 'javascript/jquery'
			}
		],
		search_instance: undefined,
		query: '',
		folders: [
			'Python/',
			'Python/numpy/',
			'Python/numpy/ai',
			'Python/pandas',
			'Python/other',
			'javascript/',
			'javascript/jquery',
			'javascript/native/',
			'javascript/native/iframes',
			'javascript/native/dom',
			'javascript/native/other',
		],
		selected_path: ''
	},
	hooks: {
		init: function() {
			this.callMethod('update_search_index')
			this.set('snippets', JSON.parse(ipc.sendSync('get_snippets')) || this.get('snippets'))
		},
		mounted: function() {
			$('#search').val('')
			$('#snippet-sidebar').on('click', '.edit-button', function(event) {
				event.stopPropagation();
				$(this).hide()
				$(this).parent().find('.save-button').show()
				$(this).parent().find('.delete-button').show()
			})
		}
	},
	methods: {
		choose_snippet: function(snippet) {
			if (edit_mode.enabled) {
				return
			}

			const shown_snippets = this.get('snippets').filter(function(s) {
				return s.shown
			});

			if (shown_snippets.indexOf(snippet) == -1) {
				return
			}

			let active_item = document.querySelector('.snippet-item.active')
			if (active_item) {
				active_item.classList.remove('active')
			}

			const snippet_list_item = document.querySelectorAll('.snippet-item')[shown_snippets.indexOf(snippet)]
			snippet_list_item.classList.add('active')

			$('#snippet-title').val(snippet.title)
			$('#snippet-language').val(snippet.language)

			code_render.innerText = code_editor.value = snippet.contents
			code_render.classList = snippet.language
			hljs.highlightBlock(code_render);
		},
		edit_snippet: function(snippet) {
			event.stopPropagation()

			var target = $(event.target)
			target.hide()
			target.parent().find('.save-button').show()
			target.parent().find('.delete-button').show()

      edit_mode.start()
		},
		save_snippet: function(event, snippet) {
			event.stopPropagation()

			var target = $(event.target)
			target.hide()
			target.parent().find('.delete-button').hide()
			target.parent().find('.edit-button').css('display', '')

			var snippets = this.get('snippets')
			let snippet_idx = snippets.indexOf(snippet)
			snippets[snippet_idx].contents = code_editor.value
			snippets[snippet_idx].title = $('#snippet-title').val()
			snippets[snippet_idx].language = $('#snippet-language').val()
			this.set('snippets', snippets)

			edit_mode.end()

      this.callMethod('update_search_index');
		},
		add_snippet: function() {
			var snippets = this.get('snippets')
			const new_snippet = {
				title: ' ',
				language: ' ',
				contents: '',
				deleted: false,
				shown: true,
				path: '?'
			}
			snippets.push(new_snippet)
			this.set('snippets', snippets)
			Moon.nextTick(function() {
				const snippet_items = $('.snippet-item')
				const snippet_item = $(snippet_items[snippet_items.length - 1])
				let edit_button = snippet_item.find('.edit-button')
				edit_button.hide()
				edit_button.parent().find('.save-button').show()
				edit_button.parent().find('.delete-button').show()

				this.callMethod('choose_snippet', [new_snippet])
        edit_mode.start()
				$('#snippet-title').val('')
				$('#snippet-language').val('')
			}.bind(this));

			this.callMethod('update_search_index')
		},
		delete_snippet: function(snippet) {
			if (!confirm(`Are you sure you want to delete ${snippet.title} (${snippet.language})?`)) {
				return
			}
			edit_mode.end()
			var snippets = this.get('snippets')
			const snippet_idx = snippets.indexOf(snippet)
			snippets[snippet_idx].deleted = true
			snippets[snippet_idx].shown = false
			this.set('snippets', snippets)

			Moon.nextTick(function() {
				const shown_snippets = this.get('snippets').filter(function(s) {
					return s.shown
				});
				this.callMethod('choose_snippet', [shown_snippets[0]]);
			}.bind(this));

			this.callMethod('update_search_index');
		},
		should_show: function(snippet) {
			return snippet.shown && snippet.path.startsWith(this.get('selected_path'));
		},
		search: function() {
			let query = this.get('query');
			if (query == '') {
				const snippets = this.get('snippets').map(snippet => {
					snippet.shown = !snippet.deleted
					return snippet;
				});
				this.set('snippets', snippets);
				return;
			}
			var results = this.get("search_instance")(query);
			results = results.sort(function(a, b) {
				return b.score - a.score;
			})
			const results_indicies = results.map(function(result) {
				return result.index;
			})

			const snippets = this.get('snippets').map((snippet, index) => {
				snippet.shown = results_indicies.indexOf(index) != -1 && !snippet.deleted
				return snippet;
			});

			this.set('snippets', snippets)
		},
		update_search_index: function() {
			const searchable_snippets = this.get('snippets').filter(function(snippet) {
				return !snippet.deleted;
			}).map(function(snippet) {
      		return `${snippet.title} ${snippet.language} ${snippet.contents}`;
      })

			this.set('search_instance', Wade(searchable_snippets));
		},
		copy_text: function(event, text) {
			event.stopPropagation()
			copy(text)
		},
	}
});

window.addEventListener('beforeunload', function(e) {
	const existing_snippets = app.get('snippets').filter(function(s) {
		return !s.deleted
	}).map(snippet => {
		snippet.shown = true;
		return snippet
	})
	ipc.sendSync('save_snippets', JSON.stringify(existing_snippets))
});
