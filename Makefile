BASE_PATH ?=

all: app.js index.html

app.js:
	tsc app.ts --lib es2023,dom --module preserve --target es2023

index.html:
	sed \
		's#@@@BASE_PATH@@@#$(BASE_PATH)#g' \
		header.template.html \
		> header.html

	marked -i README.md -o README.html

	cat header.html README.html footer.html > index.full.html

	html-minifier \
		--minify-css \
		--minify-js \
		--collapse-whitespace \
		--remove-comments \
		--remove-attribute-quotes \
		--sort-attributes \
		--sort-class-name \
		index.full.html \
		--output index.html

	rm -f header.html README.html index.full.html

install:
	npm install -g typescript marked html-minifier

clean:
	rm -f header.html README.html index.full.html index.html app.js


.PHONY: all install clean
