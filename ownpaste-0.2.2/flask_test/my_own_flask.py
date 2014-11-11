#username is ownpaster
#password is the hash of SuperDuper

#http://ownpaste.readthedocs.org/en/0.2.2/setup/#using-pip-easy-install
debugging = True

from flask import Flask
app = Flask("app")
#fileapp = Flask("fileapp")

app.debug = debugging
#fileapp.debug = debugging
@app.route('/')
def hello_world():
  return 'Hello World!'

#using "path:" here includes slashes
@app.route('/files/<path:filepath>')
def returnfile(filepath):
  file_result = ''
  try:
    asked_file = open(str('files/' + filepath), 'r')
    for line in asked_file:
      file_result+=line
    asked_file.close()
  except:
    string = 'File not found.'
  return file_result

@app.route('/user/<username>')
def show_user_profile(username):
    # show the user profile for that user
    return 'User %s' % username

if __name__ == '__main__':
  if debugging:
    app.run(None,port = 5002)
    #fileapp.run(None,port = 5002)
  else:
    app.run(host='0.0.0.0',port = 5002)
    #fileapp.run(host='0.0.0.0',port = 5002)
