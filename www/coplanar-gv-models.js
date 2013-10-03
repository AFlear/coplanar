steal("coplanar", "can",
      'coplanar/model/db',
function(coplanar, can) {
    /*
     * This module provide a constructor function that create the
     * models bound to a given database.
     */

    return function (db, session) {
        var models = {};

        // We use a large DB mixing various document types. Documents must
        // have a 'docType' field and we have a view to get all documents
        // from a given type.
        models.GVModel = coplanar.Model.Db.extend({
            db: db,
            docType: null,

            getDefaultObject: function (data) {
                return this._super(can.extend({
                    docType: this.docType,
                }, data));
            },

            getObjectContext: function() {
                return models;
            },

            init: function() {
                this.modelName = this.docType;
                this._super.apply(this, arguments);
                this.validatePresenceOf("docType");
            },
        },{
            save: function() {
                if (this.isNew()) {
                    if (this.attr('creator') == null)
                        this.attr('creator', session.username);
                    if (this.attr('creationDate') == null)
                        this.attr('creationDate',
                                  jQuery.fullCalendar.formatDate(
                                      new Date(), 'yyyy/MM/dd HH:mm:ss'));
                }
                return this._super.apply(this, arguments);
            },

            backupAttr: function(attr) {
                return attr ?
                    (this._backupStore && this._backupStore[attr]) :
                    this._backupStore;
            },
        });

        models.PlannableModel = models.GVModel.extend({
            init: function() {
                this._super.apply(this, arguments);
                this.validatePresenceOf("state");
                this.validatePresenceOf("start");
                this.validateDate("start");
                this.validateDate("end");
                //this.validatePresenceOf("title");
                this.validate(
                    "state",
                    function(value) {
                        var oldValue = this.backupAttr('state');
                        if (value == oldValue)
                            return;
                        if (value == 'unconfirmed') {
                            return 'Forbiden state';
                        } else if (value == 'confirmed') {
                            if (!this.isModelAdmin())
                                return 'Only admins can confirm';
                        } else if (value == 'canceled') {
                            if (!this.isModelAdmin())
                                return 'Only admins can cancel';
                        } else
                            return 'Invalid state';
                    });
            },
            getDefaultObject: function (data) {
                return this._super(can.extend({
                    state: 'unconfirmed',
                }, data));
            },
        },{
            isModelAdmin: function() {
                return session.isAdmin();
            },
        });

        models.Hostel = models.PlannableModel.extend({
            docType: 'Hostel',

            getDefaultObject: function (data) {
                return this._super(can.extend({
                    state: 'unconfirmed',
                    personCount: 1,
                }, data));
            },

            init: function() {
                this._super.apply(this, arguments);
                this.validatePresenceOf("personCount");
                this.validatePresenceOf("contact");
            },
        },{
        });

        models.EventProgram = coplanar.Model.extend({
            init: function() {
                this._super.apply(this, arguments);
                this.validatePresenceOf("start");
                this.validateTime("start");
                this.validatePresenceOf("showType");
                this.validatePresenceOf("title");
            },
        },{});

        models.Event = models.PlannableModel.extend({
            docType: 'Event',
            attributes: {
                'hostel': 'refList:Hostel',
                'program': 'EventProgram.models',
            },
            init: function() {
                this._super.apply(this, arguments);
                this.validatePresenceOf("eventType");
                this.validatePresenceOf("title");
                this.validate(
                    "location",
                    function(value) {
                        var oldValue = this.backupAttr('location');
                        if (value == oldValue)
                            return;
                        if (this.state == 'unconfirmed')
                            return;
                        if (session.isLocationAdmin(value))
                            return;
                        return 'Only admins can change the location';
                    });
            },
            getDefaultObject: function (data) {
                return this._super(can.extend({
                    hostel: [],
                    program: [],
                }, data));
            },
        },{
            isModelAdmin: function() {
                return session.isLocationAdmin(this.attr('location'));
            },
        });

        var UserDb = db.UserDb();
        models.User = coplanar.Model.Db.extend({
            db: new UserDb(),
        },{
        });

        return models;
    };
});
