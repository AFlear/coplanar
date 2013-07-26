steal('coplanar/base.js', 'can',
      'can/observe/validations',
function(coplanar, can) {
    var refRe = new RegExp('^(ref[^:]*):(.+)$');

    /**
     * Coplanar model
     *
     * Beside a few helpers this class add support for reference.
     */
    coplanar.Model = can.Model.extend({
        modelName: null,
        modelTypes: {},

        init: function() {
            this._super.apply(this, arguments);
            if (this.modelName) {
                var name = this.modelName;
                this.modelTypes[name] = this;

                this.serialize['ref:' + name] = can.proxy(this.serializeRef, this);
                this.convert['ref:' + name] = can.proxy(this.convertRef, this, this);

                this.serialize['refList:' + name] = can.proxy(this.serializeRefList, this);
                this.convert['refList:' + name] = can.proxy(this.convertRefList, this, this);
            }
        },

        // Return a default object for the controls. We don't override model()
        // because it must still be possible to construct empty objects for
        // the model to work properly.
        getDefaultObject: function (data) {
            if (false && data[this.id] === undefined) {
                data = can.extend({}, data);
                data[this.id] = null;
            }
            return this.model(data);
        },

        // serialize function that produce an object reference
        serializeRef: function (val) {
            if (typeof(val) === 'object')
                return val.getId();
            else if (typeof(val) === 'string')
                return val;
            else
                throw('Got bad data type to serialize as ref: ' + typeof(val));
        },

        serializeRefList: function (val) {
            var list = [];
            for (var i = 0 ; i < val.length ; i += 1)
                list.push(this.serializeRef(val[i]));
            return list;
        },

        // convert function that construct the referenced object via model()
        convertRef: function(model, raw) {
            if (raw instanceof model)
                return raw;
            return model.model(raw);
        },

        convertRefList: function(model, raw) {
            if (raw instanceof model.List)
                return raw;
            return new model.List(raw);
        },

        getReferenceAttributes: function() {
            var ret = {};
            for (var k in this.attributes) {
                var m = refRe.exec(this.attributes[k]);
                if (!m || m.length != 3)
                    continue;
                if (!this.modelTypes[m[2]])
                    throw('Reference to unknown type ' + m[2]);
                ret[k] = { refType: m[1], model: this.modelTypes[m[2]] };
            }
            return ret;
        },

        resolveReference: function (obj, attr, ref) {
            var model = ref.model;
            if (ref.refType == 'ref') {
                return model.findOne({id: obj[attr]})
                    .done(function(child) {
                        obj.attr(attr, child);
                    });
            } else if (ref.refType == 'refList') {
                var refList = can.makeArray(obj[attr]);
                var objList = [];
                var resolvers = [];
                for (var i in refList) {
                    resolvers.push(
                        model.findOne({id: refList[i]})
                            .done(function(child) {
                                objList.push(child);
                            })
                    );
                }
                return can.when.apply(can, resolvers)
                    .done(function() {
                        obj.attr(attr, model.models(objList));
                    });
            } else
                throw('Unsupported ref type: ' + refType);
        },

        resolveReferences: function(obj) {
            if (obj == null)
                return can.when(null);

            var resolvers = [];
            var refs = this.getReferenceAttributes();
            for (var attr in refs)
                if (obj[attr] != null)
                    resolvers.push(this.resolveReference(obj, attr, refs[attr]));
            return can.when.apply(can, resolvers);
        },

        makeFindOne: function (findOneData) {
            return function (filter, onSuccess, onError, deref) {
                var self = this;
                if (deref !== undefined && deref !== true)
                    return findAllData.call(this, filter)
                    .then(function(objs) {
                        return self.models(objs);
                    })
                    .then(onSuccess, onError);

                var def = new can.Deferred();
                findOneData.call(this, filter)
                    .done(function(obj) {
                        obj = self.model(obj);
                        self.resolveReferences(obj)
                            .done(can.proxy(def.resolve, def, obj))
                            .fail(can.proxy(def.reject, def));
                    })
                    .fail(can.proxy(def.reject, def));
                return def.then(onSuccess,onError);
            };
        },

        makeFindAll: function (findAllData) {
            return function (filter, onSuccess, onError, deref) {
                var self = this;
                if (deref !== true)
                    return findAllData.call(this, filter)
                    .then(function(objs) {
                        return self.models(objs);
                    })
                    .then(onSuccess, onError);

                var def = new can.Deferred();
                findAllData.call(this, filter)
                    .done(function(objs) {
                        objs = self.models(objs);
                        var resolvers = [];
                        for (var i in objs)
                            resolvers.push(self.resolveReferences(objs[i]));
                        can.when.apply(can, resolvers)
                            .done(can.proxy(def.resolve, def, objs))
                            .fail(can.proxy(def.reject, def));
                    })
                    .fail(can.proxy(def.reject, def));
                return def.then(onSuccess,onError);
            };
        },

    },{
        getId: function() {
            return this.attr(this.constructor.id);
        },

        save: function(success, error, ifDirty) {
            // Find all the referenced object
            var refs = this.constructor.getReferenceAttributes();
            var savers = []
            for (var attr in refs) {
                var val = this.attr(attr);
                if (!val)
                    continue;
                if (val.length != null) {
                    for (var i = 0 ; i < val.length ; i += 1)
                        if (ifDirty !== true || val[i].isNew() || val[i].isDirty(true))
                            savers.push(val[i].save(success, error, ifDirty));
                } else if (ifDirty !== true || val.isNew() || val.isDirty(true))
                    savers.push(val.save(success, error, ifDirty));
            }

            var def = new can.Deferred();
            var self = this;
            var _super = self._super;
            can.when.apply(can, savers)
                .done(function() {
                    // FIXME: isDirty() must properly cope with references
                    ((ifDirty !== true || self.isNew() || self.isDirty(true)) ?
                     can.Model.prototype.save.apply(self) : can.when())
                        .done(can.proxy(def.resolve, def))
                        .fail(can.proxy(def.reject, def));
                })
                .fail(can.proxy(def.reject, def));
            return (success || error) ? def.then(success, error) : def;
        },
    });

    return coplanar.Model;
});
