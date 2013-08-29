steal('coplanar/db', 'can',
function(Db, can) {

    Db.CouchDB = Db.extend({
    },{
        id: '_id',
        baseURL: null,
        dbName: null,

        ajax: function(url, options) {
            options = can.extend(options || {}, {
                dataType: 'json',
                xhrFields: {
                    // This is needed to authenticate cross site request
                    withCredentials: true,
                },
            });
            return can.ajax(this.baseURL + url, options)
                .fail(function () {
                    console.log('AJAX error', arguments);
                });
        },

        dbAjax: function(url, options, def) {
            var self = this;
            // Add a wrapper around the DB to catch authentication error
            // and try to login the user.
            def = def || new can.Deferred();
            this.ajax('/' + this.dbName + url, options)
                .done(can.proxy(def.resolve, def))
                .fail(function(xhr) {
                    if (xhr.status === 401) {
                        self.loginUser()
                            .done(can.proxy(self.dbAjax, self, url, options, def))
                            .fail(can.proxy(def.reject, def, xhr));
                        return;
                    }
                    def.reject.apply(def, arguments);
                });
            return def;
        },

        updateSession: function(req) {
            var def = new can.Deferred();
            req
                .done(can.proxy(function(userCtx) {
                    // If we are logged in get the security object
                    (userCtx.name != null ?
                     this.ajax('/' + this.dbName + '/_security') :
                     can.when())
                        .done(function(securityCtx) {
                            def.resolve({
                                username: userCtx.name,
                                roles:    userCtx.roles,
                                security: securityCtx,
                            });
                        })
                        .fail(can.proxy(def.reject, def));
                }, this))
                .fail(can.proxy(def.reject, def));
            return def;
        },

        login: function(creds) {
            return this.updateSession(
                this.ajax(
                    '/_session', {
                        type: 'POST',
                        contentType: 'application/json; charset=UTF-8',
                        data: JSON.stringify(creds),
                    })
                    .then(function(userCtx) {
                        if (userCtx.ok == true && userCtx.name == null)
                            userCtx.name = creds.name;
                        return userCtx;
                    }));
        },

        getUserSession: function() {
            return this.updateSession(
                this.ajax('/_session')
                    .then(function(data) {
                        return data.userCtx;
                    }));
        },

        logout: function() {
            return this.ajax('/_session', {
                type: 'DELETE',
            });
        },

        getFindAllPath: function(model, params) {
            return '/_all_docs?include_docs=true';
        },

        serializeId: function (id) {
            return id;
        },

        findAll: function (model, params) {
            return this.dbAjax(this.getFindAllPath(model, params))
                .then(function (data) {
                    var docs = [];
                    for (var r in data.rows)
                        docs.push(data.rows[r].doc);
                    return docs;
                });
        },

        findOne: function (model, params) {
            return this.dbAjax('/' + this.serializeId(params['id']));
        },

        create: function (model, params) {
            console.log('POST', JSON.stringify(params));
            //return can.when({_id: 'id' + (new Date()).getTime(), _rev: '1-234' });
            return this.dbAjax('', {
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

        update: function (model, id, params) {
            console.log('PUT', id, JSON.stringify(params));
            if (!params['_rev'])
                throw("Can't update object without a revision!");
            //return can.when({_id: params._id, _rev: '44-newrev1234'});
            return this.dbAjax('/' + this.serializeId(id), {
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

        destroy: function (model, id) {
            console.log('DELETE', id, JSON.stringify(params));
            //return can.when({});
            return this.dbAjax('/' + this.serializeId(id), {
                type: 'DELETE',
            });
        },
    });

    can.extend(Db.CouchDB, {
        User: Db.CouchDB.extend({
            dbName: '_users',

            serializeId: function (id) {
                return 'org.couchdb.user:' + id;
            },
        }, {}),
    });

    return Db.CouchDB;
});
