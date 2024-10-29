BASE_PATH ?=

install:
	npm install -g typescript marked

clean:
	rm -f header.html README.html index.html app.js

app.js:
	tsc app.ts --lib es2023,dom --module preserve --target es2023

index.html:
	sed 's#@@@BASE_PATH@@@#$(BASE_PATH)#g' header.template.html > header.html
	marked -i README.md -o README.html
	cat header.html README.html footer.html > index.html

.PHONY: install clean
