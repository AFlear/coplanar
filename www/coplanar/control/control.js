steal('coplanar/base.js', 'can',
      'can/control',
function(coplanar, can) {
    // Base class for all our controls
    coplanar.Control = can.Control.extend({
        defaults: {
            showEffect: null,
            showEffectOptions: null,
            hideEffect: null,
            hideEffectOptions: null,
        },
    }, {
        show: function() {
            if (this._cssDisplay)
                this.element.css('display', this._cssDisplay);
            this.element.show(this.options.showEffect, this.options.showEffectOptions);
        },

        hide: function() {
            var display = this.element.css('display')
            if (display != null && display != 'none')
                this._cssDisplay = display;
            this.element.hide(this.options.hideEffect, this.options.hideEffectOptions);
        },
    });

    return coplanar.Control;
});
