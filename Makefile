BASE_PATH ?=

app.js:
	tsc app.ts --lib es2023,dom --module preserve --target es2023

index.html:
	sed 's#@@@BASE_PATH@@@#$(BASE_PATH)#g' index.template.html > template.html
