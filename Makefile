.PHONY: all
all: build

BUILD_DIR := build
APP_DIR   := www

APP_FILES := 								\
	index.html							\
	coplanar-gv.html						\
	coplanar-gv.js							\
	production.js							\
	coplanar.css							\
	steal/steal.production.js					\
	ui/coplanar-gv.ejs						\
	ui/event-editor.ejs						\
	ui/event-program-editor.ejs					\
	ui/hostel-editor.ejs						\
	ui/list-editor-accordion.ejs					\
	ui/login.ejs							\
	ui/model-editor.ejs						\
	ui/user-editor.ejs						\

# Include the dependencies if we have some
-include build/production.dep
build/production.js: www/coplanar-gv.js www/stealconfig.js Makefile
	@mkdir -p $(@D) && cd $(<D) && \
		steal/js steal/buildjs $(<F) -to "$(abspath $(@D))"

build/coplanar-gv.html: www/coplanar-gv.html
	@echo 	" Generate	coplanar-gv.html"
	@mkdir -p $(@D) && 						\
		sed 's,steal/steal.js,steal/steal.production.js,' $<	\
			> $@ || (rm $@ ; false)

build/index.html: build/coplanar-gv.html
	@echo	" Link		index.html"
	@mkdir -p $(@D) && rm -f $@ && ln -s $(<F) $@

JS_LIBS := jquery jquery-ui fullcalendar
jquery-ui_GRUNT_TARGET := release

jquery_FILES := 							\
	jquery.js							\
	jquery.min.js							\
	jquery.min.map							\

jquery-ui_FILES := 							\
	jquery-ui.js							\
	jquery-ui.min.js						\
	jquery-ui.css							\
	jquery-ui.min.css						\
	i18n/jquery-ui-i18n.js						\
	i18n/jquery-ui-i18n.min.js					\
	images/animated-overlay.gif					\
	images/ui-bg_flat_0_aaaaaa_40x100.png				\
	images/ui-bg_flat_75_ffffff_40x100.png				\
	images/ui-bg_glass_55_fbf9ee_1x400.png				\
	images/ui-bg_glass_65_ffffff_1x400.png				\
	images/ui-bg_glass_75_dadada_1x400.png				\
	images/ui-bg_glass_75_e6e6e6_1x400.png				\
	images/ui-bg_glass_95_fef1ec_1x400.png				\
	images/ui-bg_highlight-soft_75_cccccc_1x100.png			\
	images/ui-icons_222222_256x240.png				\
	images/ui-icons_2e83ff_256x240.png				\
	images/ui-icons_454545_256x240.png				\
	images/ui-icons_888888_256x240.png				\
	images/ui-icons_cd0a0a_256x240.png				\

fullcalendar_FILES := 							\
	fullcalendar.js							\
	fullcalendar.min.js						\
	fullcalendar.css						\

build/%: www/%
	@echo	" Install	$(@:www/%=%)"
	@mkdir -p $(@D) && rm -f $@ && ln $< $@

.PHONY: build
build: $(addprefix build/,$(APP_FILES)) 				\
	$(foreach lib,$(JS_LIBS), 					\
		$(addprefix build/$(lib)/,$($(lib)_FILES)))

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
