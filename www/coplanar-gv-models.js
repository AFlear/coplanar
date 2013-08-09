steal("coplanar", "can",
      'coplanar/model/db',
function(coplanar, can) {
    /*
     * This module provide a constructor function that create the
     * models bound to a given database.
     */

    return function (db) {
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
        });

        models.PlannableModel = models.GVModel.extend({
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
                this.validatePresenceOf("start");
                this.validatePresenceOf("personCount");
                this.validatePresenceOf("contact");
            },
        },{
        });

        models.EventProgram = coplanar.Model.extend({
            init: function() {
                this._super.apply(this, arguments);
                this.validatePresenceOf("start");
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
            },
            getDefaultObject: function (data) {
                return this._super(can.extend({
                    hostel: [],
                    program: [],
                }, data));
            },
        },{
        });

        return models;
    };
});
