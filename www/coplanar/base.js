steal('can', 'can/construct/super',
function(can) {
    // The coplanar stuff boot here
    var coplanar = {
        VERSION: 'DEV',
    };
    if (steal.dev)
        window._coplanar = coplanar;

    // Redirect the browser to another route.
    // This function allow to set the whole route 'at once'.
    // This is in contrast to using can.route.attr() that
    // fire numerous 'set' events, who in turn fire many
    // route events, some with incomplete parameter sets.
    can.route.redirect = function (route, merge) {
        console.log('==> Redirecting to', can.route.url(route, merge), JSON.stringify(route));
        var hash = can.route.url(route, merge);
        setTimeout(function() {
            window.location.hash = hash;
        }, 10);
    };

    // This replace the route, including its history entry.
    can.route.replace = function (route, merge) {
        console.log('==> Replacing with', can.route.url(route, merge), JSON.stringify(route));
        var hash = can.route.url(route, merge);
        if (hash.substr(0,1) !== '#')
            hash = '#' + hash;
        setTimeout(function() {
            window.location.replace(hash);
        }, 10);
    };

    return coplanar;
});
