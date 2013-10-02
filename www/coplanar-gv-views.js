steal("coplanar", "can",
      'coplanar/model/db',
      'ui/user-editor.ejs',
      'ui/list-editor-accordion.ejs',
      'ui/event-program-editor.ejs',
      'ui/hostel-editor.ejs',
      'ui/event-editor.ejs',
      'ui/hostel-editor.ejs',
      'ui/event-calendar.ejs',
      'ui/list-item-editor.ejs',
function(coplanar, can) {
    /*
     * This module provide a constructor function that create the
     * views using the provided models.
     */
    return function (models, session) {
        var views = {};

        var dataTypes = {
            state: [
                {
                    name: "TBC",
                    value: "unconfirmed",
                },
                {
                    name: "Confirmed",
                    value: "confirmed",
                    canSet: function(obj) {
                        return session.isAdmin();
                    },
                },
                {
                    name: "Canceled",
                    value: "canceled",
                },
            ],
            location: [
                "Brache",
                "Druckerei",
                "Fabrik Links",
                "Fabrik Rechts",
                "Fabrik Keller",
                "Jupi",
                "Loge",
                "Kaschemme",
                "Kindergarten",
                "Links Rechts",
                "Teestübe",
                "Puppenstube",
            ],
            eventType: [
                "Ausstellung",
                "Filmabend",
                "Konzert",
                "Lesung",
                "Party",
            ],
        };

        function extendWithGlobalEnv(env) {
            return can.extend(env || {}, {
                session: function() {
                    return session;
                },
                makeTypeChoices: function(type, set) {
                    var html = '';
                    if (typeof type === 'string')
                        type = dataTypes[type];
                    can.each(type, can.proxy(function(t, i) {
                        if (typeof t !== 'object')
                            t = { value: '' + t };
                        if (t.value == null)
                            return;
                        if (set && t.canSet != null && !t.canSet(this.getData && this.getData()))
                            return;
                        html += '<option value="' + can.esc(t.value) + '">' +
                            can.esc(t.name || t.value) + '</option>';
                    }, this));
                    return html;
                },
            });
        }

        /*
         * Generic Controls
         */
        views.GVEditor = coplanar.Control.ModelEditor.extend({
            defaults: {
                datePickerOptions: {
                    firstDay: 4,
                },
            },
        },{

            formatDate: function(date) {
                return jQuery.datepicker.formatDate(
                    this.options.datePickerOptions.dateFormat, date);
            },

            'input[name="_withEnd"] change': function(el, evt) {
                var end = $('input[name="end"]', el.parent().parent());
                if (el[0].checked) {
                    var start = can.$('input[name="start"]',
                                      el.parent().parent());
                    if (start.val() != '') {
                        var date = new Date(start.val()).nextDay();
                        end.datepicker('option', 'minDate', this.formatDate(date));
                        end.val(this.formatDate(date)).change();
                    }
                    end.parent().show();
                } else {
                    end.val('').change();
                    end.parent().hide();
                }
            },

            'input[name="start"] change': function(el, evt) {
                var date = new Date(el.val()).nextDay();
                can.$('input[name="end"]', el.parent())
                    .datepicker('option', 'minDate', this.formatDate(date));
            },

            newEnv: function() {
                return extendWithGlobalEnv(this._super());
            },
        });

        /*
         * User profile
         */
        views.UserEditor = views.GVEditor.extend({
            defaults: {
                template: 'ui/user-editor.ejs',
            },
        },{
        });

        /*
         * Event controls
         */
        views.ListEditorItem = views.GVEditor.extend({
            defaults: {
                editorTemplate: 'ui/list-item-editor.ejs',
            },
        },{
        })

        views.ListEditor = coplanar.Control.ListEditor.extend({
            defaults: {
                editorTemplate: 'ui/model-editor.ejs',
                ObjectEditor: views.ListEditorItem,
            },
        },{
        });

        views.EventProgramListEditor = views.ListEditor.extend({
            defaults: {
                template: 'ui/list-editor-accordion.ejs',
                objectTemplate: 'ui/event-program-editor.ejs',
                objectFactory: function(args) {
                    return models.EventProgram.getDefaultObject(args);
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

        views.EventHostelListEditor = views.ListEditor.extend({
            defaults: {
                template: 'ui/list-editor-accordion.ejs',
                objectTemplate: 'ui/hostel-editor.ejs',
                objectFactory: function(args) {
                    return models.Hostel.getDefaultObject(args);
                },
            },
        },{
            getObjectTitle: function(hostel, idx) {
                return hostel.attr('start') + ' - ' +
                    hostel.attr('personCount') + ' ' +
                    (hostel.attr('personCount') > 0 ? 'persons' : 'person');
            },

            getAddTitle: function() {
                return 'Add hostel reservation';
            },
        });

        views.EventEditor = views.GVEditor.extend({
            defaults: {
                template: 'ui/event-editor.ejs',
            },
        },{
            newEnv: function() {
                var editor = this;
                return can.extend(this._super(), {
                    eventProgramListEditor: function(el, args) {
                        return new views.EventProgramListEditor(el, args);
                    },
                    eventHostelListEditor: function(el, args) {
                        return new views.EventHostelListEditor(el, args);
                    },
                });
            },
        });

        views.EventCreator = views.EventEditor.Creator();

        views.GVCalendar = coplanar.Control.Calendar.extend({
            defaults: {
                calendarOptions: {
                    firstDay: 4,
                    weekNumbers: true,
                    weekMode: 'variable',
                    allDayDefault: true,
                    editable: false,
                    timeFormat: 'HH:mm',
                },
            },
        },{
            templateEnv: function() {
                return extendWithGlobalEnv(this._super());
            },
        });

        views.PlannableCalendar = views.GVCalendar.extend({
        },{
            eventRender: function(event, element, view) {
                if (can.route.attr('state') == null) {
                    var status;
                    if (event.state == 'unconfirmed')
                        status = 'TBC';
                    else if (event.state == 'canceled')
                        status = 'CANCELED';
                    if (status)
                        can.$('<span>', {
                            text: status,
                            'class': 'fc-event-status',
                        }).appendTo(can.$('.fc-event-inner', element));
                }
                element.addClass('fc-event-' + event.state);
            },

            setRoute: function(route) {
                var attrs = ["state", "eventType", "location"];
                var updateData = false;
                for (var i in attrs) {
                    var attr = attrs[i];
                    if (route[attr] !== this.eventsFilter[attr]) {
                        updateData = true;
                        if (route[attr] != null)
                            this.eventsFilter[attr] = route[attr];
                        else
                            delete this.eventsFilter[attr];
                    }
                }
                if (updateData)
                    this.fullCalendar('refetchEvents');
                this._super(route, updateData);
            },
        });

        views.EventCalendar = views.PlannableCalendar.extend({
            defaults: {
                model: models.Event,
                template: 'ui/event-calendar.ejs',
            },
        },{
            eventRender: function(event, element, view) {
                if (can.route.attr('eventType') == null) {
                    can.$('<span>', {
                        text: event.eventType,
                        'class': 'fc-event-type',
                    }).prependTo(can.$('.fc-event-inner', element));
                }
                //element.addClass('fc-event-' + event.eventType);
                if (can.route.attr('location') == null && event.location) {
                    can.$('<div>', {
                        text: event.location,
                        'class': 'fc-event-location',
                    }).prependTo(can.$('.fc-event-inner', element));
                }
                //element.addClass('fc-event-' + event.location);
                this._super.apply(this, arguments);
            },
        });

        views.HostelCalendar = views.PlannableCalendar.extend({
            makeCalendarEvent: function(data) {
                var title = data.personCount > 1 ? (data.personCount + ' persons') : '1 person';
                return can.extend({title: title}, data);
            }
        });

        /*
         * Hostel controls
         */
        views.HostelEditor = views.GVEditor.extend({
            defaults: {
                template: 'ui/hostel-editor.ejs',
                model: models.Hostel,
            },
        },{
        });

        views.HostelCreator = views.HostelEditor.Creator();

        return views;
    };
});
