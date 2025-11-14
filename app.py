from flask import Flask, request, redirect, url_for, render_template, jsonify, send_from_directory
from flask_wtf.csrf import CSRFProtect
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from pathlib import Path
import os
import secrets
import random


app = Flask(__name__)
csrf = CSRFProtect(app)
app.secret_key = '0E9TP45u9jAVxNJlgkgH_w'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
 
db = SQLAlchemy(app)

class Note(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	text = db.Column(db.String)
	date_created = db.Column(db.DateTime)

	@property
	def as_dict(self):
		cols = self.__table__.columns
		return {key.name: getattr(self, key.name) for key in cols}

@app.route('/')
def index():
	ok = ['Hello World!', 'flask is awesome', 'aeiou']

	return render_template('index.html', 
		random_ok=random.choice(ok), 
		notes=[*reversed(Note.query.all())]
	)

@app.post('/create_note')
def create_note():
	text = request.form.get('text')

	new_note = Note(text=text, date_created=datetime.now())
	db.session.add(new_note)
	db.session.commit()

	return jsonify(new_note.as_dict)

@app.post('/delete_note/<int:note_id>')
def delete_note(note_id):
	Note.query.filter(Note.id == note_id).delete()
	db.session.commit()

	return {'status': 'deleted'}

@app.post('/edit_note/<int:note_id>')
def edit_note(note_id):
	note = Note.query.filter(Note.id == note_id)
	note.update({'text': request.form.get('text')})
	db.session.commit()

	return note[0].as_dict

@app.get('/get_note/<int:note_id>')
def get_note(note_id):
	return Note.query.get(note_id).as_dict