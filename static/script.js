let csrf_token = document.querySelector(`meta[name='csrf-token']`).content

let contain = document.querySelector('.block-contain')
let textForm = contain.querySelector('.text-form')
let textInput = textForm.querySelector('.text-input')
let submit = textForm.querySelector('.submit-btn')

function deleteNote_onclick(e) {
	let textList = document.querySelector('ul.text-list')
	let targetNote = e.target.parentNode.parentNode.parentNode
	let targetId = targetNote.querySelector('meta').id

	let xh = new XMLHttpRequest();
	xh.open('POST', `/delete_note/${targetId}`)
	xh.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
	xh.setRequestHeader('X-CSRFToken', csrf_token)
	xh.send()

	xh.onreadystatechange = function() {
		if (xh.readyState === XMLHttpRequest.DONE && xh.status === 200) {
			targetNote.remove()
			if (!textList.children.length) {textList.remove()}
		}		
	}
}

function editNote_onclick(e) {
	let textList = document.querySelector('ul.text-list')
	let targetNote = e.target.parentNode.parentNode.parentNode
	let innerNote = targetNote.querySelector('.li-inner')
	let options = innerNote.querySelector('.note-options')

	let targetId = targetNote.querySelector('meta').id
	let label = targetNote.querySelector('.label').innerHTML

	// replace text with text input
	if (targetNote.classList.contains('edit') ) {
		innerNote.querySelector('.text-input').focus()
		return false
	}

	// replace buttons
	options.classList.add('hidden')
	let editOptions = document.createElement('div')
	editOptions.classList.add('edit-options')
	editOptions.innerHTML = `
		<input type="button" class='cancel-edit'>
		<input type="button" class="submit-edit">
	`
	innerNote.append(editOptions)

	// add edit button events
	editOptions.querySelector('.cancel-edit').onclick = function() {
		removeEditMode(targetNote, label)
	}

	editOptions.querySelector('.submit-edit').onclick = function() {
		edit_note(targetId, label, data => {
			removeEditMode(targetNote, data.text)
		});
	}

	// hide label
	targetNote.classList.add('edit')
	targetNote.querySelector('.label').classList.add('hidden')

	// add text input
	let editTextInput = document.createElement('input')
	editTextInput.classList.add('text-input')
	editTextInput.type = 'text'
	editTextInput.value = label
	editTextInput.maxLength = '35'
	innerNote.prepend(editTextInput)
	editTextInput.focus();

	editTextInput.onkeydown = function(e) {
		let val = editTextInput.value

		if (!val) {return false};
		switch (e.key) {
			case 'Enter':
				if (label !== val){
					edit_note(targetId, val, data => {
						removeEditMode(targetNote, data.text)
					});
				}
				break
			case 'Escape':
				removeEditMode(targetNote, val)
				break
		}
	}
}

function removeEditMode(noteElement, text) {
	if (!noteElement.classList.contains('edit')) {
		return false
	}

	noteElement.classList.remove('edit')
	noteElement.querySelector('.text-input').remove()

	// remove edit options
	noteElement.querySelector('.edit-options').remove()
	noteElement.querySelector('.note-options').classList.remove('hidden')

	// add label
	let label = noteElement.querySelector('.label')
	label.classList.remove('hidden')
	label.innerHTML = text
}

document.querySelectorAll('.delete-note').forEach(element => {
	element.onclick = deleteNote_onclick	
})

document.querySelectorAll('.edit-note').forEach(element => {
	element.onclick = editNote_onclick	
})

textInput.onkeydown = function(e) {
	switch (e.key) {
		case 'Enter':
			if (textInput.value) {
				send_note(textInput.value)
			}
			break
	}
}

submit.onclick = function() {
	let val = textInput.value 
	if (!val) {
		throw new Error('Form cannot be empty.')
	}
	send_note(val)
}

function send_note(text, callback) {
	let xh = new XMLHttpRequest;
	xh.open('POST', '/create_note')
	xh.setRequestHeader('X-CSRFToken', csrf_token)
	
	let formData = new FormData();
	formData.append('text', text)
	xh.send(formData)

	xh.onreadystatechange = function() {
		if (xh.readyState === XMLHttpRequest.DONE && xh.status === 200) {
			let data = JSON.parse(xh.responseText)
			if (callback && typeof callback === 'function') {
				callback(data)
				return true
			}
			let textList = document.querySelector('ul.text-list')
			if (!textList) {
				textList = document.createElement('ul')
				textList.classList.add('text-list')
				contain.append(textList)
			}

			listItem = document.createElement('li')
			listItem.innerHTML = `
				<div class='li-inner'>
					<meta id="${data.id}"></meta>
					<div class='label'>${data.text}</div>

					<div class='note-options'>
						<input type="button" class='delete-note'>
						<input type="button" class="edit-note">
					</div>
				</div>
			`
			textList.prepend(listItem)
			listItem.querySelector('.delete-note').onclick = deleteNote_onclick
			listItem.querySelector('.edit-note').onclick = editNote_onclick
			textInput.value = ''
		}
	}
}

function get_note(note_id, callback) {
	let xh = new XMLHttpRequest;
	xh.open('GET', `/get_note/${note_id}`)
	xh.setRequestHeader('X-CSRFToken', csrf_token)
	xh.send()

	xh.onreadystatechange = function() {
		if (xh.readyState === XMLHttpRequest.DONE && xh.status === 200) {
			if (callback && typeof callback === 'function') {
				callback(JSON.parse(xh.responseText))
			}
		}
	}
}

function edit_note(note_id, text, callback) {
	let xh = new XMLHttpRequest;
	xh.open('POST', `/edit_note/${note_id}`)
	xh.setRequestHeader('X-CSRFToken', csrf_token)

	let formData = new FormData();
	formData.append('text', text)
	xh.send(formData)

	xh.onreadystatechange = function() {
		if (xh.readyState === XMLHttpRequest.DONE && xh.status === 200) {
			if (callback && typeof callback === 'function') {
				callback(JSON.parse(xh.responseText))
			}
		}
	}	
}