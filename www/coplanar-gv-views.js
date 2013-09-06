steal("coplanar", "can",
      'coplanar/model/db',
      'ui/user-editor.ejs',
      'ui/list-editor-accordion.ejs',
      'ui/event-program-editor.ejs',
      'ui/hostel-editor.ejs',
      'ui/event-editor.ejs',
      'ui/hostel-editor.ejs',
function(coplanar, can) {
    /*
     * This module provide a constructor function that create the
     * views using the provided models.
     */
    return function (models, session) {
        var views = {};
        /*
         * Generic Controls
         */
        views.GVEditor = coplanar.Control.ModelEditor.extend({
            formatDate: function(date) {
                return jQuery.datepicker.formatDate(
                    this.options.datePickerOptions.dateFormat, date);
            },

            'input[name="_withEnd"] change': function(el, evt) {
                var end = $('input[name="end"]', el.parent().parent());
                if (el[0].checked) {
                    var start = can.$('input[name="start"]',
                                      el.parent().parent());
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
                var self = this;
                return can.$.extend(this._super(), {
                    "session": function() {
                        return session;
                    },
                });
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
        views.EventProgramListEditor = coplanar.Control.ListEditor.extend({
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

        views.EventHostelListEditor = coplanar.Control.ListEditor.extend({
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

        views.EventCalendar = coplanar.Control.Calendar.extend({
            defaults: {
                model: models.Event,
                calendarOptions: {
                    header: {
                        left:   '',
                        center: 'title',
                        right:  'today prev next'
                    },
                    firstDay: 1,
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
                        'class': 'fc-event-status',
                        // fc-event-status-' + event.state,
                    }).appendTo(can.$('.fc-event-inner', element));
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
                    this.element.fullCalendar('refetchEvents');
                this._super(route, updateData);
            },
        });

        views.HostelCalendar = views.EventCalendar.extend({
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
