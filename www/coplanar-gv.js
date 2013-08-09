steal('jquery', 'can', 'coplanar', './coplanar-gv-config.js',
      './coplanar-gv-models.js', './coplanar-gv-views.js',
      'coplanar/db/couchdb',
      'coplanar/model/db',
      'coplanar/control/modeleditor',
      'coplanar/control/listeditor',
      'coplanar/control/calendar',
function (jQuery, can, coplanar, config,
          gvModels, gvViews) {

    /*
     * Database
     */

    var GVDb = coplanar.Db.CouchDB.extend({
    },{
        init: function(cfg) {
            this.baseURL   = cfg.baseURL;
            this.dbName    = cfg.dbName || 'gv';
            this.designDoc = cfg.designDoc || 'coplanar';
        },

        getFindAllPath: function(model, params) {
            return '/_design/' + this.designDoc + '/_view/docType' +
                '?include_docs=true&key=' +
                encodeURIComponent(JSON.stringify(model.docType));
        },
    });


    /*
     * Data models
     */

    var LoginModel = can.Model.extend({
        init: function() {
            this._super.apply(this, arguments);
            this.validatePresenceOf("name");
            this.validatePresenceOf("password");
        },
    },{
    });

    /*
     * The coplanar application
     */

    var calendarRoutes = {
        '': { calendarView: 'month' },
        '/': { calendarView: 'month' },

        '/:year': { calendarView: 'month' },
        '/:year/': { calendarView: 'month' },

        '/:year/week': { calendarView: 'week' },
        '/:year/week/': { calendarView: 'week' },
        '/:year/week/:week': { calendarView: 'week' },

        '/:year/:month': { calendarView: 'month' },
        '/:year/:month/': { calendarView: 'month' },
        '/:year/:month/:day': { calendarView: 'day' },
    };

    var CoplanarGV = coplanar.App.extend({
        defaults: {
            template: 'ui/coplanar-gv.ejs',
            defaultModel: 'event',
        },
    },{
        setupPages: function() {
            var models = gvModels(this.db);
            var views = gvViews(models);
            this.pages = {
                'user': {
                    model: models.GVModel.User,
                    defaultView: 'edit',
                    views: {
                        'edit': {
                            constructor: views.UserEditor,
                            routes: {
                                '/:id/:tab': null,
                                '/:id': null,
                            },
                        },
                    },
                },
                'event': {
                    model: models.Event,
                    defaultView: 'calendar',
                    views: {
                        'calendar': {
                            constructor: views.EventCalendar,
                            routes: calendarRoutes,
                        },
                        'edit': {
                            constructor: views.EventEditor,
                            routes: {
                                '/:id/:tab': null,
                                '/:id': null,
                            },
                        },
                        'create': {
                            constructor: views.EventCreator,
                            routes: {
                                '/:tab': null,
                            },
                        },
                    },
                },
                'hostel': {
                    model: models.Hostel,
                    defaultView: 'calendar',
                    'views': {
                        'calendar': {
                            constructor: views.HostelCalendar,
                            routes: calendarRoutes,
                        },
                        'edit': {
                            constructor: views.HostelEditor,
                            routes: {
                                '/:id': null,
                                '/:id/:tab': null,
                            },
                        },
                        'create': {
                            constructor: views.HostelCreator,
                            routes: {
                                '/:tab': null,
                            },
                        },
                    },
                },
            };
        },

        init: function() {
            var self = this;

            this.db = this.options.db;
            this.db.setLoginHandler(can.proxy(this.loginDialog, this));
            this.pages = this.makePages();

            this._super.apply(this, arguments);

            // Get the current user session
            this.db.getUserSession(this.session)
                .done(function(data) {
                    self.session.attr(data);
                });
        },

        newEnv: function() {
            var self = this;
            return can.extend(this._super(), {
                getViewTitle: function() {
                    return can.route.attr('model') + ' / ' + can.route.attr('view');
                },
                logout: can.proxy(this.logout, this),
            });
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
    });

    can.route.ready(false);
    can.$(document).ready(function (evt) {
        var db = new GVDb(config);
        var app = new CoplanarGV('.coplanar-app', {
            db: db,
        });
        if (steal.dev) {
            window._db = db;
            window._app = app;
        }
        can.route.ready(true);
    });

});
