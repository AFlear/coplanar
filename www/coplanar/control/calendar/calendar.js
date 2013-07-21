steal('coplanar/control', 'can', 'jquery',
      'jquery-ui', 'fullcalendar',
function(Control, can, jQuery) {

    Control.Calendar = Control.extend({
        defaults: {
            model: null,
            eventsView: 'edit',
            calendarOptions: {},
        },
    },{
        init: function () {
            this._super.apply(this, arguments);
            this._eventsFetched = undefined;
            this._events = [];
            this.element.fullCalendar(can.extend({
                viewDisplay: function(view) {
                    if (view.name === 'month') {
                        if (can.route.attr('month') == null ||
                            can.route.attr('year') == null)
                            can.route.replace({
                                year: jQuery.datepicker.formatDate('yy', view.start),
                                month: jQuery.datepicker.formatDate('mm', view.start),
                            }, true);
                        else
                            can.route.redirect({
                                year: jQuery.datepicker.formatDate('yy', view.start),
                                month: jQuery.datepicker.formatDate('mm', view.start),
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

            var view = this.element.fullCalendar('getView');
            var today = new Date();
            var year, month, update = false;

            year = route.year ? parseInt(route.year) : today.getFullYear();
            update = (update || !view.start || year != view.start.getFullYear());

            month = route.month ? parseInt(route.month)-1 : today.getMonth();
            update = (update || !view.start || month != view.start.getMonth());

            if (update)
                def.done(can.proxy(this.element.fullCalendar, this.element,
                                   'gotoDate', year, month));
            return def;
        }
    });

    return Control.Calendar;
});
