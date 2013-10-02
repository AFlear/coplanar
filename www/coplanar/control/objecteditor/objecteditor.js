steal('coplanar/control', 'can',
      'coplanar/control/objectview', 'can/observe/validations',
      'can/observe/backup', 'jquery-ui',
function(Control, can) {

    Control.ObjectEditor = Control.ObjectView.extend({
        defaults: {
            datePickerOptions: {
                "dateFormat": "yy/mm/dd",
            },
            dateTimePickerOptions: {
                "timeFormat": "HH:mm",
            },
        },
    },{
        open: function (obj) {
            console.log('Open editor for', obj._cid, obj.docType);
            this._super(obj);
        },

        /*
         * Utils functions for the templates
         */
        newEnv: function() {
            var editor = this;
            return can.extend({
                bindValue: function (el, attr, deflt, elAttr, data) {
                    if (data == null)
                        data = this.getData();

                    if (el.attr('name') == null)
                        el.attr('name', attr);

                    if (data.attr(attr) == undefined)
                        data.attr(attr, deflt || '');

                    function setErrors(errors) {
                        el.attr('title','Error: ' + errors[0]);
                        el.addClass('ui-state-error');
                        el.tooltip('disable');
                        el.tooltip('enable');
                    }

                    function clearErrors() {
                        el.tooltip('disable');
                        el.attr('title','');
                        el.removeClass('ui-state-error');
                    }

                    function getVal() {
                        return elAttr ? el.attr(elAttr) : el.val();
                    }

                    function validateVal() {
                        //console.log('ValidateVal!', data, attr, data.attr(attr), val)
                        var val = getVal();
                        var errors = data.errors(attr, val);
                        //console.log('ValidateVal! done', attr)
                        if (errors) {
                            setErrors(errors);
                        } else {
                            clearErrors();
                        }
                        return val;
                    }

                    function setElementVal() {
                        //console.log('setElementVal', attr, data.attr(attr));
                        if (elAttr)
                            el.attr(elAttr,data.attr(attr));
                        else
                            el.val(data.attr(attr));
                        validateVal();
                    }

                    // Activate the jquery tooltip
                    el.tooltip();

                    // Init to the object value
                    setTimeout(function () {
                        setElementVal();
                    }, 10);
                    // Bind to the data object reload event, this allow
                    // code that only have the data model signal the editor.
                    can.bind.call(data, 'reload-data', function() {
                        setElementVal();
                    });

                    return el
                        .change(function (evt) {
                            var val = validateVal();
                            data.attr(attr, val);
                        })
                        .focus(function(evt) {
                            clearErrors();
                        })
                        .blur(function(evt) {
                            validateVal();
                        });
                },

                datePicker: function (el, options) {
                    options = can.extend(options || {}, editor.options.datePickerOptions);
                    return el.datepicker(options);
                },

                dateTimePicker: function (el, options) {
                    options = can.extend(
                        can.extend(options || {}, editor.options.datePickerOptions),
                        this.options.dateTimePickerOptions);
                    return el.datetimepicker(options);
                },

                spinner: function (el, options) {
                    // Trigger a change event when using the spin controls
                    return el.spinner(options).on('spinstop', function () {
                        el.change();
                    });
                },
            }, this._super());
        },
    });

    return Control.ObjectEditor;
});
