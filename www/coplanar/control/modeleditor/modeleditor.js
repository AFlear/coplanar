steal('coplanar/control', 'can',
      'coplanar/control/objecteditor',
      'ui/model-editor.ejs',
function(Control, can) {

    Control.ModelEditor = Control.ObjectEditor.extend({
        defaults: {
            editorTemplate: 'ui/model-editor.ejs',
            template: null,
            model: null,
            ref: null,
        },

        makeCreatorClass: function() {
            return [ {
            }, {
                setRoute: function(route) {
                    this.open(this.options.model.getDefaultObject(route));
                },
            } ];
        },

        // Create a creator subclass, it replace the setRoute()
        // implementation with one that create new instances.
        // Subclasses can extend the makeCreatorClass() method
        // to add more functionalities.
        Creator: function(classMembers, objMembers) {
            var creatorClass = this.makeCreatorClass();
            if (objMembers == null) {
                objMembers = classMembers;
                classMembers = {};
            }
            if (classMembers == null)
                classMembers = {};
            can.extend(creatorClass[0], classMembers);
            can.extend(creatorClass[1], objMembers);
            return this.extend.apply(this, creatorClass);
        },
    }, {
        init: function () {
            this._super.apply(this, arguments);
            this._saveButtons = [];
            if (this.options.ref)
                this.setRoute({id: this.options.ref,});
        },

        updateSaveButtonState: function() {
            if (this._saveButtons != null && this._saveButtons.length > 0) {
                var errors = this._object.errors();
                if (errors || !this._object.isDirty(true)) {
                    if (errors)
                        console.log('Errors', this._object, errors);
                    for (var i in this._saveButtons)
                        this._saveButtons[i].button('disable');
                } else {
                    for (var i in this._saveButtons)
                        this._saveButtons[i].button('enable');
                }
            }
        },

        onObjectChange: function(ev, attr, how, newVal, oldVal) {
            this.updateSaveButtonState();
        },

        setRoute: function(route) {
            return this.options.model.findOne({id: route.id})
                .done(can.proxy(this.open, this));
        },

        render: function(obj, parent, template) {
            template = template || this.options.editorTemplate;
            return this._super(obj, parent, template);
        },

        onSaveButtonClick: function(evt) {
            var self = this;
            this._object.save(null, null, true)
                .done(function() {
                    self._object.backup();
                    self.updateSaveButtonState();
                });
        },

        open: function(obj) {
            this._saveButtons = [];
            obj.backup();
            this._super(obj);
            this.updateSaveButtonState();
        },

        close: function(obj) {
            return this._super(obj);
            this._saveButtons = null;
        },

        newEnv: function() {
            var editor = this;
            return can.extend(this._super(), {
                renderData: function () {
                    return this.render(editor._object, editor.options.template);
                },

                saveButton: function (el) {
                    editor._saveButtons.push(el);
                    return el.click(can.proxy(editor.onSaveButtonClick, editor));
                },
            });
        },
    });

    return Control.ModelEditor;
});
