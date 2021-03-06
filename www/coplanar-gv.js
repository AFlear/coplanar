steal('jquery', 'can', 'coplanar', './coplanar-gv-config.js',
      './coplanar-gv-models.js', './coplanar-gv-views.js',
      'coplanar/db/couchdb',
      'coplanar/model/db',
      'coplanar/control/modeleditor',
      'coplanar/control/listeditor',
      'coplanar/control/calendar',
      'ui/coplanar-gv.ejs',
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
            var models = gvModels(this.db, this.session);
            var views = gvViews(models, this.session);
            this.pages = {
                'user': {
                    model: models.User,
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

        newEnv: function() {
            var self = this;
            return can.extend(this._super(), {
                getViewTitle: function() {
                    return can.route.attr('model') + ' / ' + can.route.attr('view');
                },
            });
        },
    });

    CoplanarGV.Session = coplanar.App.Session.extend({
        hasRole: function() {
            var roles = this.attr('roles');
            if (roles == null || roles.indexOf == null)
                return false;
            for (var i in arguments)
                if (roles.indexOf(arguments[i]) >= 0)
                    return true;
            return false;
        },

        isLocationAdmin: function(room) {
            if (this.isAdmin())
                return true;
            return room ? this.hasRole('' + room + ' Admin') : false;
        },

        isAdmin: function() {
            return this.hasRole('_admin', 'Coplanar Admin');
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
