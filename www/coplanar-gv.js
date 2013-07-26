steal('jquery', 'can', 'coplanar',
      'coplanar/model/couchdb',
      'coplanar/control/modeleditor',
      'coplanar/control/listeditor',
      'coplanar/control/calendar',
function (jQuery, can, coplanar) {

    var couchURL = 'http://localhost:5984';

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

    // We use a large DB mixing various document types. Documents must
    // have a 'docType' field and we have a view to get all documents
    // from a given type.
    var GVModel = coplanar.Model.CouchDB.extend({
        baseURL: couchURL,
        dbName: 'gv',
        designDoc: 'coplanar',
        docType: null,

        getDefaultObject: function (data) {
            return this._super(can.extend({
                docType: this.docType,
            }, data));
        },

        init: function() {
            this.modelName = this.docType;
            this._super.apply(this, arguments);
            this.validatePresenceOf("docType");
        },

        getFindAllPath: function(params) {
            return '/_design/' + this.designDoc + '/_view/docType' +
                '?include_docs=true&key=' + encodeURIComponent(JSON.stringify(this.docType));
        },

        onFindOneError: function(start, end, callback, xhr) {
            var self = this;
            if (xhr.status == 401) {
                console.log('Need to login to get the events');
                this.options.app.loginDialog()
                    .done(function() {
                        // Restart now that we are logged in
                        console.log('Restart getEvents', arguments);
                        self.getEvents(start, end, callback);
                    });
            }
        },
    },{
    });

    var PlannableModel = GVModel.extend({
        init: function() {
            this._super.apply(this, arguments);
            this.validatePresenceOf("state");
            this.validatePresenceOf("start");
            //this.validatePresenceOf("title");
        },
        getDefaultObject: function (data) {
            return this._super(can.extend({
                state: 'unconfirmed',
            }, data));
        },
    },{
    });


    var HostelModel = PlannableModel.extend({
        docType: 'Hostel',

        getDefaultObject: function (data) {
            return this._super(can.extend({
                state: 'unconfirmed',
                personCount: 1,
            }, data));
        },

        init: function() {
            this._super.apply(this, arguments);
            this.validatePresenceOf("start");
            this.validatePresenceOf("personCount");
            this.validatePresenceOf("contact");
        },
    },{
    });

    var EventProgram = coplanar.Model({
        init: function() {
            this._super.apply(this, arguments);
            this.validatePresenceOf("start");
            this.validatePresenceOf("showType");
            this.validatePresenceOf("title");
        },
    },{});

    var EventsModel = PlannableModel.extend({
        docType: 'Event',
        attributes: {
            'hostel': 'refList:Hostel',
        },
        init: function() {
            this._super.apply(this, arguments);
            this.validatePresenceOf("eventType");
            this.validatePresenceOf("title");
        },
        getDefaultObject: function (data) {
            return this._super(can.extend({
                hostel: [],
                program: [],
            }, data));
        },
    },{
    });


    /*
     * Generic Controls
     */
    var GVEditor = coplanar.Control.ModelEditor.extend({
        formatDate: function(date) {
            return jQuery.datepicker.formatDate(this.options.datePickerOptions.dateFormat, date);
        },

        'input[name="_withEnd"] change': function(el, evt) {
            var end = $('input[name="end"]', el.parent().parent());
            if (el[0].checked) {
                var start = can.$('input[name="start"]', el.parent().parent());
                if (start[0].value != '') {
                    var date = new Date(start[0].value);
                    date.setDate(date.getDate()+1);
                    end[0].value = this.formatDate(date);
                }
                end.parent().show();
            } else {
                end.val('').change();
                end.parent().hide();
            }
        },

        'input[name="start"] change': function(el, evt) {
            var date = new Date(el[0].value);
            date.setDate(date.getDate()+1);
            can.$('input[name="end"]', el.parent())
                .datepicker('option', 'minDate', this.formatDate(date));
        },

        newEnv: function() {
            return can.extend(this._super(), {
                HostelModel: function (args) {
                    return new HostelModel(args);
                },
                EventProgram: function(args) {
                    return new EventProgram(args);
                },
            });
        },

    });

    /*
     * User profile
     */
    var UserEditor = GVEditor.extend({
        defaults: {
            template: 'ui/user-editor.ejs',
        },
    },{});


    /*
     * Event controls
     */
    var EventProgramListEditor = coplanar.Control.ListEditor.extend({
        defaults: {
            template: 'ui/list-editor-accordion.ejs',
            objectTemplate: 'ui/event-program-editor.ejs',
            objectFactory: function(args) {
                return EventProgram.getDefaultObject(args);
            },
        },
    },{
        getObjectTitle: function(prog, idx) {
            return (prog.attr('start') ? prog.attr('start') + ' - ' : '') +
                (prog.attr('title') || 'Show #' + (i+1)) +
                (prog.attr('showType') ? ' (' + prog.attr('showType') + ')' : '');
        },

        getAddTitle: function() {
            return 'Add program entry';
        },
    });

    var EventHostelListEditor = coplanar.Control.ListEditor.extend({
        defaults: {
            template: 'ui/list-editor-accordion.ejs',
            objectTemplate: 'ui/hostel-editor.ejs',
            objectFactory: function(args) {
                return HostelModel.getDefaultObject(args);
            },
        },
    },{
        getAddTitle: function() {
            return 'Add hostel reservation';
        },
    });

    var EventEditor = GVEditor.extend({
        defaults: {
            template: 'ui/event-editor.ejs',
        },
    },{
        newEnv: function() {
            var editor = this;
            return can.extend(this._super(), {
                eventProgramListEditor: function(el, args) {
                    return new EventProgramListEditor(el, args);
                },
                eventHostelListEditor: function(el, args) {
                    return new EventHostelListEditor(el, args);
                },
            });
        },
    });

    var EventCreator = EventEditor.Creator();

    var EventCalendar = coplanar.Control.Calendar.extend({
        defaults: {
            model: EventsModel,
            calendarOptions: {
                header: {
                    left:   '',
                    center: 'title',
                    right:  'today prev next'
                },
                firstDay: 3,
                allDayDefault: true,
                editable: false,
                timeFormat: 'HH:mm',
            },
        },
    },{
        eventAfterRender: function(event, element, view) {
            var status;
            can.$('<div>', {
                'class': 'fc-event-location',
                text: event.location,
            }).prependTo(element);
            if (event.state == 'unconfirmed')
                status = 'TBC';
            else if (event.state == 'canceled')
                status = 'CANCELED';
            if (status)
                can.$('<span>', {
                    text: status,
                    'class': 'fc-event-status', // fc-event-status-' + event.state,
                }).appendTo(can.$('.fc-event-inner', element));
            element.addClass('fc-event-' + event.state);
        },
    });

    var HostelCalendar = EventCalendar.extend({
        makeCalendarEvent: function(data) {
            var title = data.personCount > 1 ? (data.personCount + ' persons') : '1 person';
            return can.extend({title: title}, data);
        }
    });

    /*
     * Hostel controls
     */
    var HostelEditor = GVEditor.extend({
        defaults: {
            template: 'ui/hostel-editor.ejs',
            model: HostelModel,
        },
    },{
    });

    var HostelCreator = HostelEditor.Creator();

    /*
     * The coplanar application
     */
    var viewEnv = {
        HostelEditor: function(el, options) {
            return new HostelEditor(el, options);
        },
        HostelCreator: function(el, options) {
            return new HostelCreator(el, options);
        },
    };

    var CoplanarGV = coplanar.App.extend({
        defaults: {
            template: 'ui/coplanar-gv.ejs',
            defaultModel: 'event',
            viewEnv: viewEnv,
            models: {
                'user': {
                    model: GVModel.User,
                    defaultView: 'edit',
                    views: {
                        'edit': {
                            constructor: UserEditor,
                            routes: {
                                '/:id/:tab': null,
                                '/:id': null,
                            },
                        },
                    },
                },
                'event': {
                    model: EventsModel,
                    defaultView: 'calendar',
                    views: {
                        'calendar': {
                            constructor: EventCalendar,
                            routes: {
                                '/:year/:month': null,
                                '/:year': null,
                            },
                        },
                        'edit': {
                            constructor: EventEditor,
                            routes: {
                                '/:id/:tab': null,
                                '/:id': null,
                            },
                        },
                        'create': {
                            constructor: EventCreator,
                            routes: {
                                '/:tab': null,
                            },
                        },
                    },
                },
                'hostel': {
                    model: HostelModel,
                    defaultView: null,
                    'views': {
                        'calendar': {
                            constructor: HostelCalendar,
                            routes: {
                                '/:year': null,
                                '/:year/:month': null,
                            },
                        },
                        'edit': {
                            constructor: HostelEditor,
                            routes: {
                                '/:id': null,
                                '/:id/:tab': null,
                            },
                        },
                        'create': {
                            constructor: HostelCreator,
                            routes: {
                                '/:tab': null,
                            },
                        },
                    },
                },
            },
        },
    },{
        newEnv: function() {
            var self = this;
            return can.extend(this._super(), {
                getViewTitle: function() {
                    return can.route.attr('model') + ' / ' + can.route.attr('view');
                },
            });
        },

        onShowViewError: function(view, route, xhr) {
            this._super.apply(this, arguments);
            console.log('show view error', arguments);
            if (xhr.status === 401)
                this.loginDialog().done(can.proxy(this.showView, this, view, route));
        },

        login: function(credentials) {
            return can.ajax(couchURL + '/_session', {
                dataType: 'json',
                type: 'POST',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify(credentials),
                xhrFields: {
                    withCredentials: true,
                },
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
                                .done(function() {
                                    console.log('Logged in as', credentials.name);
                                    self.session.attr('username', credentials.name);
                                    self.session.attr('password', credentials.password);
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
    });

    can.route.ready(false);
    can.$(document).ready(function (evt) {
        var cop = new CoplanarGV('.coplanar-app');
        can.route.ready(true);
    });

});
