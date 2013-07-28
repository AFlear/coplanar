steal('coplanar/base.js', 'can',
function(coplanar, can) {
    /*
     * A dummy implementation of the Db interface
     */
    coplanar.Db = can.Construct.extend({
        login: function(cred) {
            return can.extend({}, cred);
        },

        getUserSession: function(cred) {
            return can.when({});
        },

        logout: function() {
            return can.when({});
        },

        findOne: function (model, params) {
            return can.when({});
        },

        findAll: function (model, params) {
            return can.when({});
        },

        create: function (model, params) {
            return can.when({});
        },

        update: function (model, id, params) {
            return can.when({});
        },

        destroy: function (model, id) {
            return can.when({});
        },
    },{
    });

    return coplanar.Db;
});