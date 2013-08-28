steal('coplanar/base.js', 'can',
      'coplanar/control/objecteditor',
function(coplanar, can) {

    var LoginModel = can.Model.extend({
        init: function() {
            this._super.apply(this, arguments);
            this.validatePresenceOf("name");
            this.validatePresenceOf("password");
        },
    },{
    });

    /*
     * The main app object
     */
    coplanar.App = coplanar.Control.ObjectEditor.extend({
        defaults: {
            viewEnv: null,
            template: null,
            defaultModel: null,
        },
    },{
        init: function() {
            this._super.apply(this, arguments);

            this.session = new this.constructor.Session({username: ''});
            this.pages = {};
            this.views = {};
            this._viewQueue = [];
            this.currentView = null;

            this.db = this.options.db;
            this.db.setLoginHandler(can.proxy(this.loginDialog, this));

            this.setupPages();

            if (this.options.defaultModel) {
                can.route("", {
                    model: this.options.defaultModel,
                    view: this.pages[this.options.defaultModel].defaultView,
                });
            }

            for (var modelName in this.pages) {
                var m = this.pages[modelName];
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

            // Get the current user session
            this.db.getUserSession(this.session)
                .done(can.proxy(function(data) {
                    this.session.attr(data);
                }, this));

            this.open(this.session);
        },

        setupPages: function() {
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
            var newView = this.getView(name);
            return can.when(newView.setRoute(route))
                .done(can.proxy(this.onShowViewDone, this, name, route, newView))
                .fail(can.proxy(this.onShowViewError, this, name, route))
                .always(can.proxy(function() {
                    this._viewQueue.shift();
                    if (this._viewQueue.length > 0)
                        this._showView.apply(this, this._viewQueue[0]);
                }, this));
        },

        onShowViewDone: function(name, route, newView) {
            if (newView != this.currentView) {
                if (this.currentView != null)
                    this.currentView.hide();
                newView.show();
            }
            this.currentView = newView;
            this.currentViewName = name;
        },

        onShowViewError: function(name, route, err) {
            var msg = null;
            if (err != null && err.statusText != null)
                msg = err.statusText;
            this.messageDialog('Error', "Failed to open " + can.route.url(route) +
                               (msg != null ? ": " + msg + "." : "."));
        },


        dialog: function(dialogOptions) {
            var div = can.$('<div>').appendTo(this.element);
            return div.dialog(dialogOptions)
                .on("dialogclose", function () {
                    div.remove();
                });
        },

        messageDialog: function(title, message, buttons) {
            return this.dialog({
                dialogClass: "ui-dialog-no-close",
                title: title,
                modal: true,
                closeOnEscape: false,
                buttons: buttons || {
                    'Ok': function() {
                        can.$(this).dialog('close');
                    },
                },
            })
                .append(can.$('<p>', {
                    text: message,
                }));
        },

        editorDialog: function(template, obj, dialogOptions, viewEnv) {
            var div = this.dialog(dialogOptions);
            var editor = new coplanar.Control.ObjectEditor(div, {
                template: template,
                object: obj,
                viewEnv: viewEnv,
            });
            div.data('editor', editor);
            return editor;
        },

        login: function(credentials) {
            var self = this;
            return this.db.login(credentials)
                .done(function(update) {
                    self.session.attr(update);
                    return self.session;
                });
        },

        loginDialog: function() {
            var self = this;
            var credentials = new LoginModel({name:'', password: '', statusMsg: ''});
            var def = new can.Deferred();
            this.editorDialog('ui/login.ejs', credentials, {
                dialogClass: "ui-dialog-no-close",
                title: 'Please login',
                modal: true,
                closeOnEscape: false,
                buttons: [
                    {
                        text: 'Login',
                        click: function(evt) {
                            var dialog = can.$(this);
                            self.login(credentials.serialize())
                                .done(function(session) {
                                    console.log('Logged in as', credentials.name);
                                    dialog.dialog('close');
                                    def.resolve(credentials);
                                })
                                .fail(function () {
                                    console.log('Login failed!');
                                    credentials.attr('statusMsg', 'Login failed');
                                });
                        },
                    },
                ],
            });

            return def;
        },

        logout: function () {
            var self = this;
            this.db.logout(this.session)
                .done(function(data) {
                    self.session.attr('username', '');
                });
        },

        newEnv: function() {
            var self = this;
            return can.$.extend(this._super(), {
                getViewName: function() {
                    return self.currentViewName;
                },
                logout: can.proxy(this.logout, this),
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
            var model = this.pages[newRoute.model];
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

    coplanar.App.Session = can.Model.extend({});

    return coplanar.App;
});
