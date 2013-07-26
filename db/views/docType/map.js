function (doc) {
    if (doc.docType)
        emit(doc.docType, doc);
}
