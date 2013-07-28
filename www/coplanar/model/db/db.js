steal('coplanar/model', 'can',
function(Model, can) {
    /*
     * A model that forward the access methods to a database object.
     */

    Model.Db = Model.extend({
        db: null,

        init: function() {
            // If id hasn't been defined yet try to get it from the database.
            this._super.apply(this, arguments);
            if (this.db != null && this.db.id != null)
                this.id = this.db.id;
        },

        dbDo: function(method, args) {
            args = can.makeArray(args);
            args.unshift(this);
            return this.db[method].apply(this.db, args);
        },

        findOne: function() {
            return this.dbDo('findOne', arguments);
        },

        findAll: function(filter, success, error) {
            return this.dbDo('findAll', arguments);
        },

        create: function (params) {
            return this.dbDo('create', arguments);
        },

        update: function (id, params) {
            return this.dbDo('update', arguments);
        },

        destroy: function (id) {
            return this.dbDo('destroy', arguments);
        },
    },{
    });

    return Model.Db;
});
