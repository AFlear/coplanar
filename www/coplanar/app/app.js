steal('coplanar/base.js', 'can',
      'coplanar/control/objecteditor',
function(coplanar, can) {

    /*
     * The main app object
     */
    coplanar.App = coplanar.Control.ObjectEditor.extend({
        defaults: {
            viewEnv: null,
            template: null,
            defaultModel: null,
            models: {},
        },
    },{
        init: function() {
            this._super.apply(this, arguments);

            this.session = new can.Model({username: '', password: ''});
            this.views = {};
            this._viewQueue = [];
            this.currentView = null;

            if (this.options.defaultModel) {
                can.route("", {
                    model: this.options.defaultModel,
                    view: this.options.models[this.options.defaultModel].defaultView,
                });
            }

            for (var modelName in this.options.models) {
                var m = this.options.models[modelName];
                if (m.defaultView !== null)
                    can.route(modelName, { model: modelName, view: m.defaultView });
                for (var viewName in m.views) {
                    var v = m.views[viewName];
                    var path = modelName + '/' + viewName;
                    var route = { model: modelName, view: viewName };
                    this.addView(path, v.constructor, m.model);
                    //console.log('Route', path, route);
                    can.route(path, route);
                    for (var routeSuffix in v.routes) {
                        var r = can.extend({} , can.extend(route, v.routes[routeSuffix] || {}));
                        //console.log('Route', path + routeSuffix, r);
                        can.route(path + routeSuffix, r);
                    }
                }
            }

            this.open(this.session);
        },

        createView: function(name, klass, model) {
            var div = can.$('<div>')
                .appendTo(can.$('.coplanar-view', this.element));
            var args = {app: this, model: model, view: name, viewEnv: this.options.viewEnv};
            var view = new klass(div, args);
            this.views[name] = function() {
                return view;
            };
            return view;
        },

        addView: function(name, klass, model) {
            var self = this;
            this.views[name] = function () {
                return self.createView(name, klass, model);
            };
            return this;
        },

        getView: function(name) {
            var getView = this.views[name];
            if (getView == null)
                throw('View ' + name + ' does not exists');
            return getView();
        },

        showView: function(name, route) {
            if (this._viewQueue.length > 0) {
                var tail = this._viewQueue[this._viewQueue.length-1];
                if (name == tail[0] &&
                    JSON.stringify(route) == JSON.stringify(tail[1])) {
                    return;
                }
            }
            this._viewQueue.push([name, route]);
            if (this._viewQueue.length == 1)
                this._showView.apply(this, this._viewQueue[0]);
        },

        _showView: function(name, route) {
            var self = this;
            var newView = this.getView(name);
            if (newView != this.currentView &&
                this.currentView != null )
                this.currentView.hide();
            return can.when(newView.setRoute(route))
                .done(can.proxy(this.onShowViewDone, this, name, route, newView))
                .fail(can.proxy(this.onShowViewError, this, name, route));
        },

        onShowViewDone: function(name, route, newView) {
            if (newView != this.currentView)
                newView.show();
            this.currentView = newView;
            this.currentViewName = name;
            this._viewQueue.shift();
            if (this._viewQueue.length > 0)
                this._showView.apply(this, this._viewQueue[0]);
        },

        onShowViewError: function() {
            if (this.currentView != null)
                this.currentView.show();
            this._viewQueue.shift();
            if (this._viewQueue.length > 0)
                this._showView.apply(this, this._viewQueue[0]);
        },


        dialog: function(dialogOptions) {
            var div = can.$('<div>').appendTo(this.element);
            return div.dialog(dialogOptions)
                .on("dialogclose", function () {
                    div.remove();
                });
        },

        editorDialog: function(template, obj, dialogOptions) {
            var div = this.dialog(dialogOptions);
            var editor = new coplanar.Control.ObjectEditor(div, {
                template: template,
                object: obj,
            });
            div.data('editor', editor);
            return editor;
        },

        newEnv: function() {
            var self = this;
            return can.$.extend(this._super(), {
                getViewName: function() {
                    return self.currentViewName;
                },
            });
        },

        _routeChangeId: undefined,

        '{can.route} change': function (routeObs, evt, attr, newVal, oldVal) {
            if (evt.batchNum === this._routeChangeId)
                return;
            this._routeChangeId = evt.batchNum;
            // Our routes have the form: {model}/{view}/{params}

            var newRoute = routeObs.attr();
            //console.log('Route changed', JSON.stringify(newRoute));
            if (newRoute.model == null) {
                if (this.options.defaultModel != null)
                    can.route.replace(can.extend({model: this.options.defaultModel}, newRoute));
                // else 404
                console.log('No model in route!');
                return;
            }
            var model = this.options.models[newRoute.model];
            if (model == null) {
                console.log('Bad model in route!');
                // 404
                return;
            }

            if (newRoute.view == null) {
                if (model.defaultView != null)
                    can.route.replace(can.extend({view: model.defaultView}, newRoute));
                console.log('No view in route!');
                // else 404
                return;
            }

            var path = newRoute.model + '/' + newRoute.view;
            delete newRoute.model;
            delete newRoute.view;
            delete newRoute.route;
            //console.log('Route changed to', path, JSON.stringify(newRoute));
            this.showView(path, newRoute);
        },
        'route': function() {
        },
    });

    return coplanar.App;
});
