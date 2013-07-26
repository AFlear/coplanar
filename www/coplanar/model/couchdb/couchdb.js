steal('coplanar/model', 'can',
      'can/observe/validations',
function(Model, can) {

    Model.CouchDB = Model.extend({
        id: '_id',
        baseURL: null,
        dbName: null,

        init: function () {
            if (this.baseURL && this.User && !this.User.baseURL)
                this.User.baseURL = this.baseURL;
            this._super.apply(this, arguments);
        },

        _ajaxReq: function(url, options) {
            options = can.extend(options || {}, {
                dataType: 'json',
                xhrFields: {
                    // This is needed to authenticate cross site request
                    withCredentials: true,
                },
            });
            return can.ajax(this.baseURL + '/' + this.dbName + url, options)
                .fail(function () {
                    console.log('AJAX error', arguments);
                });
        },

        getFindAllPath: function(params) {
            return '/_all_docs?include_docs=true';
        },

        serializeId: function (id) {
            return id;
        },

        findAll: function (params) {
            return this._ajaxReq(this.getFindAllPath(params))
                .then(function (data) {
                    var docs = [];
                    for (var r in data.rows)
                        docs.push(data.rows[r].doc);
                    return docs;
                });
        },

        findOne: function (params) {
            return this._ajaxReq('/' + this.serializeId(params['id']));
        },

        create: function (params) {
            console.log('POST', JSON.stringify(params));
            //return can.when({_id: 'id' + (new Date()).getTime(), _rev: '1-234' });
            return this._ajaxReq('', {
                type: 'POST',
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify(params),
            }).then(function (data) {
                return {
                    _id: data.id,
                    _rev: data.rev,
                };
            });
        },

        update: function (id, params) {
            console.log('PUT', id, JSON.stringify(params));
            if (!params['_rev'])
                throw("Can't update object without a revision!");
            //return can.when({_id: params._id, _rev: '44-newrev1234'});
            return this._ajaxReq('/' + this.serializeId(id), {
                type: 'PUT',
                contentType: 'application/json; charset=UTF-8',
                headers: {
                    'If-Match': params['_rev'],
                },
                data: JSON.stringify(params),
            }).then(function (data) {
                return can.extend(can.extend({} , params), {
                    _rev: data.rev,
                });
            });
        },

        destroy: function (id) {
            console.log('DELETE', id, JSON.stringify(params));
            //return can.when({});
            return this._ajaxReq('/' + this.serializeId(id), {
                type: 'DELETE',
            });
        },
    }, {});

    can.extend(Model.CouchDB, {
        User: Model.CouchDB({
            dbName: '_users',

            serializeId: function (id) {
                return 'org.couchdb.user:' + id;
            },
        }, {}),
    });

    return Model.CouchDB;
});
