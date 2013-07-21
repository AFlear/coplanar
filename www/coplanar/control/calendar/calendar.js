steal('coplanar/control', 'can', 'jquery',
      'jquery-ui', 'fullcalendar',
function(Control, can, jQuery) {

    Control.Calendar = Control.extend({
        defaults: {
            model: null,
            eventsView: 'edit',
            calendarOptions: {},
            defaultCalendarView: 'month',
        },

        weekToDate: function(year, wn, dayNb){
            if (dayNb == null)
                dayNb = 0;
            var j10 = new Date( year,0,10,12,0,0);
            var j4 = new Date( year,0,4,12,0,0);
            var mon1 = j4.getTime() - j10.getDay() * 86400000;
            return new Date(mon1 + ((wn - 1)  * 7  + dayNb) * 86400000);
        },
    },{
        init: function () {
            this._super.apply(this, arguments);
            this._eventsFetched = undefined;
            this._events = [];
            var inited = false;
            this.element.fullCalendar(can.extend({
                viewDisplay: function(view) {
                    // We don't want to alter the initial view
                    if (inited === false) {
                        inited = true;
                        return;
                    }
                    if (can.route.attr('calendarView') === 'month') {
                        can.route.redirect({
                            year: jQuery.datepicker.formatDate('yy', view.start),
                            month: jQuery.datepicker.formatDate('mm', view.start),
                        }, true);
                    } else if (can.route.attr('calendarView') === 'week') {
                        var week = jQuery.fullCalendar.formatDate(view.start, 'W');
                        can.route.redirect({
                            // On week 1 we must use the end date for the year.
                            year: jQuery.datepicker.formatDate(
                                'yy', parseInt(week) > 1 ? view.start : view.end),
                            week: week,
                        }, true);
                    } else if (can.route.attr('calendarView') === 'day') {
                        can.route.redirect({
                            year: jQuery.datepicker.formatDate('yy', view.start),
                            month: jQuery.datepicker.formatDate('mm', view.start),
                            day: jQuery.datepicker.formatDate('dd', view.start),
                        }, true);
                    }
                },
                events: this._events,
                eventClick: can.proxy(this.eventClick, this),
                dayClick: can.proxy(this.dayClick, this),
                eventAfterRender: can.proxy(this.eventAfterRender, this),
                dayRender: can.proxy(this.dayRender, this)
            }, this.options.calendarOptions));
            this.options.model.bind('updated', can.proxy(this.onModelUpdated, this));
        },

        makeCalendarEvent: function(data) {
            return can.extend({}, data);
        },

        getEvents: function(start, end, callback) {
            return this.options.model.findAll({})
                .done(callback);
        },

        updateEvents: function() {
            var self = this;
            return this.getEvents()
                .done(function(events) {
                    self._events.length = 0;
                    for (var i in events)
                        self._events.push(self.makeCalendarEvent(events[i]));
                    self.element.fullCalendar('refetchEvents')
                });
        },


        onModelUpdated: function (domEvent, obj) {
            // This only work while the calendar is visible :(
            // To over come this we force a rerender in the show method.
            console.log('onModelUpdated !!!');
            //this.element.fullCalendar('updateEvent', obj);
            this.updateEvents();
        },

        eventClick: function(event, jsEvent, view) {
            can.route.redirect({ model: can.route.attr('model'),
                                 view: this.options.eventsView,
                                 id: event[this.options.model.id]});
        },

        dayClick: function(date, allDay, jsEvent, view) {
        },

        eventAfterRender: function(event, element, view) {
        },

        dayRender: function( date, cell ) {
        },

        show: function() {
            this._super();
            // Make sure the view is up to date with the data
            this.element.fullCalendar('rerenderEvents');
        },

        setRoute: function(route) {
            var def, self = this;
            if (this._eventsFetched === undefined) {
                this._eventsFetched = false;
                def = this.updateEvents()
                    .done(function() {
                        self._eventsFetched = true;
                    })
                    .fail(function() {
                        self._eventsFetched = undefined;
                    });
            } else
                def = can.when();

            def.done(function () {
                // Normalize the view name
                var calendarView = route.calendarView || self.options.defaultCalendarView;
                if (calendarView !== 'month' &&
                    calendarView !== 'week' &&
                    calendarView !== 'day')
                    calendarView = 'month';

                // Map to fullcalendar names
                var fcView;
                if (calendarView === 'week')
                    fcView = 'basicWeek';
                else if (calendarView === 'day')
                    fcView = 'basicDay';
                else
                    fcView = 'month';

                // Change the view if needed
                if (self.element.fullCalendar('getView').name !== fcView) {
                    console.log('Change view');
                    self.element.fullCalendar('changeView', fcView);
                }

                // Set the date
                var date, today = new Date();
                var year = route.year ? parseInt(route.year) : today.getFullYear();
                if (calendarView === 'week') {
                    date = route.week ?
                        Calendar.weekToDate(year, parseInt(route.week), 1) :
                        today;
                } else {
                    var month = route.month ? parseInt(route.month)-1 : today.getMonth();
                    var day = route.day ? parseInt(route.day) : today.getDate();
                    date = new Date(year, month, day);
                }

                console.log('Goto date:', date);
                self.element.fullCalendar('gotoDate', date)
            });

            return def;
        }
    });

    return Control.Calendar;
});
