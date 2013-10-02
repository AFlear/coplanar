steal('coplanar/control', 'can',
      'coplanar/control/objectview', 'coplanar/control/objecteditor',
function(Control, can) {

    Control.ListEditorItem = Control.ObjectEditor.extend({
        open: function(obj) {
            obj.backup();
            return this._super.apply(this, arguments);
        },
    });

    Control.ListEditor = Control.ObjectView.extend({
        defaults: {
            ObjectEditor: Control.ListEditorItem,
            objectTemplate: null,
            objectFactory: null,
            defaultObject: null,
        },
    },{
        init: function() {
            this._addButtons = [];
            this._super.apply(this, arguments);
        },

        createObject: function(params) {
            params = can.extend(
                can.extend({}, this.options.defaultObject || {}),
                params || {});
            return this.options.objectFactory(params);
        },

        open: function(obj) {
            if (this._addObject == null) {
                this._addObject = this.createObject();
                this._addObject.bind("change", can.proxy(this.onAddObjectChange, this));
            }
            this._super(obj);
            this.onAddObjectChange();
        },

        close: function() {
            this._addButtons = [];
            this._super();
        },

        onAddObjectChange: function() {
            var errors = this._addObject.errors();
            //console.log(this._cid, 'addObject changed', this._addButtons, errors, this._addObject.isDirty(true));
            for (var i in this._addButtons) {
                var el = this._addButtons[i];
                if (errors || !this._addObject.isDirty(true))
                    el.button('disable');
                else
                    el.button('enable');
            }
        },

        getObjectTitle: function(obj, idx) {
            if (obj.title != null)
                return obj.title;
            else
                return 'Item #' + (idx+1);
        },
        getAddTitle: function() {
            return 'Add item';
        },

        makeObjectEditor: function(el, obj, idx) {
            return new this.options.ObjectEditor(el, {
                template: this.options.objectTemplate,
                object: obj,
            });
        },

        makeObjectCreator: function(el) {
            return new this.options.ObjectEditor(el, {
                template: this.options.objectTemplate,
                object:   this._addObject,
            });
        },

        onObjectAddButtonClick: function() {
            var newObj = this.createObject(this._addObject.serialize());
            this._object.push(newObj);
            // Restore only work on attribute that existed at the time
            // of backup() so clear all the attributes to make sure nothing
            // is left over.
            for (var k in this._addObject)
                this._addObject.removeAttr(k);
            this._addObject.restore(true); // Restore the default object
            can.trigger(this._addObject, 'reload-data');
        },

        objectAddButton: function(el) {
            this._addButtons.push(el);
            return el.click(can.proxy(this.onObjectAddButtonClick, this));
        },

        onObjectDelButtonClick: function(obj, idx, _evt) {
            this._object.splice(idx, 1);
        },

        objectDelButton: function(el, obj, idx) {
            return el.click(can.proxy(this.onObjectDelButtonClick, this, obj, idx));
        },

        newEnv: function() {
            return can.extend(this._super(), {
                getObjectTitle: can.proxy(this.getObjectTitle, this),
                getAddTitle: can.proxy(this.getAddTitle, this),
                makeObjectEditor: can.proxy(this.makeObjectEditor, this),
                makeObjectCreator: can.proxy(this.makeObjectCreator, this),
                objectAddButton: can.proxy(this.objectAddButton, this),
                objectDelButton: can.proxy(this.objectDelButton, this),
            });
        },
    });

    return Control.ListEditor;
});
