steal('can', 'can/construct/super',
function(can) {
    // The coplanar stuff boot here
    var coplanar = {
        VERSION: 'DEV',
    };
    if (steal.dev)
        window._coplanar = coplanar;

    // Make sure we can call a console.log() function
    if (window.console == null)
        window.console = {};
    if (window.console.log == null)
        window.console.log = function () {};

    Date.prototype.addDay = function(n) {
        return new Date(this.getFullYear(),
                        this.getMonth(),
                        this.getDate()+n);
    }

    Date.prototype.nextDay = function() {
        return this.addDay(1);
    }

    Date.prototype.prevDay = function() {
        return this.addDay(-1);
    }

    // Redirect the browser to another route.
    // This function allow to set the whole route 'at once'.
    // This is in contrast to using can.route.attr() that
    // fire numerous 'set' events, who in turn fire many
    // route events, some with incomplete parameter sets.
    can.route.redirect = function (route, merge) {
        if (merge)
            route = can.extend(can.route.attr(), route);
        console.log('==> Redirecting to', can.route.url(route), JSON.stringify(route));
        var hash = can.route.url(route);
        setTimeout(function() {
            window.location.hash = hash;
        }, 100);
    };

    // This replace the route, including its history entry.
    can.route.replace = function (route, merge) {
        if (merge)
            route = can.extend(can.route.attr(), route);
        console.log('==> Replacing with', can.route.url(route), JSON.stringify(route));
        var hash = can.route.url(route);
        if (hash.substr(0,1) !== '#')
            hash = '#' + hash;
        setTimeout(function() {
            window.location.replace(hash);
        }, 100);
    };

    return coplanar;
});
