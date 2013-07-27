steal('coplanar/control', 'can',
function(Control, can) {

    Control.ObjectView = Control.extend({
        defaults: {
            template: null,
            env: null,
        },
    },{
        init: function () {
            this._super.apply(this, arguments);
            this._object = null;
            this._env = null;

            if (this.options['object'])
                this.open(this.options['object']);
        },

        onObjectChange: function(ev, attr, how, newVal, oldVal) {
        },

        newTemplateContext: function(data, parent) {
            return {
                data: data,
                attr: function(key, val) {
                    return data.attr.apply(data, arguments);
                },
                parent: parent,
                env: this.env(),
                root: this.element,
                view: this.options.view, // This doesn't really belong here, but well…
            };
        },

        render: function(obj, parent, template) {
            template = template || this.options.template;
            obj = obj || this._object;
            return can.$(can.view(template, this.newTemplateContext(obj, parent), this.env(), null));
        },

        open: function (obj) {
            this.close();

            this._object = obj;
            this.element.html(this.render());
            if (obj.bind) {
                this._onObjectChange = can.proxy(this.onObjectChange, this);
                this._object = obj.bind('change', this._onObjectChange);
            }
        },

        close: function() {
            if (this._object != null && this._onObjectChange != null)
                this._object.unbind('change', this._onObjectChange);

            this._object = null;
            this._onObjectChange = null;

            this.element.html('');
        },

        /*
         * Utils functions for the templates
         */
        newEnv: function() {
            var view = this;
            return can.extend({
                getContext: function() {
                    return this._data;
                },

                getData: function() {
                    return this.getContext().data;
                },

                render: function(obj, template) {
                    return view.render(obj, this.getContext(), template);
                },

                url: function(args, abs) {
                    return can.route.url(args, !abs);
                },

                anchor: function(args, abs) {
                    return this.url(args, abs).substr(1);
                },
            }, this.options.viewEnv || {});
        },

        env: function() {
            if (this._env == null)
                this._env = this.newEnv();
            return this._env;
        },
    });

    return Control.ObjectView;
});
