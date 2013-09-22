steal('coplanar/control', 'can', 'jquery',
      'jquery-ui', 'fullcalendar',
function(Control, can, jQuery) {

    Control.Calendar = Control.extend({
        defaults: {
            model: null,
            eventsView: 'edit',
            calendarOptions: {},
            defaultCalendarView: 'month',
            template: null,
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
            this.eventsFilter = {};
            if (this.options.template)
                can.$(can.view(this.options.template, {}, this.templateEnv(), null))
                    .appendTo(this.element);
            if (this._calendar == null)
                this._calendar = this.element;
            this.fullCalendar(can.extend({
                events: can.proxy(this.getEvents, this),
                eventDataTransform: can.proxy(this.makeCalendarEvent, this),
                eventClick: can.proxy(this.eventClick, this),
                dayClick: can.proxy(this.dayClick, this),
                eventAfterRender: can.proxy(this.eventAfterRender, this),
                eventRender: can.proxy(this.eventRender, this),
                dayRender: can.proxy(this.dayRender, this)
            }, this.options.calendarOptions));
            this.options.model.bind('updated', can.proxy(this.onModelUpdated, this));
            this.options.model.bind('created', can.proxy(this.onModelUpdated, this));
            this.options.model.bind('destroyed', can.proxy(this.onModelUpdated, this));
        },

        templateEnv: function() {
            var self = this;
            return {
                setCalendarElement: function(el) {
                    self._calendar = el;
                },

                bindRouteAttr: function(el, attr) {
                    el.val(can.route.attr(attr));
                    can.route.bind(attr, function(ev, newVal, oldVal) {
                        el.val(newVal);
                    });
                    return el
                        .change(function (evt) {
                            var val = el.val();
                            if (val)
                                can.route.attr(attr, val);
                            else
                                can.route.removeAttr(attr);
                        });
                },

                getTitle: function() {
                    var calendarView = can.route.attr('calendarView') ||
                        self.options.defaultCalendarView;
                    if (calendarView === 'month') {
                        return jQuery.fullCalendar.formatDate(self.routeToDate(), 'MMMM yyyy');
                    } else if (calendarView === 'week') {
                        return 'Week ' + can.route.attr('week');
                    } else if (calendarView === 'day') {
                        return jQuery.fullCalendar.formatDate(self.routeToDate(), 'dddd, MMM d, yyyy');
                    }
                    else
                        return '';
                },

                nextPageButton: function(el) {
                    return el.click(function() {
                        var route = self.nextPageRoute();
                        if (route != null)
                            can.route.redirect(route, true);
                    });
                },

                prevPageButton: function(el) {
                    return el.click(function() {
                        var route = self.prevPageRoute();
                        if (route != null)
                            can.route.redirect(route, true);
                    });
                },
            };
        },

        dateToRoute: function(date, calendarView) {
            var route = {
                calendarView: calendarView,
                year: jQuery.fullCalendar.formatDate(date, 'yyyy'),
            };

            if (calendarView === 'week')
                route.week = jQuery.fullCalendar.formatDate(date, 'W');
            else {
                route.month = jQuery.fullCalendar.formatDate(date, 'MM');
                if (calendarView === 'day')
                    route.day = jQuery.fullCalendar.formatDate(date, 'dd');
            }

            return route;
        },

        nextPageRoute: function() {
            var calendarView = can.route.attr('calendarView') ||
                this.options.defaultCalendarView;

            var date = this.routeToDate();
            if (calendarView === 'month')
                date = new Date(date.getFullYear(), date.getMonth()+1, 1);
            else if (calendarView === 'week')
                date = new Date(date.getFullYear(), date.getMonth(), date.getDate()+7);
            else if (calendarView === 'day')
                date = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1);

            return this.dateToRoute(date, calendarView);
        },

        prevPageRoute: function() {
            var calendarView = can.route.attr('calendarView') ||
                this.options.defaultCalendarView;

            var date = this.routeToDate();
            if (calendarView === 'month')
                date = new Date(date.getFullYear(), date.getMonth()-1, 1);
            else if (calendarView === 'week')
                date = new Date(date.getFullYear(), date.getMonth(), date.getDate()-7);
            else if (calendarView === 'day')
                date = new Date(date.getFullYear(), date.getMonth(), date.getDate()-1);

            return this.dateToRoute(date, calendarView);
        },

        weekToDate: function(year, wn) {
            var firstDay = this.fullCalendar('option', 'firstDay');
            if (firstDay < 1)
                firstDay = 6;
            else
                firstDay -= 1;
            return this.constructor.weekToDate(year, wn, firstDay);
        },

        fullCalendar: function () {
            return this._calendar.fullCalendar.apply(this._calendar, arguments);
        },

        makeCalendarEvent: function(data) {
            return can.extend({}, data);
        },

        getEvents: function(start, end, callback) {
            return this.options.model.findAll(this.eventsFilter)
                .done(callback);
        },

        onModelUpdated: function (domEvent, obj) {
            // This only work while the calendar is visible :(
            // To over come this we force a rerender in the show method.
            console.log('onModelUpdated !!!');
            this.fullCalendar('refetchEvents');
        },

        eventClick: function(event, jsEvent, view) {
            can.route.redirect({ model: can.route.attr('model'),
                                 view: this.options.eventsView,
                                 id: event[this.options.model.id]});
        },

        dayClick: function(date, allDay, jsEvent, view) {
            var calendarView = can.route.attr('calendarView') || this.options.defaultCalendarView;
            if (calendarView !== 'day')
                can.route.redirect(this.dateToRoute(date, 'day'), true);
        },

        eventAfterRender: function(event, element, view) {
        },

        eventRender: function(event, element, view) {
        },

        dayRender: function( date, cell ) {
        },

        show: function() {
            this._super();
            // Make sure the view is up to date with the data
            this.fullCalendar('render');
        },

        routeToDate: function(route, calendarView) {
            if (route == null) {
                // We use this instead of just can.route.attr() to
                // properly work with live bindings.
                route = {
                    calendarView: can.route.attr('calendarView'),
                    year: can.route.attr('year'),
                    month: can.route.attr('month'),
                    day: can.route.attr('day'),
                    week: can.route.attr('week'),
                };
            }
            if (calendarView == null)
                calendarView = route.calendarView || this.options.defaultCalendarView;
            var today = new Date();
            var year = route.year ? parseInt(route.year) : today.getFullYear();
            if (calendarView === 'week') {
                return route.week ?
                    this.weekToDate(year, parseInt(route.week)) :
                    today;
            } else {
                var month = route.month ? parseInt(route.month)-1 : today.getMonth();
                var day = route.day ? parseInt(route.day) : today.getDate();
                return new Date(year, month, day);
            }
        },

        setRoute: function(route) {
            var routeAdd = {};

            // Normalize the view name
            var calendarView = route.calendarView || this.options.defaultCalendarView;
            if (calendarView !== 'month' &&
                calendarView !== 'week' &&
                calendarView !== 'day')
                calendarView = 'month';

            if (calendarView !== route.calendarView)
                routeAdd.calendarView = calendarView;

            // Normalize the date
            var today = new Date();
            if (route.year == null)
                routeAdd.year = jQuery.fullCalendar.formatDate(today, 'yyyy');
            if (calendarView === 'week') {
                if (route.week == null)
                    routeAdd.week = jQuery.fullCalendar.formatDate(today, 'W');
            } else {
                if (route.month == null)
                    routeAdd.month = jQuery.fullCalendar.formatDate(today, 'MM');
                if (calendarView === 'day' && route.day == null)
                    routeAdd.day = jQuery.fullCalendar.formatDate(today, 'dd');
            }

            // If the route used some default replace it with the full one
            if (!can.isEmptyObject(routeAdd)) {
                can.route.replace(routeAdd, true);
                return;
            }

            // Map to fullcalendar names
            var fcView;
            if (calendarView === 'week')
                fcView = 'basicWeek';
            else if (calendarView === 'day')
                fcView = 'basicDay';
            else
                fcView = 'month';

            // Change the view if needed
            if (this.fullCalendar('getView').name !== fcView) {
                console.log('Change view');
                this.fullCalendar('changeView', fcView);
            }

            // Set the date
            var date = this.routeToDate(route, calendarView);

            console.log('Goto date:', date);
            this.fullCalendar('gotoDate', date);
        }
    });

    return Control.Calendar;
});
