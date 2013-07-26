.PHONY: all
all: www

JS_LIBS := jquery jquery-ui fullcalendar

jquery-ui_GRUNT_TARGET := release

.PHONY: www

JS_LIB_FILES := package.json node_modules
.SECONDARY: $(foreach lib,$(JS_LIBS), \
		$(foreach file,$(JS_LIB_FILES),lib/$(lib)/$(file)))
www: | $(foreach lib,$(JS_LIBS),lib/$(lib)/dist)


lib/%/node_modules: | lib/%/package.json
	cd $(@D) && npm install

lib/%/dist: | lib/%/node_modules lib/%/Gruntfile.js
	cd $(@D) && grunt $($(*)_GRUNT_TARGET)

lib/%/package.json lib/%/Gruntfile.js:
	git submodule update --init -f $(@D)
