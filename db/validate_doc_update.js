function (newDoc, oldDoc, userCtx, secObj) {
    var v = require("lib/validate").init(newDoc, oldDoc, userCtx, secObj);

    // The docType is required and case insensitive
    v.require("docType");
    var docType = (oldDoc ? oldDoc.docType : newDoc.docType).toLowerCase();
    if (newDoc.docType && newDoc.docType.toLowerCase() !== docType)
        v.forbidden("You may not change the 'docType' field.");

    // Then delegate to the validator object
    try {
        var validator = require("validate/" + docType + "_update");
    } catch (err) {
        v.assert(validator, "The document type '" + docType + "' is not supported.");
    }

    // Only allow admins to delete if there is no delete validator
    if (newDoc._deleted) {
        return validator.remove ?
            validator.remove(oldDoc, userCtx, secObj, v) : v.isAdmin();
    }

    // Use the create validator if there is one, otherwise
    // we just fallback on the normal update validator.
    if (!oldDoc && validator.create)
        return validator.create(newDoc, userCtx, secObj, v);

    return validator.update ?
            validator.update(newDoc, oldDoc, userCtx, secObj, v) : true;
}
